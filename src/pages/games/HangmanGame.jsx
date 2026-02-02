import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sun, Wind, Zap, Leaf, Droplets, Trophy, Star, BookOpen, Award, TrendingUp, Users, Shield, Sparkles, Brain, Heart, Lightbulb, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGameState } from '../../context/GameStateContext';
import { playClick, playSuccess, playError } from '../../utils/soundEffects';
import api from '../../services/api';

// Sistema educacional GBL - Game-Based Learning
const ENERGY_EDUCATION = {
  solar: {
    word: 'SOLAR',
    hint: 'Energia obtida da luz do sol',
    difficulty: 'easy',
    educationalContent: {
      definition: 'A energia solar é a energia obtida diretamente da radiação solar. É uma fonte limpa, renovável e abundante.',
      funFact: '☀️ O sol fornece mais energia à Terra em uma hora do que a humanidade usa em um ano inteiro!',
      environmentalImpact: 'Reduz emissões de CO2 em até 95% comparado às fontes fósseis',
      realWorldApplication: 'Painéis solares em casas, calculadoras, lanternas e estações espaciais',
      learningObjective: 'Compreender como a luz solar pode ser convertida em energia elétrica'
    },
    gblRewards: {
      xp: 100,
      badge: 'Iniciante Solar',
      achievement: 'Primeira Energia Limpa'
    }
  },
  eolica: {
    word: 'EOLICA',
    hint: 'Energia gerada pelo vento',
    difficulty: 'easy',
    educationalContent: {
      definition: 'Energia eólica é a energia obtida através do movimento do ar (vento) que gira turbinas para gerar eletricidade.',
      funFact: '🌪️ Um único aerogerador pode abastecer até 1.500 casas!',
      environmentalImpact: 'É uma das energias mais limpas, sem emissões durante a operação',
      realWorldApplication: 'Parques eólicos em áreas costeiras e montanhosas',
      learningObjective: 'Entender como o movimento do ar pode ser transformado em energia elétrica'
    },
    gblRewards: {
      xp: 100,
      badge: 'Mestre do Vento',
      achievement: 'Ventania Verde'
    }
  },
  hidreletrica: {
    word: 'HIDRELETRICA',
    hint: 'Energia da força da água',
    difficulty: 'medium',
    educationalContent: {
      definition: 'Energia hidrelétrica é produzida pela força da água em movimento (rios, quedas d\'água) que gira turbinas.',
      funFact: '💧 A primeira usina hidrelétrica do mundo foi construída em 1882 na Inglaterra!',
      environmentalImpact: 'Renovável, mas pode impactar ecossistemas aquáticos locais',
      realWorldApplication: 'Grandes barragens como Itaipu e Belo Monte',
      learningObjective: 'Compreender como a energia cinética da água é convertida em eletricidade'
    },
    gblRewards: {
      xp: 200,
      badge: 'Expert em Água',
      achievement: 'Corrente Verde'
    }
  },
  biomassa: {
    word: 'BIOMASSA',
    hint: 'Energia de materiais orgânicos',
    difficulty: 'medium',
    educationalContent: {
      definition: 'Biomassa é energia obtida a partir de materiais orgânicos como restos de plantas, esterco e resíduos agrícolas.',
      funFact: '🌱 A biomassa é uma das primeiras fontes de energia usadas pela humanidade (fogo)!',
      environmentalImpact: 'Reutiliza resíduos, mas precisa ser gerenciada corretamente',
      realWorldApplication: 'Biogás em usinas de tratamento de esgoto, queima de cana-de-açúcar',
      learningObjective: 'Aprender como resíduos orgânicos podem ser transformados em energia'
    },
    gblRewards: {
      xp: 200,
      badge: 'Reciclador de Vida',
      achievement: 'Ciclo da Natureza'
    }
  },
  geotermica: {
    word: 'GEOTERMICA',
    hint: 'Energia do calor da Terra',
    difficulty: 'hard',
    educationalContent: {
      definition: 'Energia geotérmica é o calor natural proveniente do interior da Terra, aproveitado para gerar eletricidade ou aquecimento.',
      funFact: '🌋 A palavra vem do grego: "geo" (terra) + "therme" (calor)!',
      environmentalImpact: 'Extremamente limpa e disponível 24 horas por dia',
      realWorldApplication: 'Usinas na Islândia, Itália e Califórnia',
      learningObjective: 'Descobrir como o calor interno da Terra pode ser aproveitado'
    },
    gblRewards: {
      xp: 300,
      badge: 'Explorador Terrestre',
      achievement: 'Fogo do Planeta'
    }
  },
  maretriz: {
    word: 'MAREMOTRIZ',
    hint: 'Energia das marés e ondas',
    difficulty: 'hard',
    educationalContent: {
      definition: 'Energia das marés aproveita o movimento natural das marés para gerar eletricidade.',
      funFact: '🌊 A força das marés é tão previsível quanto as fases da lua!',
      environmentalImpact: 'Renovável e previsível, mas com impacto local nos ecossistemas',
      realWorldApplication: 'Barragens de marés na França e Coreia do Sul',
      learningObjective: 'Compreender como o movimento das marés pode gerar energia'
    },
    gblRewards: {
      xp: 300,
      badge: 'Senhor das Marés',
      achievement: 'Oceano de Energia'
    }
  },
  fotovoltaica: {
    word: 'FOTOVOLTAICA',
    hint: 'Tipo de painel solar',
    difficulty: 'hard',
    educationalContent: {
      definition: 'Células fotovoltaicas são dispositivos que convertem luz solar diretamente em eletricidade usando semicondutores.',
      funFact: '⚡ O efeito fotovoltaico foi descoberto em 1839 por Alexandre-Edmond Becquerel!',
      environmentalImpact: 'Fabricação requer energia, mas compensa em 1-4 anos de uso',
      realWorldApplication: 'Painéis solares em residências, empresas e usinas solares',
      learningObjective: 'Entender o princípio da conversão fotovoltaica da luz em eletricidade'
    },
    gblRewards: {
      xp: 300,
      badge: 'Cientista Solar',
      achievement: 'Efeito Luz-Vida'
    }
  },
  biogas: {
    word: 'BIOGAS',
    hint: 'Gás produzido de resíduos',
    difficulty: 'medium',
    educationalContent: {
      definition: 'Biogás é um gás combustível produzido pela decomposição anaeróbica (sem oxigênio) de matéria orgânica.',
      funFact: '💨 O biogás é composto principalmente por metano (CH4) e dióxido de carbono (CO2)!',
      environmentalImpact: 'Reduz metano na atmosfera e reutiliza resíduos orgânicos',
      realWorldApplication: 'Biodigestores em propriedades rurais, aterros sanitários',
      learningObjective: 'Aprender como a decomposição controlada produz gás combustível'
    },
    gblRewards: {
      xp: 200,
      badge: 'Alquimista Verde',
      achievement: 'Transformação Orgânica'
    }
  },
  turbina: {
    word: 'TURBINA',
    hint: 'Dispositivo que converte energia cinética',
    difficulty: 'easy',
    educationalContent: {
      definition: 'Turbina é uma máquina rotativa que converte a energia de um fluido (água, vapor, ar) em energia mecânica.',
      funFact: '🌀 O princípio da turbina foi inspirado nos moinhos de vento medievais!',
      environmentalImpact: 'Fundamental para a maioria das fontes de energia renovável',
      realWorldApplication: 'Turbinas em usinas hidrelétricas, eólicas e termelétricas',
      learningObjective: 'Compreender como a energia dos fluidos é convertida em movimento rotativo'
    },
    gblRewards: {
      xp: 100,
      badge: 'Engenheiro de Fluxo',
      achievement: 'Roda da Energia'
    }
  },
  painel: {
    word: 'PAINEL',
    hint: 'Dispositivo para captar energia solar',
    difficulty: 'easy',
    educationalContent: {
      definition: 'Painel solar é um conjunto de células fotovoltaicas que captam e convertem luz solar em eletricidade.',
      funFact: '🏠 Um painel solar típico pode gerar 250-400 watts de potência!',
      environmentalImpact: 'Reduz dependência de combustíveis fósseis por 25-30 anos',
      realWorldApplication: 'Telhados solares, usinas solares, calculadoras, relógios',
      learningObjective: 'Identificar componentes e funcionamento básico de painéis solares'
    },
    gblRewards: {
      xp: 100,
      badge: 'Coletor Solar',
      achievement: 'Captação de Luz'
    }
  }
};

