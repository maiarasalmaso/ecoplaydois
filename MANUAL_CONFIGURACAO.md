# Manual de Configuração do Sistema de Perguntas Dinâmicas

Este documento descreve como configurar os parâmetros do sistema de geração de perguntas via Gemini AI no EcoPlay.

## Configuração de Intervalos e Cache

O sistema utiliza um mecanismo de cache para otimizar requisições e custos. Por padrão, as perguntas geradas são armazenadas localmente por 10 minutos.

### Alterar o Tempo de Cache (TTL)

Para ajustar o tempo de validade do cache (intervalo de atualização automática se não forçado), edite o arquivo:
`src/services/gemini.js`

Localize a constante `GEMINI_CONFIG` e altere o valor de `CACHE_TTL_MS`:

```javascript
export const GEMINI_CONFIG = {
  // Tempo em milissegundos (Ex: 10 * 60 * 1000 = 10 minutos)
  CACHE_TTL_MS: 10 * 60 * 1000, 
  MAX_RETRIES: 2,
  MODEL_NAME: "gemini-2.0-flash-lite-preview-02-05"
};
```

### Forçar Atualização em Tempo Real

No jogo **EcoQuiz**, as perguntas são configuradas para serem **sempre novas** a cada partida iniciada pelo usuário. Isso é feito passando o parâmetro `bypassCache: true` na chamada do serviço.

Se desejar que o jogo reutilize perguntas recentes (cache), altere o arquivo `src/pages/games/EcoQuiz.jsx`:

```javascript
// Para usar cache (padrão):
const firstBatch = await generateQuizQuestions(age, 'sustentabilidade e ecologia', 1, false);

// Para forçar novas perguntas (atual):
const firstBatch = await generateQuizQuestions(age, 'sustentabilidade e ecologia', 1, true);
```

## Tratamento de Erros e Correção Automática

O sistema possui mecanismos automáticos para:
1. **Validação de JSON**: Se a IA retornar JSON inválido, o sistema tenta limpar a resposta ou falha graciosamente.
2. **Ortografia e Gramática**: O prompt enviado à IA instrui explicitamente a revisão gramatical.
3. **Retry**: Se a primeira tentativa falhar ou trouxer perguntas repetidas, o sistema faz até 2 novas tentativas automaticamente.
4. **Fallback**: Em caso de falha total (sem internet ou erro de API), um conjunto mínimo de perguntas locais é usado para não travar o jogo.

## Logs e Métricas

Logs detalhados são exibidos no console do navegador com o prefixo `🤖 Gemini Service Debug`.
Métricas de sucesso e tempo de resposta são salvas no `localStorage` sob a chave `ecoplay.gemini.metrics`.
