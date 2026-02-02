export const QUIZ_DATA = {};

export const PASSA_REPASSA_QUESTIONS = [
  { id: 'solar-1', category: 'Solar', question: 'Energia gerada a partir do Sol?', answers: ['energia solar', 'solar'] },
  { id: 'solar-2', category: 'Solar', question: 'Equipamento que capta luz para gerar eletricidade?', answers: ['painel solar', 'placa solar'] },
  { id: 'solar-3', category: 'Solar', question: 'Nome do efeito que transforma luz em eletricidade?', answers: ['efeito fotovoltaico', 'fotovoltaico'] },
  { id: 'eolica-1', category: 'Eólica', question: 'Energia gerada a partir do vento?', answers: ['energia eolica', 'eolica'] },
  { id: 'eolica-2', category: 'Eólica', question: 'Máquina com pás que gira com vento?', answers: ['aerogerador', 'turbina eolica'] },
  { id: 'eolica-3', category: 'Eólica', question: 'Parque com várias turbinas chama-se?', answers: ['parque eolico'] },
  { id: 'hidrica-1', category: 'Hídrica', question: 'Energia gerada pela água em movimento?', answers: ['energia hidrica', 'hidrica'] },
  { id: 'hidrica-2', category: 'Hídrica', question: 'Estrutura que acumula água para gerar energia?', answers: ['represa', 'barragem'] },
  { id: 'hidrica-3', category: 'Hídrica', question: "Usina que usa quedas d'água?", answers: ['hidreletrica', 'usina hidreletrica'] },
  { id: 'biomassa-1', category: 'Biomassa', question: 'Energia obtida de matéria orgânica?', answers: ['biomassa', 'energia biomassa'] },
  { id: 'biomassa-2', category: 'Biomassa', question: 'Combustível feito de cana-de-açúcar?', answers: ['etanol'] },
  { id: 'biomassa-3', category: 'Biomassa', question: 'Gás renovável produzido por resíduos?', answers: ['biogas'] },
  { id: 'geotermica-1', category: 'Geotérmica', question: 'Energia que vem do calor interno da Terra?', answers: ['geotermica', 'energia geotermica'] },
  { id: 'mares-1', category: 'Oceano', question: 'Energia gerada pelo movimento das ondas?', answers: ['energia ondas', 'undimotriz'] },
  { id: 'mares-2', category: 'Oceano', question: 'Energia gerada pelas marés?', answers: ['maremotriz'] },
  { id: 'clima-1', category: 'Clima', question: 'Gás principal do efeito estufa emitido por combustíveis fósseis?', answers: ['co2', 'dioxido carbono'] },
  { id: 'clima-2', category: 'Clima', question: 'Aquecimento global é aumento de quê?', answers: ['temperatura', 'temperatura global'] },
  { id: 'clima-3', category: 'Clima', question: 'Camada que protege contra raios UV?', answers: ['camada ozonio', 'ozonio'] },
  { id: 'sust-1', category: 'Sustentabilidade', question: 'Três Rs: reduzir, reutilizar e ____?', answers: ['reciclar'] },
  { id: 'sust-2', category: 'Sustentabilidade', question: 'Ato de usar menos recursos chama-se?', answers: ['reduzir', 'reducao'] },
  { id: 'sust-3', category: 'Sustentabilidade', question: 'Processo de virar adubo com restos orgânicos?', answers: ['compostagem'] },
  { id: 'agua-1', category: 'Água', question: 'Ação correta ao escovar os dentes?', answers: ['fechar torneira', 'fechar a torneira'] },
  { id: 'agua-2', category: 'Água', question: 'Recurso natural finito essencial para a vida?', answers: ['agua'] },
  { id: 'residuos-1', category: 'Resíduos', question: 'Separação de lixo por tipo chama-se?', answers: ['coleta seletiva', 'seletiva'] },
  { id: 'residuos-2', category: 'Resíduos', question: 'Lixeira para plástico (padrão Brasil)?', answers: ['vermelho'] },
  { id: 'residuos-3', category: 'Resíduos', question: 'Lixeira para papel (padrão Brasil)?', answers: ['azul'] },
  { id: 'residuos-4', category: 'Resíduos', question: 'Lixeira para vidro (padrão Brasil)?', answers: ['verde'] },
  { id: 'residuos-5', category: 'Resíduos', question: 'Lixeira para metal (padrão Brasil)?', answers: ['amarelo'] },
  { id: 'eficiencia-1', category: 'Eficiência', question: 'Trocar lâmpada incandescente por qual tipo?', answers: ['led', 'lampada led'] },
  { id: 'eficiencia-2', category: 'Eficiência', question: 'Aparelho em stand-by consome o quê?', answers: ['energia', 'eletricidade'] },
  { id: 'eficiencia-3', category: 'Eficiência', question: 'Isolamento térmico reduz uso de?', answers: ['ar condicionado', 'aquecedor'] },
  { id: 'transporte-1', category: 'Transporte', question: 'Transporte sustentável coletivo: ônibus ou ____?', answers: ['metro', 'trem'] },
  { id: 'transporte-2', category: 'Transporte', question: 'Meio de transporte sem emissão direta e individual?', answers: ['bicicleta', 'bike'] },
  { id: 'energia-1', category: 'Energia', question: 'Fonte NÃO renovável comum em termelétricas?', answers: ['carvao', 'carvao mineral'] },
  { id: 'energia-2', category: 'Energia', question: 'Combustível fóssil líquido mais usado?', answers: ['petroleo'] },
  { id: 'energia-3', category: 'Energia', question: 'Sigla de "Energia Solar Fotovoltaica"?', answers: ['fv', 'fotovoltaica'] },
  { id: 'biodiversidade-1', category: 'Biodiversidade', question: 'Variedade de vida em um ecossistema?', answers: ['biodiversidade'] },
  { id: 'floresta-1', category: 'Florestas', question: 'Corte de muitas árvores chama-se?', answers: ['desmatamento'] },
  { id: 'floresta-2', category: 'Florestas', question: 'Plantio de árvores para recuperar áreas?', answers: ['reflorestamento'] },
  { id: 'empresas-1', category: 'ESG', question: 'Sigla ESG: Environmental, Social e ____?', answers: ['governance', 'governanca'] },
];

