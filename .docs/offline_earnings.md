# Sistema de Ganhos Offline (Idle Game)

## 📋 Visão Geral

O EcoPlay implementa um sistema de **ganhos passivos offline** que permite aos usuários acumular energia e créditos mesmo quando não estão jogando ativamente.

## 🔧 Como Funciona

### 1. Salvamento do Timestamp
Quando o usuário sai do jogo (ou fecha o navegador), o sistema salva:
- `saved_energy`: Energia atual
- `saved_credits`: Créditos atuais  
- `saved_modules`: Módulos instalados (solar, wind, hydro)
- `last_save_timestamp`: Timestamp exato do último salvamento

### 2. Cálculo de Ganhos Offline
Quando o usuário retorna e faz login:

```javascript
// 1. Busca dados do servidor
const serverData = await getProgress(userId);

// 2. Calcula tempo offline
const offlineSeconds = (Date.now() - serverData.stats.last_save_timestamp) / 1000;

// 3. Calcula produção por segundo dos módulos
const prodPerSec = Object.entries(modules).reduce((total, [id, level]) => {
  const stats = MODULE_STATS[id];
  return total + (stats.baseProd * level);
}, 0);

// 4. Calcula ganhos totais
const offlineEarnings = prodPerSec * offlineSeconds;
const offlineCredits = Math.floor(offlineEarnings * 0.1); // 10% vira créditos

// 5. Aplica os ganhos
finalEnergy = savedEnergy + offlineEarnings;
finalCredits = savedCredits + offlineCredits;
```

### 3. Sincronização com Servidor
- **Apenas o valor final** é salvo no servidor
- **Não há histórico** de cada tick individual
- Isso economiza espaço no banco de dados e reduz requisições

## 📊 Exemplo Prático

### Cenário:
- Usuário tem **1 Painel Solar** (nível 1) = 10 energia/s
- Usuário sai do jogo às **10:00**
- Usuário volta às **12:00** (2 horas depois)

### Cálculo:
```
Tempo offline = 2 horas = 7200 segundos
Produção = 10 energia/s
Ganhos = 10 * 7200 = 72,000 energia
Créditos = 72,000 * 0.1 = 7,200 créditos
```

### Resultado:
Quando o usuário faz login:
```
[Sync] ⏰ Offline for 7200s (120min)
[Sync] 💰 Earned 72000 energy + 7200 credits
```

## 🎮 Módulos e Produção

| Módulo | Produção Base | Custo Upgrade |
|--------|---------------|---------------|
| Solar  | 10/s          | 100 créditos  |
| Wind   | 25/s          | 250 créditos  |
| Hydro  | 50/s          | 500 créditos  |

## 🔐 Segurança

### Prevenção de Exploits:
1. **Server-Side Validation**: O timestamp é validado no servidor
2. **Limite de Tempo**: Pode-se adicionar um limite máximo (ex: 7 dias)
3. **Validação de Módulos**: Verifica se o usuário realmente possui os módulos

### Exemplo de Limite:
```javascript
const MAX_OFFLINE_HOURS = 24 * 7; // 7 dias
const offlineSeconds = Math.min(
  Math.floor((now - lastSaveTimestamp) / 1000),
  MAX_OFFLINE_HOURS * 3600
);
```

## 📱 Comportamento Cross-Device

### PC → Mobile:
1. Usuário joga no PC, acumula 10,000 energia
2. Fecha o navegador às 14:00
3. Abre no celular às 16:00
4. Sistema calcula: 2h offline × produção = ganhos
5. Aplica ganhos e salva no servidor

### Mobile → PC:
1. Usuário joga no celular, tem 5,000 energia
2. Fecha o app às 20:00
3. Abre no PC às 08:00 (12h depois)
4. Sistema calcula ganhos offline
5. Sincroniza com servidor

## 🐛 Debug

### Logs Importantes:
```javascript
[Sync] ⏰ Offline for 3600s (60min)
[Sync] 💰 Earned 36000 energy + 3600 credits
[Sync] ✅ Applying server data: { energy: 46000, credits: 8600 }
```

### Verificar no Console:
```javascript
// Ver timestamp do último save
const progress = await getProgress(userId);
console.log('Last save:', new Date(progress.stats.last_save_timestamp));

// Ver tempo offline
const offlineMs = Date.now() - progress.stats.last_save_timestamp;
console.log('Offline:', Math.floor(offlineMs / 1000 / 60), 'minutes');
```

## 🚀 Melhorias Futuras

1. **Limite de Tempo**: Adicionar cap de 7 dias
2. **Notificação**: Mostrar toast com ganhos offline
3. **Boost Offline**: Itens que aumentam ganhos offline
4. **Histórico**: Página mostrando ganhos das últimas sessões
