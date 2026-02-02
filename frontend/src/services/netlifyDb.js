import { neon } from '@netlify/neon';
import bcrypt from 'bcrypt';
import { validateEmail, validateName, validatePassword, validateAge, sanitizeInput } from '../utils/validation.js';

// Configuração do banco de dados Netlify Neon
const sql = neon();

// Estrutura de dados para usuários
const createUsersTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        age INTEGER NOT NULL,
        avatar VARCHAR(255) DEFAULT 'default',
        streak INTEGER DEFAULT 0,
        last_login_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `;
    
    console.log('Tabela de usuários criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar tabela de usuários:', error);
    throw error;
  }
};

// Estrutura de dados para progresso do usuário
const createProgressTable = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS user_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        badges JSONB DEFAULT '[]'::jsonb,
        completed_levels JSONB DEFAULT '{}'::jsonb,
        stats JSONB DEFAULT '{}'::jsonb,
        last_daily_xp_date DATE,
        unclaimed_rewards JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_progress_user_id ON user_progress(user_id)
    `;
    
    console.log('Tabela de progresso criada com sucesso');
  } catch (error) {
    console.error('Erro ao criar tabela de progresso:', error);
    throw error;
  }
};

// Funções de autenticação segura com bcrypt
const hashPassword = async (password) => {
  const saltRounds = 12; // Nível de segurança elevado
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Operações CRUD para usuários
export const createUser = async ({ email, name, password, age }) => {
  try {
    // Validação de inputs
    const emailValidation = validateEmail(email);
    if (!emailValidation) {
      throw new Error('Email inválido');
    }
    
    const nameValidation = validateName(name);
    if (!nameValidation.isValid) {
      throw new Error(nameValidation.error);
    }
    
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }
    
    const ageValidation = validateAge(age);
    if (!ageValidation.isValid) {
      throw new Error(ageValidation.error);
    }
    
    const passwordHash = await hashPassword(password);
    const today = new Date().toISOString().split('T')[0];
    
    const result = await sql`
      INSERT INTO users (email, name, password_hash, age, streak, last_login_date)
      VALUES (${email}, ${nameValidation.sanitized}, ${passwordHash}, ${age}, 1, ${today})
      RETURNING id, email, name, age, avatar, streak, last_login_date, created_at
    `;
    
    // Criar progresso inicial
    await createUserProgress(result[0].id);
    
    return result[0];
  } catch (error) {
    if (error.code === '23505') { // Duplicate email
      throw new Error('Email já cadastrado');
    }
    throw error;
  }
};

export const getUserByEmail = async (email) => {
  try {
    // Validar email antes da query
    if (!validateEmail(email)) {
      throw new Error('Email inválido');
    }
    
    const result = await sql`
      SELECT id, email, name, age, avatar, streak, last_login_date, created_at
      FROM users
      WHERE email = ${email}
    `;
    
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error);
    throw error;
  }
};

export const getUserById = async (id) => {
  try {
    const result = await sql`
      SELECT id, email, name, age, avatar, streak, last_login_date, created_at
      FROM users
      WHERE id = ${id}
    `;
    
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário por ID:', error);
    throw error;
  }
};

// Função específica para autenticação (retorna password_hash)
export const getUserForAuth = async (email) => {
  try {
    // Validar email antes da query
    if (!validateEmail(email)) {
      throw new Error('Email inválido');
    }
    
    const result = await sql`
      SELECT id, email, name, password_hash, age, avatar, streak, last_login_date, created_at
      FROM users
      WHERE email = ${email}
    `;
    
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao buscar usuário para autenticação:', error);
    throw error;
  }
};

export const updateUser = async (id, updates) => {
  try {
    // Whitelist de campos permitidos para segurança
    const allowedFields = ['name', 'email', 'age', 'avatar', 'streak', 'last_login_date'];
    const validUpdates = {};
    
    // Filtrar e validar apenas campos permitidos
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        switch (key) {
          case 'email':
            if (validateEmail(value)) {
              validUpdates[key] = value;
            }
            break;
          case 'name': {
            const nameValidation = validateName(value);
            if (nameValidation.isValid) {
              validUpdates[key] = nameValidation.sanitized;
            }
            break;
          }
          case 'age': {
            const ageValidation = validateAge(value);
            if (ageValidation.isValid) {
              validUpdates[key] = value;
            }
            break;
          }
          case 'avatar':
          case 'streak':
          case 'last_login_date':
            // Sanitizar strings e validar tipos
            if (typeof value === 'string') {
              const sanitized = sanitizeInput(value, 500);
              validUpdates[key] = sanitized.sanitized;
            } else {
              validUpdates[key] = value;
            }
            break;
          default:
            validUpdates[key] = value;
        }
      }
    }
    
    if (Object.keys(validUpdates).length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }
    
    // Construir query de forma segura com prepared statements
    const setClause = Object.keys(validUpdates)
      .map((key) => sql`${sql.identifier(key)} = ${validUpdates[key]}`)
      .reduce((acc, curr, index) => index === 0 ? curr : sql`${acc}, ${curr}`);
    
    const result = await sql`
      UPDATE users
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, email, name, age, avatar, streak, last_login_date, updated_at
    `;
    
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    await sql`
      DELETE FROM users
      WHERE id = ${id}
    `;
    
    return true;
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    throw error;
  }
};

