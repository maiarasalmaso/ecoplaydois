# Game Design Document (GDD): EcoGuardian - A Missão da Energia

**Versão:** 1.0  
**Data:** 08/01/2026  
**Autor:** Equipe de Design EcoPlay  
**Público-Alvo:** Crianças de 11 anos  
**Duração Estimada:** 20 minutos

---

## 1. Visão Geral

**Título:** EcoGuardian: A Missão da Energia  
**Gênero:** Simulação / Estratégia Leve / Puzzle  
**Plataforma:** Web (Navegador Desktop/Mobile)  
**Tom:** Otimista, Futurista, Colorido e Encorajador  

### Resumo do Jogo
Em *EcoGuardian*, o jogador assume o papel de um "Arquiteto do Futuro" recém-contratado para transformar uma região poluída em um paraíso sustentável. Através de três atos, o jogador deve instalar fontes de energia renovável, gerenciar o armazenamento de energia e equilibrar a demanda de uma cidade em crescimento, tudo isso enquanto combate a "Nuvem de Smog" (o antagonista abstrato que representa a poluição).

### Objetivo Pedagógico
Ensinar os fundamentos da geração de energia renovável (solar, eólica, hidráulica, biomassa), a importância do armazenamento (baterias) e o conceito de equilíbrio entre oferta e demanda na rede elétrica, utilizando uma linguagem acessível e feedback imediato.

---

## 2. Objetivos de Aprendizagem

Ao final da sessão de 20 minutos, o jogador será capaz de:
1.  **Identificar** quatro fontes principais de energia renovável e suas condições ideais de operação (ex: solar precisa de sol, eólica de vento).
2.  **Compreender** que a energia precisa ser armazenada (baterias) para ser usada quando não há geração (ex: à noite).
3.  **Entender** a relação básica de Causa e Efeito entre consumo excessivo e necessidade de geração.
4.  **Reconhecer** que a diversificação da matriz energética torna o sistema mais seguro e resiliente.

---

## 3. Mecânicas Principais

### Dinâmica de "Conectar e Energizar"
O jogador arrasta ícones de fontes de energia (painéis, turbinas) para locais pré-determinados no mapa (slots). Cada fonte tem um custo e uma produção.

### O Medidor de Equilíbrio (HUD)
Uma barra central no topo da tela mostra:
*   **Lado Esquerdo (Vermelho):** Demanda da Cidade.
*   **Lado Direito (Verde):** Geração Atual.
*   **Centro (Alvo):** Onde o jogador deve manter o ponteiro para ganhar pontos e manter a cidade feliz.

### O Ciclo Dia/Noite e Clima (Simplificado)
O tempo passa acelerado. O jogador percebe que painéis solares param de funcionar à noite, exigindo baterias ou outras fontes (eólica/biomassa) para manter as luzes acesas.

### Feedback de "Smog" vs "Natureza"
*   **Derrota (Soft Fail):** Se a energia faltar por muito tempo, a tela escurece e o "Smog" avança. O Mentor (NPC) aparece para dar uma dica e reiniciar o desafio rapidamente.
*   **Vitória:** A cidade brilha, árvores crescem ao redor e o Smog desaparece.

### Mecânica Única: "A Mochila de Energia" (Power Backpack)
O jogador tem uma "mochila" que serve como bateria portátil. Ele pode clicar para coletar excesso de energia de uma fonte cheia e "despejar" manualmente em hospitais ou escolas durante picos de demanda ou falhas na rede. Isso adiciona uma camada de ação e agência direta.

---

## 4. Níveis e Progressão (Os 3 Atos)

### Age Gate (Entrada)
*   **Tela Inicial:** "Olá, futuro Guardião! Para ajustarmos sua missão, quantos anos você tem?"
*   **Input:** Campo numérico ou slider simples.
*   **Lógica:**
    *   Se idade < 10: Ativa modo "Júnior" (textos falados, mecânicas simplificadas).
    *   Se idade >= 11: Modo Padrão (foco deste GDD).
    *   Se idade > 16: Sugere "Modo Expert" (opcional).

### Ato 1: O Despertar da Vila (Aprox. 5 min)
*   **Cenário:** Uma pequena vila rural com apagões frequentes.
*   **Objetivo:** Instalar painéis solares e turbinas eólicas básicas.
*   **Desafio:** Entender que o sol se põe.
*   **Tutorial:** O NPC "Capitão Luz" ensina a arrastar painéis.
*   **Momento "Aha!":** A luz apaga à noite. O jogador deve instalar uma bateria pequena ou uma turbina eólica (que venta à noite no jogo) para resolver.

### Ato 2: O Vale das Águas (Aprox. 8 min)
*   **Cenário:** Uma região com rio e floresta.
*   **Novas Fontes:** Hidrelétrica (geração constante, alto custo) e Biomassa (usa resíduos da floresta).
*   **Mecânica de Clima:** Começa a chover. Painéis solares caem a 20% de eficiência. Hidrelétricas sobem para 120%.
*   **Puzzle:** O jogador deve equilibrar a matriz energética para suportar uma "Semana Chuvosa".