// Sistema de conquistas GBL
const ACHIEVEMENTS = {
  firstWord: {
    id: 'firstWord',
    title: 'Primeira Palavra',
    description: 'Complete sua primeira palavra sobre energia renovável',
    icon: '🌱',
    xp: 50,
    unlocked: false
  },
  solarExpert: {
    id: 'solarExpert',
    title: 'Especialista Solar',
    description: 'Complete 3 palavras sobre energia solar',
    icon: '☀️',
    xp: 150,
    unlocked: false
  },
  windMaster: {
    id: 'windMaster',
    title: 'Mestre dos Ventos',
    description: 'Complete 3 palavras sobre energia eólica',
    icon: '💨',
    xp: 150,
    unlocked: false
  },
  renewableChampion: {
    id: 'renewableChampion',
    title: 'Campeão Renovável',
    description: 'Complete palavras de todas as dificuldades',
    icon: '🏆',
    xp: 300,
    unlocked: false
  },
  perfectScore: {
    id: 'perfectScore',
    title: 'Pontuação Perfeita',
    description: 'Ganhe com todas as tentativas restantes',
    icon: '⭐',
    xp: 200,
    unlocked: false
  },
  quickLearner: {
    id: 'quickLearner',
    title: 'Aprendiz Rápido',
    description: 'Complete uma palavra em menos de 30 segundos',
    icon: '⚡',
    xp: 100,
    unlocked: false
  },
  persistent: {
    id: 'persistent',
    title: 'Persistente',
    description: 'Tente 10 palavras diferentes',
    icon: '🎯',
    xp: 250,
    unlocked: false
  },
  ecoWarrior: {
    id: 'ecoWarrior',
    title: 'Guerreiro Eco',
    description: 'Aprenda sobre 5 tipos diferentes de energia renovável',
    icon: '🛡️',
    xp: 400,
    unlocked: false
  }
};

