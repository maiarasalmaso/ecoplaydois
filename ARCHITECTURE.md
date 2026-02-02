# Arquitetura do Sistema de Detecção e Correção de Bugs (BugFixer Platform)

Este documento detalha a arquitetura técnica, módulos, fluxo de dados e contratos de API para a plataforma de análise estática e correção automática de código.

## 1. Visão Geral (Diagrama Mermaid)

```mermaid
graph LR
  UI[UI/UX - Frontend] --> Orchestrator[Orquestrador - Backend]
  Orchestrator --> StaticAnalyzer[Motor de Análise Estática]
  Orchestrator --> FixEngine[Motor de Correção]
  Orchestrator --> ReportEngine[Motor de Relatórios]
  Orchestrator --> VCS[Integração VCS (Git/GitHub)]
  
  subgraph Plugins
    AnalyzerPython[Analisador Python (Pylint/Bandit)]
    AnalyzerJS[Analisador JS/TS (ESLint)]
    AnalyzerGo[Analisador Go (Go Vet)]
    FixerPython[Fixer Python (Black/Autopep8)]
    FixerJS[Fixer JS (Prettier/ESLint --fix)]
  end
  
  StaticAnalyzer -->|Resultados/Issues| Orchestrator
  FixEngine -->|Patches/Diffs| VCS
  UI -->|Comandos/Feedback| Orchestrator
  ReportEngine -->|Relatórios Gerados| UI
```

## 2. Módulos Principais

### Módulo de Ingestão
- **Responsabilidade**: Receber o código fonte (URL de repositório, upload de zip ou clone direto).
- **Funções**: Autenticação com VCS, clonagem superficial (shallow clone), detecção automática de linguagens presentes.

### Módulo de Análise Estática
- **Responsabilidade**: Identificar problemas no código.
- **Categorias**: Syntax Error, Code Smell, Anti-Pattern, Security Vulnerability (SAST).
- **Extensibilidade**: Suporte a plugins por linguagem (ex: `.py` aciona Pylint, `.js` aciona ESLint).

### Módulo de Correção Automática (Fix Engine)
- **Responsabilidade**: Gerar correções para os problemas identificados.
- **Estratégias**: 
  - *Safe Fixes*: Formatação, remoção de imports não usados.
  - *Heuristic Fixes*: Refatoração sugerida (requer aprovação humana).
- **Validação**: Execução de testes (se disponíveis) para garantir que o patch não quebre a build.

### Módulo de Interface do Usuário (UI)
- **Responsabilidade**: Interação com o usuário.
- **Features**: Dashboard de bugs, visualizador de diff (antes/depois), botões de Aprovar/Rejeitar patch, configurações de regras.

### Módulo de Regras e Configuração
- **Responsabilidade**: Gerenciar o que é considerado "erro".
- **Formato**: Arquivos YAML/JSON por projeto (`.bugfixer.yml`) ou configuração global.
- **Níveis**: Ignorar, Aviso, Erro, Crítico.

### Módulo de Integração com VCS
- **Responsabilidade**: Aplicar as mudanças aprovadas.
- **Ações**: Criar branches, commitar patches, abrir Pull Requests (PRs/MRs).

### Módulo de Relatórios
- **Responsabilidade**: Gerar artefatos de saída.
- **Formatos**: JSON (para CI/CD), HTML (visualização humana), PDF (auditoria).

### Módulo de Observabilidade & Segurança
- **Logs**: Rastreamento de cada `AnalysisRun`.
- **Métricas**: Tempo de execução, taxa de sucesso de patches.
- **Segurança**: Criptografia de tokens de acesso ao VCS.

## 3. Modelos de Dados (Esboço)

### Bug
Entidade que representa um problema encontrado.
```json
{
  "bug_id": "uuid",
  "file_path": "src/main.py",
  "start_line": 10,
  "end_line": 12,
  "type": "code_smell",
  "severity": "medium",
  "message": "Variable 'x' is defined but never used",
  "status": "open", 
  "evidence": {}
}
```

### Patch
Entidade que propõe uma solução para um ou mais bugs.
```json
{
  "patch_id": "uuid",
  "bug_id": "uuid_ref",
  "author": "BugFixer Bot",
  "created_at": "2023-10-27T10:00:00Z",
  "diff_content": "@@ -10,1 +10,0 @@\n- x = 10",
  "status": "pending" 
}
```

### AnalysisRun
Execução de uma varredura em um repositório.
```json
{
  "run_id": "uuid",
  "repo_id": "string",
  "branch": "main",
  "initiator": "user_id",
  "start_time": "timestamp",
  "end_time": "timestamp",
  "summary": { "total_bugs": 5, "critical": 0 },
  "issues": ["bug_id_1", "bug_id_2"]
}
```

## 4. Contratos de API (REST)

### `POST /runs`
Inicia uma nova análise.
- **Body**: `{ "repo_url": "...", "branch": "main", "config": {...} }`
- **Response**: `{ "run_id": "...", "status": "queued" }`

### `GET /runs/{run_id}`
Obtém status e resultados.
- **Response**: `{ "status": "completed", "summary": {...}, "issues": [...] }`

### `POST /patches/{patch_id}/review`
Aprova ou rejeita uma correção.
- **Body**: `{ "action": "approve" | "reject", "notes": "..." }`
- **Response**: `{ "status": "applied", "commit_sha": "..." }`

### `GET /reports/{run_id}`
Baixa relatório.
- **Query**: `?format=pdf`
- **Response**: Binário do arquivo ou JSON.

## 5. Fluxo de Dados

1. **Trigger**: Usuário (via UI) ou Webhook (via CI) aciona `/runs`.
2. **Ingestão**: Orquestrador clona o repo temporariamente.
3. **Análise**: Orquestrador itera sobre arquivos e chama plugins (Analisadores) compatíveis.
4. **Resultados**: Bugs são salvos no banco de dados vinculados ao `run_id`.
5. **Correção**: Para cada bug, o Orquestrador consulta plugins (Fixers). Se houver fix, gera `Patch`.
6. **Revisão**: Usuário acessa UI, vê diffs.
7. **Aplicação**: Ao aprovar, o sistema aplica o patch no código e faz push para o VCS.

## 6. Stack Tecnológica Sugerida (MVP)

- **Backend**: Python (FastAPI) ou Node.js (NestJS) - facilidade de scripting.
- **Frontend**: React (Vite + Tailwind) ou Vue.js.
- **Banco de Dados**: PostgreSQL (relacional para dados estruturados) ou MongoDB (flexibilidade para logs de bugs).
- **Fila**: Redis/BullMQ ou RabbitMQ para processamento assíncrono de análises pesadas.
- **Container**: Docker para isolamento dos plugins de análise.

## 7. Critérios de Aceitação (MVP)

1. Suporte inicial a **Python** e **JavaScript**.
2. Capacidade de identificar erros de sintaxe e formatação (Linting).
3. Capacidade de aplicar *autofix* para formatação.
4. UI funcional para listar bugs e ver detalhes.
5. Relatório HTML simples ao final da execução.