### Ato 3: A Metrópole do Futuro (Aprox. 7 min)
*   **Cenário:** Uma cidade grande com prédios, fábricas e carros elétricos.
*   **Desafio Final:** A demanda flutua loucamente (picos de manhã e à noite).
*   **Uso da Mochila:** O jogador deve usar a "Mochila de Energia" freneticamente para salvar locais críticos enquanto constrói um sistema robusto.
*   **Vitória:** Atingir 100% de sustentabilidade e 0% de poluição por 1 minuto contínuo.

---

## 5. Personagens e Narrativa

*   **Capitão Luz (Mentor):** Um robô simpático feito de peças recicladas e uma lâmpada antiga na cabeça. Ele é otimista e faz piadas sobre "estar com a bateria fraca".
*   **Dr. Fóssil (Antagonista Cômico):** Um velho ranzinza que adora fumaça e barulho, mas que acaba sendo convencido pelo jogador de que o "silêncio da energia limpa" é melhor para sua soneca.

---

## 6. Arte, Áudio e Interface

### Diretrizes de Arte
*   **Estilo:** Flat Design 2.0 ou Low Poly vibrante.
*   **Cores:** Verde Neon, Azul Celeste, Amarelo Ouro (Energia), Cinza Escuro (Poluição).
*   **UI:** Botões grandes, arredondados. Ícones universais (Sol, Vento, Raio).
*   **Feedback Visual:** Partículas de luz voando dos geradores para as casas.

### Áudio
*   **Trilha:** Synth-pop leve e inspirador. Aumenta o ritmo quando a demanda sobe.
*   **Efeitos:** "Plim" satisfatório ao conectar cabos. Som de vento suave nas eólicas. Som de água corrente nas hidrelétricas.
*   **Acessibilidade:** Legendas para todas as falas. Opção de silenciar música mantendo SFX.

---

## 7. Conteúdo Pedagógico

### Glossário In-Game (O "EcoDex")
Um menu acessível a qualquer momento com explicações de 1 frase:
*   *Fotovoltaica:* "Transforma luz do sol em eletricidade, como mágica!"
*   *Biomassa:* "Usa restos de plantas para gerar energia. Nada se perde!"

### Quiz Rápido
Entre os atos, uma pergunta de múltipla escolha aparece para recarregar a "Mochila de Energia":
*   "O que acontece com o painel solar à noite?"
    *   A) Ele dorme.
    *   B) Ele para de gerar energia. (Correta)
    *   C) Ele vira uma lua.

---

## 8. Acessibilidade

1.  **Alto Contraste:** Modo selecionável no menu de pausa.
2.  **Tamanho de Texto:** Fonte grande por padrão (mínimo 18px em desktop).
3.  **Daltonismo:** Uso de ícones junto com cores (ex: Vermelho sempre tem um ícone de alerta/triângulo; Verde tem um check/círculo).
4.  **Leitor de Tela:** Todos os botões com etiquetas `aria-label` descritivas.

---

## 9. Requisitos Técnicos

*   **Engine:** React + Framer Motion (para animações de UI) ou Canvas API (para o mapa do jogo).
*   **Persistência:** `localStorage` para salvar o progresso entre atos caso a página recarregue.
*   **Performance:** Otimizado para rodar em Chromebooks escolares e tablets básicos.

---

## 10. Cronograma e Entregáveis

| Fase | Duração | Entregável |
|------|---------|------------|
| **Pré-Produção** | 1 Semana | GDD Final, Conceitos de Arte, Protótipo de Papel |
| **Produção Ato 1** | 2 Semanas | Mecânicas Básicas, Grid System, Arte Ato 1 |
| **Produção Ato 2** | 2 Semanas | Sistema de Clima, Novas Fontes, Arte Ato 2 |
| **Produção Ato 3** | 2 Semanas | Balanceamento, UI Final, Áudio |
| **Polimento e QA** | 1 Semana | Playtests, Bug Fixes, Acessibilidade |

**Total:** 8 Semanas para versão 1.0.

---

## 11. Riscos e Mitigações

*   **Risco:** O jogo ficar muito difícil e frustrar a criança.
    *   **Mitigação:** Sistema de "Dica Automática" se o jogador ficar 30s sem ação produtiva.
*   **Risco:** O conceito de "demanda vs oferta" ser abstrato demais.
    *   **Mitigação:** Usar metáfora visual de uma balança física na UI.
*   **Risco:** Performance ruim em dispositivos antigos.
    *   **Mitigação:** Opção de "Baixa Qualidade" que remove partículas e sombras.

---

## 12. Plano de Playtest

*   **Grupo A (Interno):** Equipe de dev joga para achar bugs.
*   **Grupo B (Educadores):** Professores validam se o conteúdo pedagógico está correto.
*   **Grupo C (Público-Alvo):** 5 crianças de 10-12 anos jogam sem instrução prévia. Observar onde travam e o que os faz sorrir.

---

## 13. Anexos

### Anexo A: Tabela de Fontes de Energia
| Fonte | Custo | Geração | Condição |
|-------|-------|---------|----------|
| Solar | Baixo | Média | Apenas Dia |
| Eólica | Médio | Alta | Vento Variável |
| Hidro | Alto | Muito Alta | Constante (Cai na Seca) |
| Biomassa| Médio | Média | Constante (Requer Resíduos) |

### Anexo B: Wireframes (Descrição)
*   **Tela de Jogo:** Mapa isométrico central. Barra de recursos no topo. Inventário de construções na parte inferior. Botão de "Mochila" no canto inferior direito.

---
*Fim do Documento*