// Operações de progresso
const createUserProgress = async (userId) => {
  try {
    await sql`
      INSERT INTO user_progress (user_id, score, level, badges, completed_levels, stats)
      VALUES (${userId}, 0, 1, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb)
    `;
  } catch (error) {
    console.error('Erro ao criar progresso do usuário:', error);
    throw error;
  }
};

export const getUserProgress = async (userId) => {
  try {
    const result = await sql`
      SELECT * FROM user_progress
      WHERE user_id = ${userId}
    `;
    
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao buscar progresso do usuário:', error);
    throw error;
  }
};

export const updateUserProgress = async (userId, updates) => {
  try {
    // Whitelist de campos permitidos para progresso
    const allowedFields = ['score', 'level', 'badges', 'completed_levels', 'stats'];
    const validUpdates = {};
    
    // Filtrar apenas campos permitidos
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        validUpdates[key] = value;
      }
    }
    
    if (Object.keys(validUpdates).length === 0) {
      throw new Error('Nenhum campo válido para atualização');
    }
    
    // Construir query de forma segura com prepared statements
    const setClause = Object.keys(validUpdates)
      .map((key) => sql`${sql.identifier(key)} = ${validUpdates[key]}`)
      .reduce((acc, curr, index) => index === 0 ? curr : sql`${acc}, ${curr}`);
    
    const result = await sql`
      UPDATE user_progress
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING *
    `;
    
    return result[0] || null;
  } catch (error) {
    console.error('Erro ao atualizar progresso do usuário:', error);
    throw error;
  }
};

// Sincronização de dados entre dispositivos
export const syncUserData = async (userId, localData) => {
  try {
    // Buscar dados atuais do servidor
    const serverUser = await getUserById(userId);
    const serverProgress = await getUserProgress(userId);
    
    if (!serverUser || !serverProgress) {
      throw new Error('Usuário ou progresso não encontrado');
    }
    
    // Mesclar dados locais com servidor (servidor tem prioridade)
    const mergedUser = {
      ...serverUser,
      streak: Math.max(serverUser.streak, localData.streak || 0),
      last_login_date: localData.lastLoginDate || serverUser.last_login_date,
    };
    
    const mergedProgress = {
      ...serverProgress,
      score: Math.max(serverProgress.score, localData.score || 0),
      level: Math.max(serverProgress.level, localData.level || 1),
      badges: [...new Set([...serverProgress.badges, ...(localData.badges || [])])],
      completed_levels: {
        ...serverProgress.completed_levels,
        ...localData.completedLevels,
      },
      stats: {
        ...serverProgress.stats,
        ...localData.stats,
      },
    };
    
    // Atualizar servidor com dados mesclados
    await updateUser(userId, mergedUser);
    await updateUserProgress(userId, mergedProgress);
    
    return {
      user: mergedUser,
      progress: mergedProgress,
    };
  } catch (error) {
    console.error('Erro ao sincronizar dados:', error);
    throw error;
  }
};

// Funções de backup e restore
export const backupUserData = async (userId) => {
  try {
    const user = await getUserById(userId);
    const progress = await getUserProgress(userId);
    
    return {
      user,
      progress,
      backupDate: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Erro ao fazer backup dos dados:', error);
    throw error;
  }
};

export const restoreUserData = async (userId, backupData) => {
  try {
    await updateUser(userId, backupData.user);
    await updateUserProgress(userId, backupData.progress);
    
    return true;
  } catch (error) {
    console.error('Erro ao restaurar dados:', error);
    throw error;
  }
};

// Inicialização do banco de dados
export const initializeNetlifyDb = async () => {
  try {
    await createUsersTable();
    await createProgressTable();
    console.log('Banco de dados Netlify inicializado com sucesso');
  } catch (error) {
    console.error('Erro ao inicializar banco de dados Netlify:', error);
    throw error;
  }
};

// Exportar funções principais
export default {
  initializeNetlifyDb,
  createUser,
  getUserByEmail,
  getUserById,
  updateUser,
  deleteUser,
  getUserProgress,
  updateUserProgress,
  syncUserData,
  backupUserData,
  restoreUserData,
  hashPassword,
  verifyPassword,
};