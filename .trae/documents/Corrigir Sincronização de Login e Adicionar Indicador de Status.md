O problema de "não salvar o login" ocorre porque o script de banco de dados anterior não criou algumas colunas (`local_user_id`) e funções (`ecoplay_register_profile`) que o código do site espera. Sem elas, o site não consegue gravar os dados no Supabase.

Vou corrigir isso e adicionar o indicador de status do servidor.

### Plano de Ação

1.  **Corrigir o Banco de Dados (SQL)**
    *   Fornecer um novo script SQL para ser rodado no Supabase.
    *   Este script irá:
        *   Adicionar a coluna `local_user_id` nas tabelas `profiles` e `progress` (essencial para sincronizar com o localStorage).
        *   Criar a "Function" (RPC) `ecoplay_register_profile` que o código tenta chamar ao cadastrar.

2.  **Adicionar Indicador "Online/Offline" no Header**
    *   Modificar o componente `Header.jsx`.
    *   Exibir um indicador visual claro:
        *   🟢 **Online**: Quando conectado ao Supabase.
        *   🔴 **Offline**: Quando no modo local.
    *   Isso atende ao seu pedido de "aparecer servidor online ou nao".

3.  **Documentação**
    *   Atualizar o arquivo `docs/configurar-banco-dados.md` com o script SQL corrigido para referência futura.

**Por favor, confirme para eu aplicar as mudanças no código e gerar o script SQL para você.**