const MANUAL_QUIZ_BY_AGE = {
  10: [
    {
      id: 'manual-10-1',
      age: 10,
      area: 'Matemática',
      question: 'Se você tem 3 garrafas e cada uma tem 2 tampas, quantas tampas são ao todo?',
      options: ['6', '5', '3', '8'],
      correct: 0,
      explanation: 'São 3 vezes 2, totalizando 6 tampas.'
    },
    {
      id: 'manual-10-2',
      age: 10,
      area: 'Linguagem',
      question: 'Complete: "Apague a _____ ao sair do quarto."',
      options: ['luz', 'porta', 'cama', 'parede'],
      correct: 0,
      explanation: 'Apagar a luz economiza energia.'
    },
    {
      id: 'manual-10-3',
      age: 10,
      area: 'Ciências',
      question: 'Para as plantas crescerem, elas precisam principalmente de:',
      options: ['luz do sol', 'suco', 'areia', 'sal'],
      correct: 0,
      explanation: 'A luz do sol é essencial para a fotossíntese.'
    },
    {
      id: 'manual-10-4',
      age: 10,
      area: 'Geografia',
      question: 'O lixo plástico deve ir na lixeira de cor:',
      options: ['vermelha', 'azul', 'verde', 'preta'],
      correct: 0,
      explanation: 'No Brasil, a lixeira vermelha é destinada ao plástico.'
    },
    {
      id: 'manual-10-5',
      age: 10,
      area: 'Hábitos',
      question: 'Qual transporte ajuda a poluir menos o ar?',
      options: ['bicicleta', 'carro', 'moto', 'avião'],
      correct: 0,
      explanation: 'A bicicleta não emite poluentes.'
    }
  ],
  11: [
    {
      id: 'manual-11-1',
      age: 11,
      area: 'Matemática',
      question: 'Se cada lâmpada LED economiza 5 kWh por mês, quantos kWh 3 lâmpadas economizam juntas?',
      options: ['15', '10', '5', '8'],
      correct: 0,
      explanation: '3 × 5 kWh = 15 kWh.'
    },
    {
      id: 'manual-11-2',
      age: 11,
      area: 'Linguagem',
      question: 'Qual opção está corretamente acentuada?',
      options: ['energia elétrica', 'energia eletrica', 'enerjia elétrica', 'energia elétrika'],
      correct: 0,
      explanation: '"Elétrica" requer acento agudo.'
    },
    {
      id: 'manual-11-3',
      age: 11,
      area: 'Ciências',
      question: 'A fotossíntese transforma dióxido de carbono e água em:',
      options: ['oxigênio e açúcar', 'sal e água', 'metal e vidro', 'pedras e areia'],
      correct: 0,
      explanation: 'Plantas produzem oxigênio e carboidratos.'
    },
    {
      id: 'manual-11-4',
      age: 11,
      area: 'Geografia',
      question: 'Qual bioma brasileiro é mais afetado pelo desmatamento?',
      options: ['Amazônia', 'Pampa', 'Pantanal', 'Caatinga'],
      correct: 0,
      explanation: 'A Amazônia sofre forte pressão de desmate.'
    },
    {
      id: 'manual-11-5',
      age: 11,
      area: 'Hábitos',
      question: 'Qual atitude economiza mais água ao escovar os dentes?',
      options: ['fechar a torneira', 'deixar a torneira aberta', 'usar mangueira', 'encher a pia'],
      correct: 0,
      explanation: 'Fechar a torneira evita desperdício.'
    }
  ],
  12: [
    {
      id: 'manual-12-1',
      age: 12,
      area: 'Matemática',
      question: 'Uma torneira pingando perde 4 litros por dia. Em 7 dias, perde:',
      options: ['28 L', '24 L', '14 L', '7 L'],
      correct: 0,
      explanation: '4 × 7 = 28 litros.'
    },
    {
      id: 'manual-12-2',
      age: 12,
      area: 'Linguagem',
      question: 'Qual frase está correta?',
      options: ['Prefira andar a pé.', 'Prefira andar à pé.', 'Prefira andar á pé.', 'Prefira andar a pé!'],
      correct: 0,
      explanation: 'A expressão "a pé" não usa crase.'
    },
    {
      id: 'manual-12-3',
      age: 12,
      area: 'Ciências',
      question: 'O principal gás do efeito estufa emitido por motores é:',
      options: ['CO₂', 'O₂', 'N₂', 'H₂'],
      correct: 0,
      explanation: 'Motores emitem dióxido de carbono.'
    },
    {
      id: 'manual-12-4',
      age: 12,
      area: 'Geografia',
      question: 'Na coleta seletiva, papel deve ser descartado na lixeira:',
      options: ['azul', 'vermelha', 'verde', 'amarela'],
      correct: 0,
      explanation: 'A cor azul é usada para papel.'
    },
    {
      id: 'manual-12-5',
      age: 12,
      area: 'Tecnologia',
      question: 'Qual dispositivo continua consumindo energia em stand-by?',
      options: ['aparelhos eletrônicos', 'plantas', 'cachorros', 'livros'],
      correct: 0,
      explanation: 'Eletrônicos em stand-by consomem energia.'
    }
  ],
  13: [
    {
      id: 'manual-13-1',
      age: 13,
      area: 'Matemática',
      question: 'Consumo mensal de 200 kWh reduzido em 12% passa a ser:',
      options: ['176 kWh', '188 kWh', '164 kWh', '120 kWh'],
      correct: 0,
      explanation: '200 − 12% = 200 × 0,88 = 176 kWh.'
    },
    {
      id: 'manual-13-2',
      age: 13,
      area: 'Linguagem',
      question: 'Na frase "Economizar energia ajuda o planeta e o bolso", "o bolso" significa:',
      options: ['economia de dinheiro', 'bolsa de estudos', 'bolso físico da roupa', 'economia de tempo'],
      correct: 0,
      explanation: 'Refere-se a gastar menos dinheiro.'
    },
    {
      id: 'manual-13-3',
      age: 13,
      area: 'Ciências',
      question: '"Poluente dominante" em um relatório de qualidade do ar indica:',
      options: ['o poluente com maior impacto', 'o poluente inexistente', 'o poluente mais leve', 'o poluente menos relevante'],
      correct: 0,
      explanation: 'É o que mais contribui para a má qualidade do ar.'
    },
    {
      id: 'manual-13-4',
      age: 13,
      area: 'Geografia',
      question: 'Qual recurso é renovável?',
      options: ['vento', 'carvão', 'petróleo', 'gás natural'],
      correct: 0,
      explanation: 'Vento é renovável.'
    },
    {
      id: 'manual-13-5',
      age: 13,
      area: 'Cidadania',
      question: 'Qual prática representa o pilar Social do ESG?',
      options: ['programas de inclusão', 'queimar lixo', 'desmatar florestas', 'descartar óleo no ralo'],
      correct: 0,
      explanation: 'O Social envolve inclusão e respeito às pessoas.'
    }
  ],
  14: [
    {
      id: 'manual-14-1',
      age: 14,
      area: 'Matemática',
      question: 'Um painel de 250 W funcionando por 4 horas produz:',
      options: ['1 kWh', '800 Wh', '250 Wh', '250 kWh'],
      correct: 0,
      explanation: '250 W × 4 h = 1000 Wh = 1 kWh.'
    },
    {
      id: 'manual-14-2',
      age: 14,
      area: 'Linguagem',
      question: 'Qual está correta segundo a norma culta?',
      options: ['Sustentabilidade é essencial à sociedade.', 'Sustentabilidade é essencial a sociedade.', 'Sustentabilidade é essêncial à sociedade.', 'Sustentabilidade é essencial á sociedade.'],
      correct: 0,
      explanation: 'Uso correto da crase em "à sociedade".'
    },
    {
      id: 'manual-14-3',
      age: 14,
      area: 'Ciências',
      question: 'A camada de ozônio filtra principalmente:',
      options: ['raios UV', 'ondas de rádio', 'micro-ondas', 'infravermelho distante'],
      correct: 0,
      explanation: 'A camada de ozônio filtra radiação ultravioleta.'
    },
    {
      id: 'manual-14-4',
      age: 14,
      area: 'Geopolítica',
      question: 'Qual acordo internacional combate as emissões de gases de efeito estufa?',
      options: ['Acordo de Paris', 'Tratado de Tordesilhas', 'Pacto de Varsóvia', 'Acordo de Basileia I'],
      correct: 0,
      explanation: 'O Acordo de Paris foca na redução de emissões.'
    },
    {
      id: 'manual-14-5',
      age: 14,
      area: 'Tecnologia',
      question: 'Qual é a prática correta para descarte de lixo eletrônico (e-lixo)?',
      options: ['levar a pontos de coleta', 'jogar no lixão', 'queimar em casa', 'enterrar no quintal'],
      correct: 0,
      explanation: 'E-lixo deve ser destinado a pontos de coleta.'
    }
  ]
};

