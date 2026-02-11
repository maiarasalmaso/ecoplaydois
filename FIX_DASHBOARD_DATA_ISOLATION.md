# 🔒 Correção: Isolamento de Dados por Usuário no Dashboard

## 📋 Problema Identificado

Quando um novo usuário criava uma conta e acessava o Dashboard, ele via métricas (EcoCredits, Energia, Produção) de outro usuário ou valores não zerados, em vez de começar com **ZERO**.

## 🔍 Causa Raiz

1. **Backend retornava `null`** para novos usuários sem criar um registro inicial
2. **Frontend não limpava estado** ao fazer logout ou trocar de usuário
3. **LocalStorage persistia dados** entre sessões de diferentes usuários
4. **Falta de inicialização explícita** de todos os estados para novos usuários

## ✅ Correções Implementadas

### 1. **Backend: Criação Automática de Registro Zerado** (`api/_src/routes/progress.ts`)

**Antes:**
```typescript
if (result.rows.length === 0) {
    console.log(`[API] No progress found for user ${userId}`);
    return res.json(null); // ❌ Retornava null
}
```

**Depois:**
```typescript
if (result.rows.length === 0) {
    console.log(`[API] No progress found for user ${userId}. Creating initial zeroed record...`);
    
    // ✅ Cria registro inicial ZERADO
    const initialProgress = {
        score: 0,
        badges: [],
        badge_unlocks: {},
        stats: {
            xp: 0,
            logins: 1,
            streak: 0,
            timeSpentSeconds: 0,
            saved_energy: 0,
            saved_credits: 0,
            saved_modules: {}
        },
        completed_levels: {},
        last_daily_xp_date: null,
        unclaimed_rewards: [],
        energy: 0,
        eco_credits: 0
    };

    const insertResult = await query(`
        INSERT INTO progress (...)
        VALUES (...)
        RETURNING *
    `, [...]);

    return res.json(insertResult.rows[0]);
}
```

**Impacto:** Garante que TODOS os novos usuários tenham um registro inicial com valores zerados no banco de dados.

---

### 2. **Frontend: Limpeza Completa no Logout** (`src/context/AuthContext.jsx`)

**Antes:**
```javascript
const logout = () => {
    localStorage.removeItem('ecoplay_token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];
}; // ❌ Não limpava dados do jogo
```

**Depois:**
```javascript
const logout = () => {
    // Clear authentication
    localStorage.removeItem('ecoplay_token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];

    // 🔒 CRITICAL: Clear ALL game state to prevent data leakage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (
        key.startsWith('ecoplay_progress_') ||
        key.startsWith('ecoplay_modules_') ||
        key.startsWith('ecoplay_energy_') ||
        key.startsWith('ecoplay_credits_') ||
        key.startsWith('ecoplay_last_time_')
      )) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    console.log('[Auth] Logout complete. All user data cleared.');
};
```

**Impacto:** Remove TODOS os dados de progresso do localStorage ao fazer logout, evitando vazamento de dados.

---

### 3. **Frontend: Inicialização Explícita para Novos Usuários** (`src/context/GameStateContext.jsx`)

**Antes:**
```javascript
} else {
    // Initialize with daily bonus for new user
    const today = dateOnlyNowLondrina();
    const bonus = 50;
    setScore(bonus);
    setLastDailyXpDate(today);
    setDailyBonus({ amount: bonus, streak: 1 });
    // ❌ Não zerava energia, créditos, módulos, etc.
}
```

**Depois:**
```javascript
} else {
    // 🔒 CRITICAL: Initialize ALL state to ZERO for new user
    console.log('[Sync] Initializing fresh user with zeroed state');
    const today = dateOnlyNowLondrina();
    const bonus = 50;
    
    // Explicitly zero out ALL state
    setScore(bonus);
    setEcoCredits(0);
    setEnergy(0);
    setModules({});
    setBadges([]);
    setBadgeUnlocks({});
    setStats({ xp: bonus, logins: 1, streak: 1, timeSpentSeconds: 0 });
    setCompletedLevels({});
    setLastDailyXpDate(today);
    setDailyBonus({ amount: bonus, streak: 1 });
    setUnclaimedRewards([]);
}
```