const HangmanGame = () => {
  const { addScore, updateStat } = useGameState();

  // Estados básicos
  const [gameState, setGameState] = useState('menu'); // menu, playing, result, achievements, learning
  const [difficulty, setDifficulty] = useState('easy');
  const [word, setWord] = useState('');
  const [hint, setHint] = useState('');
  const [guessedLetters, setGuessedLetters] = useState([]);
  const [attemptsLeft, setAttemptsLeft] = useState(6);
  const [score, setScore] = useState(0);
  const [gameResult, setGameResult] = useState(null); // 'win' ou 'lose'

  // Estados GBL (Game-Based Learning)
  const [currentEnergyData, setCurrentEnergyData] = useState(null);
  const [playerLevel, setPlayerLevel] = useState(1);
  const [playerXP, setPlayerXP] = useState(0);
  // const [achievements, setAchievements] = useState(ACHIEVEMENTS); // Removido - não utilizado
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [energyTypesLearned, setEnergyTypesLearned] = useState([]);
  const [wordsCompleted, setWordsCompleted] = useState(0);
  const [perfectScores, setPerfectScores] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [learningContent, setLearningContent] = useState(null);
  const [playerAvatar, setPlayerAvatar] = useState({
    name: 'EcoAprendiz',
    level: 1,
    energy: 100,
    avatarIcon: '🌱'
  });
  const [achievementNotifications, setAchievementNotifications] = useState([]);
  const [educationalTip, setEducationalTip] = useState(null);

  // Sistema de narrativa educacional
  // const [narrativeProgress, setNarrativeProgress] = useState({
  //   currentChapter: 1,
  //   totalChapters: 5,
  //   story: 'Você é um EcoGuardião em treinamento. Cada palavra descoberta revela segredos sobre energia limpa e sustentabilidade.',
  //   mission: 'Aprenda sobre diferentes fontes de energia renovável para proteger nosso planeta!'
  // }); // Removido - não utilizado

  // Funções GBL (Game-Based Learning)

  // Carregar progresso GBL ao iniciar
  useEffect(() => {
    const loadGBLProgress = () => {
      const savedXP = localStorage.getItem('hangman_xp');
      const savedLevel = localStorage.getItem('hangman_level');
      const savedAchievements = localStorage.getItem('hangman_achievements');
      const savedAvatar = localStorage.getItem('hangman_avatar');
      const savedEnergyTypes = localStorage.getItem('hangman_energy_types');
      const savedWordsCompleted = localStorage.getItem('hangman_words_completed');
      const savedPerfectScores = localStorage.getItem('hangman_perfect_scores');

      if (savedXP) setPlayerXP(parseInt(savedXP));
      if (savedLevel) setPlayerLevel(parseInt(savedLevel));
      if (savedAchievements) setUnlockedAchievements(JSON.parse(savedAchievements));
      if (savedAvatar) setPlayerAvatar(JSON.parse(savedAvatar));
      if (savedEnergyTypes) setEnergyTypesLearned(JSON.parse(savedEnergyTypes));
      if (savedWordsCompleted) setWordsCompleted(parseInt(savedWordsCompleted));
      if (savedPerfectScores) setPerfectScores(parseInt(savedPerfectScores));
    };

    loadGBLProgress();
  }, []);

  // Função movida para dentro do useEffect

  const saveGBLProgress = useCallback(() => {
    localStorage.setItem('hangman_xp', playerXP.toString());
    localStorage.setItem('hangman_level', playerLevel.toString());
    localStorage.setItem('hangman_achievements', JSON.stringify(unlockedAchievements));
    localStorage.setItem('hangman_avatar', JSON.stringify(playerAvatar));
    localStorage.setItem('hangman_energy_types', JSON.stringify(energyTypesLearned));
    localStorage.setItem('hangman_words_completed', wordsCompleted.toString());
    localStorage.setItem('hangman_perfect_scores', perfectScores.toString());
  }, [playerXP, playerLevel, unlockedAchievements, playerAvatar, energyTypesLearned, wordsCompleted, perfectScores]);

  // Sistema de níveis e XP
  const addXP = (xp) => {
    const newXP = playerXP + xp;
    const newLevel = Math.floor(newXP / 1000) + 1;

    if (newLevel > playerLevel) {
      // Subiu de nível!
      setPlayerLevel(newLevel);
      setPlayerAvatar(prev => ({
        ...prev,
        level: newLevel,
        avatarIcon: getAvatarIconForLevel(newLevel)
      }));
      playSuccess();
    }

    setPlayerXP(newXP);
  };

  const getAvatarIconForLevel = (level) => {
    if (level >= 10) return '🌟';
    if (level >= 7) return '🏆';
    if (level >= 5) return '🌳';
    if (level >= 3) return '⚡';
    return '🌱';
  };

  // Sistema de conquistas
  const checkAchievements = (energyType, gameWon, attemptsUsed, timeSpent) => {
    const newAchievements = [...unlockedAchievements];
    let xpEarned = 0;

    // Primeira palavra
    if (wordsCompleted === 0 && gameWon && !unlockedAchievements.includes('firstWord')) {
      newAchievements.push('firstWord');
      xpEarned += ACHIEVEMENTS.firstWord.xp;
    }

    // Especialista Solar
    if (energyType === 'solar' && gameWon) {
      const solarCount = energyTypesLearned.filter(type => type === 'solar').length + 1;
      if (solarCount >= 3 && !unlockedAchievements.includes('solarExpert')) {
        newAchievements.push('solarExpert');
        xpEarned += ACHIEVEMENTS.solarExpert.xp;
      }
    }

    // Pontuação perfeita
    if (gameWon && attemptsUsed === 0 && !unlockedAchievements.includes('perfectScore')) {
      newAchievements.push('perfectScore');
      xpEarned += ACHIEVEMENTS.perfectScore.xp;
      setPerfectScores(prev => prev + 1);
    }

    // Aprendiz rápido
    if (gameWon && timeSpent < 30 && !unlockedAchievements.includes('quickLearner')) {
      newAchievements.push('quickLearner');
      xpEarned += ACHIEVEMENTS.quickLearner.xp;
    }

    // Persistente
    if (wordsCompleted + 1 >= 10 && !unlockedAchievements.includes('persistent')) {
      newAchievements.push('persistent');
      xpEarned += ACHIEVEMENTS.persistent.xp;
    }

    // Campeão Renovável
    const completedDifficulties = new Set();
    energyTypesLearned.forEach(type => {
      completedDifficulties.add(ENERGY_EDUCATION[type]?.difficulty);
    });
    if (completedDifficulties.size === 3 && !unlockedAchievements.includes('renewableChampion')) {
      newAchievements.push('renewableChampion');
      xpEarned += ACHIEVEMENTS.renewableChampion.xp;
    }

    // Guerreiro Eco
    if (energyTypesLearned.length + 1 >= 5 && !unlockedAchievements.includes('ecoWarrior')) {
      newAchievements.push('ecoWarrior');
      xpEarned += ACHIEVEMENTS.ecoWarrior.xp;
    }

    setUnlockedAchievements(newAchievements);
    addXP(xpEarned);

    // Adicionar notificações para novas conquistas
    const newUnlockedAchievements = newAchievements.filter(ach => !unlockedAchievements.includes(ach));
    if (newUnlockedAchievements.length > 0) {
      const notifications = newUnlockedAchievements.map(achievementId => ({
        id: Date.now() + Math.random(),
        achievement: ACHIEVEMENTS[achievementId],
        timestamp: (() => Date.now())() // Função para evitar chamada impura
      }));
      setAchievementNotifications(prev => [...prev, ...notifications]);

      // Remover notificações após 5 segundos
      setTimeout(() => {
        setAchievementNotifications(prev => prev.filter(n => !notifications.some(nn => nn.id === n.id)));
      }, 5000);
    }

    return newUnlockedAchievements;
  };

  // Mostrar conteúdo educacional
  const showEducationalContent = (energyData) => {
    setLearningContent(energyData.educationalContent);
    setCurrentEnergyData(energyData);
    setShowLearningModal(true);
  };

  // Gerar dica educacional contextual
  const generateEducationalTip = (energyType, attemptsLeft) => {
    const tips = {
      solar: [
        '💡 Dica: A energia solar pode ser captada mesmo em dias nublados!',
        '🌞 Dica: Um painel solar de 1m² pode gerar energia para uma lâmpada por 24h!',
        '⚡ Dica: A energia solar é a fonte de energia mais abundante na Terra!'
      ],
      eolica: [
        '💨 Dica: A energia eólica já é usada há séculos em moinhos de vento!',
        '🌪️ Dica: Um aerogerador moderno pode abastecer milhares de casas!',
        '⚡ Dica: O vento é causado pelo aquecimento desigual da Terra!'
      ],
      hidreletrica: [
        '💧 Dica: A energia hidrelétrica aproveita a força da água em movimento!',
        '🌊 Dica: É a principal fonte de energia renovável no Brasil!',
        '⚡ Dica: Uma usina hidrelétrica pode funcionar por mais de 100 anos!'
      ],
      biomassa: [
        '🌱 Dica: A biomassa reaproveita resíduos orgânicos para gerar energia!',
        '♻️ Dica: Ajuda a reduzir o lixo e gera energia limpa!',
        '🔥 Dica: A queima da biomassa é mais limpa que a queima do carvão!'
      ],
      geotermica: [
        '🌋 Dica: A energia geotérmica vem do calor interno da Terra!',
        '🔥 Dica: É usada para aquecimento em países frios como Islândia!',
        '⚡ Dica: É uma energia disponível 24 horas por dia!'
      ],
      oceanica: [
        '🌊 Dica: A energia das ondas é previsível e constante!',
        '🌙 Dica: A energia das marés aproveita a atração da lua!',
        '⚡ Dica: O movimento das ondas pode gerar eletricidade!'
      ]
    };

    const energyTips = tips[energyType] || tips.solar;
    const tipIndex = Math.min(attemptsLeft - 1, energyTips.length - 1);
    return energyTips[Math.max(0, tipIndex)];
  };

  // Mostrar dica educacional
  const showEducationalTip = (energyType) => {
    const tip = generateEducationalTip(energyType, attemptsLeft);
    setEducationalTip(tip);

    // Remover dica após 8 segundos
    setTimeout(() => {
      setEducationalTip(null);
    }, 8000);
  };

  // Atualizar progresso de aprendizagem
  const updateLearningProgress = (energyType) => {
    if (!energyTypesLearned.includes(energyType)) {
      setEnergyTypesLearned(prev => [...prev, energyType]);
    }
    setWordsCompleted(prev => prev + 1);
  };

  // Função para iniciar o jogo com GBL
  const startGame = (level) => {
    setDifficulty(level);
    setGameStartTime(() => Date.now()); // Usar função para evitar chamada impura

    // Selecionar palavra com base na dificuldade
    const energyKeys = Object.keys(ENERGY_EDUCATION);
    const filteredEnergyKeys = energyKeys.filter(key => ENERGY_EDUCATION[key].difficulty === level);

    if (filteredEnergyKeys.length === 0) {
      // Fallback
      const energyData = ENERGY_EDUCATION.solar;
      setWord(energyData.word);
      setHint(energyData.hint);
      setCurrentEnergyData(energyData);
    } else {
      const randomKey = filteredEnergyKeys[Math.floor((() => Math.random())() * filteredEnergyKeys.length)]; // Função para evitar chamada impura
      const energyData = ENERGY_EDUCATION[randomKey];
      setWord(energyData.word);
      setHint(energyData.hint);
      setCurrentEnergyData(energyData);
    }

    setGuessedLetters([]);
    setAttemptsLeft(6);
    setGameResult(null);
    setScore(0);
    setGameState('playing');
    playClick();
  };

  // Função para adivinhar letra com GBL
  const guessLetter = (letter) => {
    if (guessedLetters.includes(letter) || attemptsLeft <= 0 || gameResult) return;

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (word.includes(letter)) {
      playSuccess();
      // Verifica se ganhou
      const wordLetters = [...new Set(word.split(''))];
      const guessedCorrectLetters = wordLetters.filter(l => newGuessedLetters.includes(l));
      if (guessedCorrectLetters.length === wordLetters.length) {
        // VITÓRIA! Implementar sistema GBL completo
        setGameResult('win');
        const points = attemptsLeft * 10;
        const timeSpent = Math.floor(((() => Date.now())() - gameStartTime) / 1000); // Função para evitar chamada impura

        setScore(points);
        addScore(points);

        // Atualizar estatísticas
        updateStat('hangman_wins', 1);
        updateStat('total_games', 1);

        // Sistema GBL: Adicionar XP e verificar conquistas
        if (currentEnergyData) {
          addXP(currentEnergyData.gblRewards.xp);
          updateLearningProgress(currentEnergyData.word.toLowerCase());
          checkAchievements(
            currentEnergyData.word.toLowerCase(),
            true,
            6 - attemptsLeft,
            timeSpent
          ); // Removido variável não utilizada

          // Mostrar modal de aprendizado após vitória
          setTimeout(() => {
            showEducationalContent(currentEnergyData);
          }, 1000);
        }

        // Atualizar estatísticas locais
        const stats = getStats();
        stats.totalGames++;
        stats.wins++;
        stats.bestScore = Math.max(stats.bestScore, points);
        localStorage.setItem('hangman_stats', JSON.stringify(stats));

        // Salvar progresso GBL
        saveGBLProgress();

        // Save score
        api.post('/games/score', {
          gameId: 'hangman',
          score: points
        }).catch(err => console.error('Failed to save score:', err));

        // Limvar progresso salvo ao terminar
        localStorage.removeItem('hangman_progress');
      } else {
        // Salvar progresso após acerto
        saveProgress();
      }
    } else {
      playError();
      const newAttemptsLeft = attemptsLeft - 1;
      setAttemptsLeft(newAttemptsLeft);

      // Mostrar dica educacional após erro
      if (currentEnergyData && newAttemptsLeft > 0 && newAttemptsLeft <= 4) {
        showEducationalTip(currentEnergyData.word.toLowerCase());
      }

      // Salvar progresso após erro
      saveProgress();
      if (newAttemptsLeft === 0) {
        // DERROTA - Ainda assim mostrar conteúdo educacional
        setGameResult('lose');
        updateStat('total_games', 1);

        if (currentEnergyData) {
          setTimeout(() => {
            showEducationalContent(currentEnergyData);
          }, 1000);
        }

        // Atualizar estatísticas locais
        const stats = getStats();
        stats.totalGames++;
        localStorage.setItem('hangman_stats', JSON.stringify(stats));

        // Salvar progresso GBL
        saveGBLProgress();

        // Limpar progresso salvo ao terminar
        localStorage.removeItem('hangman_progress');
      }
    }
  };

  // Função para renderizar a palavra com letras adivinhadas
  const renderWord = () => {
    return word.split('').map((letter, index) => (
      <span key={index} className="text-4xl font-bold text-theme-text-primary mx-1">
        {guessedLetters.includes(letter) ? letter : '_'}
      </span>
    ));
  };

  // Função para reiniciar o jogo
  const resetGame = () => {
    setGameState('menu');
    setWord('');
    setHint('');
    setGuessedLetters([]);
    setAttemptsLeft(6);
    setGameResult(null);
    setScore(0);
    // Limpar progresso salvo
    localStorage.removeItem('hangman_progress');
  };

  // Função para salvar progresso
  const saveProgress = () => {
    const progress = {
      word,
      hint,
      guessedLetters,
      attemptsLeft,
      difficulty,
      timestamp: (() => Date.now())() // Função para evitar chamada impura
    };
    localStorage.setItem('hangman_progress', JSON.stringify(progress));
  };

  // Função para carregar progresso
  const loadProgress = () => {
    const saved = localStorage.getItem('hangman_progress');
    if (saved) {
      try {
        const progress = JSON.parse(saved);
        // Verificar se o progresso não é muito antigo (24 horas)
        if ((() => Date.now())() - progress.timestamp < 24 * 60 * 60 * 1000) { // Função para evitar chamada impura
          setWord(progress.word);
          setHint(progress.hint);
          setGuessedLetters(progress.guessedLetters);
          setAttemptsLeft(progress.attemptsLeft);
          setDifficulty(progress.difficulty);
          setGameState('playing');
          return true;
        }
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    }
    return false;
  };

  // Carregar progresso ao montar o componente
  useEffect(() => {
    loadProgress();
  }, []);

  // Salvar progresso GBL sempre que houver mudança
  useEffect(() => {
    saveGBLProgress();
  }, [playerXP, playerLevel, unlockedAchievements, energyTypesLearned, wordsCompleted, perfectScores, saveGBLProgress]); // Adicionado saveGBLProgress como dependência

  // Função para obter estatísticas do localStorage
  const getStats = () => {
    const saved = localStorage.getItem('hangman_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      }
    }
    return { totalGames: 0, wins: 0, bestScore: 0 };
  };

  // Renderização
  return (
    <div className="min-h-screen pt-20 px-4 pb-8 flex flex-col items-center max-w-4xl mx-auto bg-theme-bg-primary text-theme-text-primary">
      <div className="w-full flex justify-between items-center mb-8 bg-theme-bg-secondary/50 p-4 rounded-2xl backdrop-blur-md border border-theme-border">
        <Link to="/games" className="flex items-center gap-2 text-theme-text-secondary hover:text-theme-text-primary transition-colors">
          <ArrowLeft className="w-6 h-6" />
          <span className="hidden sm:inline">Voltar</span>
        </Link>
      </div>

      {gameState === 'menu' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center w-full max-w-4xl"
        >
          {/* HUD do Jogador GBL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-theme-bg-secondary/90 to-theme-bg-tertiary/90 backdrop-blur border border-theme-border rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{playerAvatar.avatarIcon}</div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-theme-text-primary">{playerAvatar.name}</h3>
                  <p className="text-green-500 text-sm">Nível {playerLevel} EcoGuardião</p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{playerXP}</div>
                  <div className="text-xs text-theme-text-tertiary">XP Total</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{wordsCompleted}</div>
                  <div className="text-xs text-theme-text-tertiary">Palavras</div>
                </div>

                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{unlockedAchievements.length}</div>
                  <div className="text-xs text-theme-text-tertiary">Conquistas</div>
                </div>

                <button
                  onClick={() => setGameState('achievements')}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 p-3 rounded-xl transition-colors"
                >
                  <Trophy className="w-6 h-6 text-yellow-400" />
                </button>
              </div>
            </div>

            {/* Barra de Progresso de XP */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-theme-text-tertiary mb-1">
                <span>XP para próximo nível</span>
                <span>{playerXP % 1000}/1000</span>
              </div>
              <div className="w-full bg-theme-bg-tertiary rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(playerXP % 1000) / 10}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Missão Narrativa */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-theme-bg-secondary/50 backdrop-blur border border-theme-border rounded-xl p-6 mb-8"
          >
            <div className="flex items-center gap-4 mb-3">
              <BookOpen className="w-8 h-8 text-green-500" />
              <h2 className="text-xl font-bold text-theme-text-primary">Você é um EcoGuardião em treinamento</h2>
            </div>
            <p className="text-theme-text-secondary text-left">Cada palavra descoberta revela segredos sobre energia limpa e sustentabilidade.</p>
            <div className="mt-3 text-xs text-theme-text-tertiary">
              Missão: Aprenda sobre diferentes fontes de energia renovável para proteger nosso planeta!
            </div>
          </motion.div>

          <div className="flex items-center justify-center gap-4 mb-6">
            <Leaf className="w-12 h-12 text-green-500" />
            <h1 className="text-5xl font-display font-bold text-theme-text-primary">Jogo da Forca Renovável</h1>
            <Droplets className="w-12 h-12 text-blue-400" />
          </div>
          <p className="text-theme-text-secondary mb-8 max-w-lg mx-auto">
            Adivinhe palavras sobre energia renovável e torne-se um verdadeiro EcoGuardião!
          </p>

          {/* Botão Continuar Jogo Salvo */}
          {localStorage.getItem('hangman_progress') && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.05, translateY: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => loadProgress()}
              className="mb-8 bg-green-600/80 backdrop-blur border border-green-500 hover:bg-green-500 p-6 rounded-2xl flex items-center gap-4 transition-all group w-full max-w-md mx-auto"
            >
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white">Continuar Jogo</h3>
                <p className="text-green-100 text-sm">Retomar partida salva</p>
              </div>
            </motion.button>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { level: 'easy', label: 'Fácil', desc: 'Palavras curtas' },
              { level: 'medium', label: 'Médio', desc: 'Palavras médias' },
              { level: 'hard', label: 'Difícil', desc: 'Palavras longas' }
            ].map((mode) => (
              <motion.button
                key={mode.level}
                whileHover={{ scale: 1.05, translateY: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => startGame(mode.level)}
                className="bg-theme-bg-secondary/80 backdrop-blur border border-theme-border hover:border-green-500 p-6 rounded-2xl flex flex-col items-center gap-4 transition-all group"
              >
                <div className="w-12 h-12 bg-theme-bg-tertiary rounded-full flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  {mode.level === 'easy' && <Sun className="w-6 h-6" />}
                  {mode.level === 'medium' && <Wind className="w-6 h-6" />}
                  {mode.level === 'hard' && <Zap className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-theme-text-primary">{mode.label}</h3>
                  <p className="text-theme-text-secondary text-sm">{mode.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Estatísticas */}
          <div className="mt-12 bg-theme-bg-secondary/50 rounded-2xl p-6 border border-theme-border">
            <h3 className="text-xl font-bold text-theme-text-primary mb-4 text-center">Estatísticas</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-500">{getStats().totalGames}</div>
                <div className="text-theme-text-secondary text-sm">Partidas</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">{getStats().wins}</div>
                <div className="text-theme-text-secondary text-sm">Vitórias</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{getStats().bestScore}</div>
                <div className="text-theme-text-secondary text-sm">Melhor Pontuação</div>
              </div>
            </div>
            {getStats().totalGames > 0 && (
              <div className="mt-4 text-center">
                <div className="text-lg font-bold text-theme-text-primary">
                  {Math.round((getStats().wins / getStats().totalGames) * 100)}%
                </div>
                <div className="text-theme-text-secondary text-sm">Taxa de Vitória</div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-2xl">
          {/* Painel de Progresso GBL */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-theme-bg-secondary/90 to-theme-bg-tertiary/90 backdrop-blur border border-theme-border rounded-xl p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{playerAvatar.avatarIcon}</div>
                <div>
                  <div className="text-theme-text-primary font-bold text-sm">{playerAvatar.name}</div>
                  <div className="text-green-500 text-xs">Nível {playerLevel} EcoGuardião</div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-center">
                <div>
                  <div className="text-yellow-400 font-bold text-lg">{playerXP}</div>
                  <div className="text-theme-text-tertiary text-xs">XP</div>
                </div>
                <div>
                  <div className="text-blue-400 font-bold text-lg">{wordsCompleted}</div>
                  <div className="text-theme-text-tertiary text-xs">Palavras</div>
                </div>
                <div>
                  <div className="text-purple-400 font-bold text-lg">{unlockedAchievements.length}</div>
                  <div className="text-theme-text-tertiary text-xs">Conquistas</div>
                </div>
              </div>

              <button
                onClick={() => setGameState('achievements')}
                className="bg-yellow-500/20 hover:bg-yellow-500/30 p-2 rounded-lg transition-colors"
              >
                <Trophy className="w-5 h-5 text-yellow-400" />
              </button>
            </div>

            {/* Barra de XP */}
            <div className="mt-3">
              <div className="flex justify-between text-xs text-theme-text-tertiary mb-1">
                <span>XP para nível {playerLevel + 1}</span>
                <span>{playerXP % 1000}/1000</span>
              </div>
              <div className="w-full bg-theme-bg-tertiary rounded-full h-1.5">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(playerXP % 1000) / 10}%` }}
                />
              </div>
            </div>
          </motion.div>

          {/* Dica Educacional Contextual */}
          <AnimatePresence>
            {educationalTip && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6"
              >
                <div className="bg-gradient-to-r from-blue-900/80 to-teal-900/80 backdrop-blur border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Lightbulb className="w-5 h-5 text-blue-400" />
                    <div className="flex-1">
                      <h4 className="text-blue-300 font-semibold text-sm mb-1">💡 Dica de Aprendizado</h4>
                      <p className="text-blue-100 text-sm">{educationalTip}</p>
                    </div>
                    <button
                      onClick={() => setEducationalTip(null)}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header do jogo */}
          <div className="flex justify-between items-center mb-8 text-theme-text-primary">
            <div>
              <span className="text-theme-text-secondary text-sm uppercase tracking-wider">Tentativas Restantes</span>
              <div className="text-3xl font-bold font-mono">{attemptsLeft}</div>
            </div>
            <div>
              <span className="text-theme-text-secondary text-sm uppercase tracking-wider">Pontuação</span>
              <div className="text-3xl font-bold font-mono">{score}</div>
            </div>
            <button
              onClick={() => setGameState('menu')}
              className="bg-theme-bg-tertiary hover:bg-theme-bg-secondary px-4 py-2 rounded-lg transition-colors border border-theme-border"
            >
              Menu
            </button>
          </div>

          {/* Desenho da Forca */}
          <div className="bg-theme-bg-secondary/50 rounded-2xl p-8 mb-8 flex justify-center border border-theme-border">
            <svg width="200" height="250" viewBox="0 0 200 250" className="text-theme-text-primary">
              {/* Base */}
              <line x1="20" y1="230" x2="180" y2="230" stroke="currentColor" strokeWidth="4" />
              {/* Poste vertical */}
              <line x1="40" y1="230" x2="40" y2="30" stroke="currentColor" strokeWidth="4" />
              {/* Trave horizontal */}
              <line x1="40" y1="30" x2="120" y2="30" stroke="currentColor" strokeWidth="4" />
              {/* Suporte */}
              <line x1="40" y1="70" x2="70" y2="30" stroke="currentColor" strokeWidth="2" />
              {/* Corda */}
              <line x1="120" y1="30" x2="120" y2="60" stroke="currentColor" strokeWidth="2" />

              {/* Cabeça (erro 1) */}
              {attemptsLeft <= 5 && (
                <circle cx="120" cy="75" r="15" stroke="currentColor" strokeWidth="3" fill="none" />
              )}

              {/* Corpo (erro 2) */}
              {attemptsLeft <= 4 && (
                <line x1="120" y1="90" x2="120" y2="170" stroke="currentColor" strokeWidth="3" />
              )}

              {/* Braço esquerdo (erro 3) */}
              {attemptsLeft <= 3 && (
                <line x1="120" y1="120" x2="90" y2="140" stroke="currentColor" strokeWidth="3" />
              )}

              {/* Braço direito (erro 4) */}
              {attemptsLeft <= 2 && (
                <line x1="120" y1="120" x2="150" y2="140" stroke="currentColor" strokeWidth="3" />
              )}

              {/* Perna esquerda (erro 5) */}
              {attemptsLeft <= 1 && (
                <line x1="120" y1="170" x2="90" y2="200" stroke="currentColor" strokeWidth="3" />
              )}

              {/* Perna direita (erro 6) */}
              {attemptsLeft <= 0 && (
                <line x1="120" y1="170" x2="150" y2="200" stroke="currentColor" strokeWidth="3" />
              )}
            </svg>
          </div>

          {/* Palavra */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center mb-4">
              {renderWord()}
            </div>
            <p className="text-theme-text-secondary text-sm">{hint}</p>
          </div>

          {/* Teclado */}
          <div className="grid grid-cols-7 gap-2 mb-8">
            {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((letter) => (
              <button
                key={letter}
                onClick={() => guessLetter(letter)}
                disabled={guessedLetters.includes(letter) || gameResult}
                className={`
                  py-3 px-4 rounded-lg font-bold text-lg transition-all
                  ${guessedLetters.includes(letter)
                    ? word.includes(letter)
                      ? 'bg-green-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-primary border border-theme-border'
                  }
                  ${gameResult ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Resultado */}
          {gameResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center bg-theme-bg-secondary/50 rounded-2xl p-6 border border-theme-border"
            >
              <h2 className={`text-3xl font-bold mb-4 ${gameResult === 'win' ? 'text-green-500' : 'text-red-500'
                }`}>
                {gameResult === 'win' ? 'Parabéns! 🎉' : 'Game Over! 💀'}
              </h2>
              <p className="text-theme-text-primary mb-4">
                {gameResult === 'win'
                  ? `Você acertou a palavra "${word}" com ${attemptsLeft} tentativas restantes!`
                  : `A palavra era "${word}"`
                }
              </p>
              <p className="text-theme-text-secondary mb-6">
                Pontuação: {score} pontos • XP Ganho: {currentEnergyData?.gblRewards?.xp || 0}
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => startGame(difficulty)}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Jogar Novamente
                </button>
                <button
                  onClick={resetGame}
                  className="bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-primary font-bold py-3 px-6 rounded-lg transition-colors border border-theme-border"
                >
                  Menu Principal
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tela de Conquistas GBL */}
      {gameState === 'achievements' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-4xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-theme-text-primary flex items-center gap-3">
              <Trophy className="w-8 h-8 text-yellow-400" />
              Conquistas Educativas
            </h2>
            <button
              onClick={() => setGameState('menu')}
              className="bg-theme-bg-tertiary hover:bg-theme-bg-secondary text-theme-text-primary px-4 py-2 rounded-lg transition-colors border border-theme-border"
            >
              Voltar
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {Object.values(ACHIEVEMENTS).map((achievement) => {
              const isUnlocked = unlockedAchievements.includes(achievement.id);
              return (
                <motion.div
                  key={achievement.id}
                  whileHover={{ scale: 1.02 }}
                  className={`p-4 rounded-xl border-2 transition-all ${isUnlocked
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-400'
                    : 'bg-theme-bg-secondary/50 border-theme-border'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl ${isUnlocked ? '' : 'grayscale opacity-50'}`}>
                      {achievement.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${isUnlocked ? 'text-yellow-400' : 'text-theme-text-secondary'}`}>
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-theme-text-tertiary">{achievement.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-xs text-yellow-400">+{achievement.xp} XP</span>
                      </div>
                    </div>
                    {isUnlocked && (
                      <div className="text-green-400">
                        <Award className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Modal de Conteúdo Educacional */}
      <AnimatePresence>
        {showLearningModal && learningContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLearningModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gradient-to-br from-theme-bg-secondary to-theme-bg-primary rounded-2xl p-8 max-w-2xl w-full border border-theme-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-theme-text-primary flex items-center gap-3">
                  <Brain className="w-6 h-6 text-green-500" />
                  Aprendizado: {currentEnergyData?.word}
                </h2>
                <button
                  onClick={() => setShowLearningModal(false)}
                  className="text-theme-text-tertiary hover:text-theme-text-primary"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-blue-400 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" />
                    O que é?
                  </h3>
                  <p className="text-theme-text-secondary">{learningContent.definition}</p>
                </div>

                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-green-400 mb-2 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    Curiosidade
                  </h3>
                  <p className="text-theme-text-secondary">{learningContent.funFact}</p>
                </div>

                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-purple-400 mb-2 flex items-center gap-2">
                    <Heart className="w-5 h-5" />
                    Impacto Ambiental
                  </h3>
                  <p className="text-theme-text-secondary">{learningContent.environmentalImpact}</p>
                </div>

                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-orange-400 mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Aplicação na Vida Real
                  </h3>
                  <p className="text-theme-text-secondary">{learningContent.realWorldApplication}</p>
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-yellow-500 mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Objetivo de Aprendizagem
                  </h3>
                  <p className="text-theme-text-secondary">{learningContent.learningObjective}</p>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-400">+{currentEnergyData?.gblRewards?.xp || 0} XP Ganho!</span>
                </div>
                <button
                  onClick={() => setShowLearningModal(false)}
                  className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                >
                  Continuar Aprendendo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* Notificações de Conquistas */}
      <AnimatePresence>
        {achievementNotifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div className="bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur border-2 border-yellow-400 rounded-xl p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{notification.achievement.icon}</div>
                <div>
                  <h3 className="text-white font-bold">Conquista Desbloqueada!</h3>
                  <p className="text-yellow-100 text-sm">{notification.achievement.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-4 h-4 text-yellow-300" />
                    <span className="text-yellow-300 text-xs">+{notification.achievement.xp} XP</span>
                  </div>
                </div>
                <div className="text-yellow-300">
                  <Award className="w-8 h-8" />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default HangmanGame;