const STORAGE_PREFIX = 'ecoplay.manual.quiz.';

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const validateQuestionsForAge = (age, questions) => {
  if (!Array.isArray(questions) || questions.length !== 5) return false;
  const areas = new Set();
  for (const q of questions) {
    const ok =
      q &&
      Number(q.age) === Number(age) &&
      typeof q.question === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      typeof q.correct === 'number' &&
      q.correct >= 0 &&
      q.correct < 4 &&
      typeof q.explanation === 'string' &&
      q.explanation.length > 0;
    if (!ok) return false;
    areas.add(String(q.area || '').toLowerCase());
  }
  return areas.size >= 4;
};

export const loadManualQuestions = (age) => {
  const key = `${STORAGE_PREFIX}${age}`;
  const cached = readJson(key);
  if (cached && validateQuestionsForAge(age, cached)) return cached.slice();
  const source = MANUAL_QUIZ_BY_AGE[age] ? MANUAL_QUIZ_BY_AGE[age].map(x => ({ ...x })) : [];
  if (validateQuestionsForAge(age, source)) {
    writeJson(key, source);
    return source.slice();
  }
  return [];
};

const OUTCOME_KEY = 'ecoplay.manual.outcomes';

export const recordManualQuestionOutcome = ({ questionId, age, correct }) => {
  try {
    const prev = readJson(OUTCOME_KEY);
    const next = Array.isArray(prev) ? prev.slice() : [];
    next.push({
      at: new Date().toISOString(),
      questionId: String(questionId || ''),
      age: Number(age || 0),
      correct: Boolean(correct)
    });
    writeJson(OUTCOME_KEY, next.slice(-2000));
    return true;
  } catch {
    return false;
  }
};