**Impacto:** Garante que TODOS os estados sejam explicitamente zerados para novos usuários.

---

### 4. **Frontend: Detecção de Mudança de Usuário** (`src/context/GameStateContext.jsx`)

**Adicionado:**
```javascript
const prevUserIdRef = useRef(null); // Track user changes

// 🔒 CRITICAL: Detect user change and reset state
useEffect(() => {
    const currentUserId = user?.id || null;
    const previousUserId = prevUserIdRef.current;

    // If user changed (login/logout/switch account)
    if (previousUserId !== null && currentUserId !== previousUserId) {
      console.log(`[GameState] User changed from ${previousUserId} to ${currentUserId}. Resetting state...`);
      
      // Reset ALL state to prevent data leakage
      setScore(0);
      setEcoCredits(0);
      setEnergy(0);
      setModules({});
      setBadges([]);
      setBadgeUnlocks({});
      setStats({});
      setCompletedLevels({});
      setLastDailyXpDate(null);
      setDailyBonus(null);
      setUnclaimedRewards([]);
      setIsLoaded(false); // Trigger reload
    }

    prevUserIdRef.current = currentUserId;
}, [user?.id]);
```

**Impacto:** Detecta quando o usuário muda (login/logout/troca de conta) e reseta COMPLETAMENTE o estado, evitando que dados do usuário anterior sejam exibidos.

---

## 🧪 Como Testar

### Teste 1: Novo Usuário
1. Criar uma nova conta
2. Acessar o Dashboard
3. **Verificar:** EcoCredits = 0, Energia = 0, Produção = 0/s

### Teste 2: Troca de Usuário
1. Fazer login com Usuário A (que tem dados)
2. Fazer logout
3. Fazer login com Usuário B (novo ou diferente)
4. **Verificar:** Dashboard do Usuário B mostra APENAS seus dados (não os do Usuário A)

### Teste 3: Persistência
1. Fazer login
2. Jogar e acumular recursos
3. Fazer logout
4. Fazer login novamente
5. **Verificar:** Seus dados foram salvos corretamente

---

## 🔐 Garantias de Segurança

✅ **Isolamento de Dados:** Cada usuário vê apenas seus próprios dados  
✅ **Limpeza no Logout:** Todos os dados são removidos do localStorage  
✅ **Detecção de Mudança:** Estado é resetado ao trocar de usuário  
✅ **Inicialização Zerada:** Novos usuários sempre começam com 0  
✅ **Persistência Segura:** Dados são salvos no servidor com `userId` único  

---

## 📝 Arquivos Modificados

1. `api/_src/routes/progress.ts` - Criação automática de registro zerado
2. `src/context/AuthContext.jsx` - Limpeza completa no logout
3. `src/context/GameStateContext.jsx` - Inicialização explícita e detecção de mudança de usuário

---

## 🚀 Deploy

Para aplicar as correções em produção:

```bash
# 1. Build do backend
cd api
npm run build

# 2. Deploy na Vercel (se estiver usando)
vercel --prod

# Ou commit e push para deploy automático
git add .
git commit -m "fix: garantir isolamento de dados por usuário no dashboard"
git push origin main
```

---

## ✅ Status

- [x] Backend: Criação automática de registro zerado
- [x] Frontend: Limpeza completa no logout
- [x] Frontend: Inicialização explícita para novos usuários
- [x] Frontend: Detecção de mudança de usuário
- [ ] Testes manuais (aguardando deploy)
- [ ] Validação em produção

---

**Data:** 2026-02-11  
**Prioridade:** 🔴 CRÍTICA (Segurança de Dados)  
**Complexidade:** 8/10
