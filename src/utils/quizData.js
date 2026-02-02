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
  { id: 'hidrica-3', category: 'Hídrica', question: 'Usina que usa quedas d’água?', answers: ['hidreletrica', 'usina hidreletrica'] },
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
  { id: 'energia-3', category: 'Energia', question: 'Sigla de “Energia Solar Fotovoltaica”?', answers: ['fv', 'fotovoltaica'] },
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
      area: 'Teoria',
      question: 'O que é energia renovável?',
      options: ['Energia que nunca acaba', 'Energia de pilhas', 'Energia que polui', 'Energia que acaba rápido'],
      correct: 0,
      explanation: 'É a energia que vem de fontes naturais que se repõem, como sol e vento.'
    },
    {
      id: 'manual-10-2',
      age: 10,
      area: 'Teoria',
      question: 'Qual é a fonte de toda energia solar?',
      options: ['O Sol', 'A Lua', 'O Fogo', 'A Terra'],
      correct: 0,
      explanation: 'A luz e o calor do Sol são a origem da energia solar.'
    },
    {
      id: 'manual-10-3',
      age: 10,
      area: 'Teoria',
      question: 'O que é poluição do ar?',
      options: ['Sujeira perigosa no ar', 'Nuvens de chuva', 'Vento forte', 'Cheiro de flores'],
      correct: 0,
      explanation: 'É quando substâncias nocivas (ruins) são misturadas no ar que respiramos.'
    },
    {
      id: 'manual-10-4',
      age: 10,
      area: 'Teoria',
      question: 'O que é reciclar?',
      options: ['Transformar lixo em algo novo', 'Jogar no chão', 'Queimar papel', 'Guardar lixo no bolso'],
      correct: 0,
      explanation: 'Reciclar é o processo de transformar materiais usados em novos produtos.'
    },
    {
      id: 'manual-10-5',
      age: 10,
      area: 'Teoria',
      question: 'O que faz uma turbina eólica?',
      options: ['Usa vento para criar energia', 'Faz vento', 'Esfria a casa', 'Limpa o ar'],
      correct: 0,
      explanation: 'Ela captura a força do vento e a transforma em eletricidade.'
    }
  ],
  11: [
    {
      id: 'manual-11-1',
      age: 11,
      area: 'Teoria',
      question: 'O que são combustíveis fósseis?',
      options: ['Restos antigos de plantas/animais', 'Pedras quentes', 'Madeira nova', 'Gelo derretido'],
      correct: 0,
      explanation: 'São fontes como petróleo e carvão, formados há milhões de anos.'
    },
    {
      id: 'manual-11-2',
      age: 11,
      area: 'Teoria',
      question: 'O que é o Efeito Estufa?',
      options: ['Calor retido na Terra', 'Uma casa de vidro', 'Esfriamento do planeta', 'Plantação de flores'],
      correct: 0,
      explanation: 'É o fenômeno natural que mantém a Terra aquecida, mas que aumenta com a poluição.'
    },
    {
      id: 'manual-11-3',
      age: 11,
      area: 'Teoria',
      question: 'O que define um recurso "não renovável"?',
      options: ['Ele acaba e não volta logo', 'Ele dura para sempre', 'Ele é feito de água', 'Ele vem do espaço'],
      correct: 0,
      explanation: 'Não renováveis levam milhões de anos para se formar e podem se esgotar.'
    },
    {
      id: 'manual-11-4',
      age: 11,
      area: 'Teoria',
      question: 'Qual é o conceito de desmatamento?',
      options: ['Remoção da floresta nativa', 'Plantar árvores', 'Cuidar do jardim', 'Chuva na floresta'],
      correct: 0,
      explanation: 'É a retirada da cobertura vegetal original de uma área.'
    },
    {
      id: 'manual-11-5',
      age: 11,
      area: 'Teoria',
      question: 'O que é energia hidrelétrica?',
      options: ['Energia da força da água', 'Energia do fogo', 'Energia do trovão', 'Energia das pedras'],
      correct: 0,
      explanation: 'É a eletricidade gerada pelo aproveitamento da força da água em movimento.'
    }
  ],
  12: [
    {
      id: 'manual-12-1',
      age: 12,
      area: 'Teoria',
      question: 'Definição de Eficiência Energética:',
      options: ['Fazer o mesmo gastando menos energia', 'Gastar mais energia rápido', 'Não usar energia nenhuma', 'Desligar tudo para sempre'],
      correct: 0,
      explanation: 'Significa usar a energia de forma inteligente para evitar desperdícios.'
    },
    {
      id: 'manual-12-2',
      age: 12,
      area: 'Teoria',
      question: 'O que é Biomassa?',
      options: ['Matéria orgânica usada como energia', 'Massa de modelar', 'Pedras vulcânicas', 'Plástico derretido'],
      correct: 0,
      explanation: 'Qualquer matéria orgânica (restos de plantas, alimentos) que pode gerar energia.'
    },
    {
      id: 'manual-12-3',
      age: 12,
      area: 'Teoria',
      question: 'Qual a função da Camada de Ozônio?',
      options: ['Proteger contra raios UV nocivos', 'Prender o calor na Terra', 'Gerar oxigênio', 'Bloquear a luz do sol'],
      correct: 0,
      explanation: 'Ela atua como um escudo filtrando a radiação ultravioleta prejudicial do Sol.'
    },
    {
      id: 'manual-12-4',
      age: 12,
      area: 'Teoria',
      question: 'O que é Biodiversidade?',
      options: ['Variedade de vida em um local', 'Estudo de pedras', 'Qualidade da água', 'Quantidade de lixo'],
      correct: 0,
      explanation: 'Refere-se à variedade de espécies de plantas, animais e micro-organismos.'
    },
    {
      id: 'manual-12-5',
      age: 12,
      area: 'Teoria',
      question: 'Conceito de Água Potável:',
      options: ['Água segura para consumo humano', 'Água do mar', 'Água de esgoto', 'Qualquer água líquida'],
      correct: 0,
      explanation: 'É a água tratada e livre de contaminantes, própria para beber.'
    }
  ],
  13: [
    {
      id: 'manual-13-1',
      age: 13,
      area: 'Teoria',
      question: 'O que é "Pegada Ecológica"?',
      options: ['Impacto humano sobre a natureza', 'Pegada de um animal raro', 'Caminho na floresta', 'Marca de pneu na grama'],
      correct: 0,
      explanation: 'Mede a quantidade de recursos naturais necessários para sustentar nosso estilo de vida.'
    },
    {
      id: 'manual-13-2',
      age: 13,
      area: 'Teoria',
      question: 'O que é Energia Geotérmica?',
      options: ['Calor proveniente do interior da Terra', 'Energia das rochas frias', 'Energia do solo fértil', 'Calor do asfalto'],
      correct: 0,
      explanation: 'É a energia obtida a partir do calor natural do interior do planeta.'
    },
    {
      id: 'manual-13-3',
      age: 13,
      area: 'Teoria',
      question: 'Definição de Aquecimento Global:',
      options: ['Aumento da temperatura média do planeta', 'Verão mais longo', 'Fogo nas florestas', 'Derretimento de gelo no copo'],
      correct: 0,
      explanation: 'É o aumento persistente da temperatura média da atmosfera e dos oceanos.'
    },
    {
      id: 'manual-13-4',
      age: 13,
      area: 'Teoria',
      question: 'O que são Biocombustíveis?',
      options: ['Combustíveis de origem biológica', 'Combustíveis de plástico', 'Combustíveis de pedra', 'Combustíveis nucleares'],
      correct: 0,
      explanation: 'São fontes de energia renovável derivadas de materiais biológicos (etanol, biodiesel).'
    },
    {
      id: 'manual-13-5',
      age: 13,
      area: 'Teoria',
      question: 'Conceito de Coleta Seletiva:',
      options: ['Separação prévia de resíduos recicláveis', 'Juntar todo lixo num saco', 'Queimar lixo no quintal', 'Esconder lixo na terra'],
      correct: 0,
      explanation: 'É o processo de separar resíduos por tipo na origem para facilitar a reciclagem.'
    }
  ],
  14: [
    {
      id: 'manual-14-1',
      age: 14,
      area: 'Teoria',
      question: 'O que é Desenvolvimento Sustentável?',
      options: ['Crescer sem esgotar recursos futuros', 'Crescer o máximo possível hoje', 'Parar todo o desenvolvimento', 'Usar tudo o que temos agora'],
      correct: 0,
      explanation: 'É suprir as necessidades do presente sem comprometer a capacidade das gerações futuras.'
    },
    {
      id: 'manual-14-2',
      age: 14,
      area: 'Teoria',
      question: 'O que é o "Efeito Fotovoltaico"?',
      options: ['Conversão direta de luz em eletricidade', 'Luz virando calor', 'Reflexo da luz no espelho', 'Foto tirada com flash'],
      correct: 0,
      explanation: 'É o fenômeno físico onde a luz incide sobre um material e gera corrente elétrica.'
    },
    {
      id: 'manual-14-3',
      age: 14,
      area: 'Teoria',
      question: 'O que é Matriz Energética?',
      options: ['Conjunto de fontes de energia disponíveis', 'Uma tabela de preços', 'Um robô de energia', 'A mãe de todas as energias'],
      correct: 0,
      explanation: 'Representa o conjunto de todas as fontes de energia usadas por um país ou região.'
    },
    {
      id: 'manual-14-4',
      age: 14,
      area: 'Teoria',
      question: 'Definição de Economia Circular:',
      options: ['Sistema onde resíduos viram insumos', 'Economia de moedas redondas', 'Gastar dinheiro em círculos', 'Comprar e jogar fora (Linear)'],
      correct: 0,
      explanation: 'Modelo que busca eliminar resíduos, mantendo produtos e materiais em uso perpétuo.'
    },
    {
      id: 'manual-14-5',
      age: 14,
      area: 'Teoria',
      question: 'O que é Carbono Neutro (Net Zero)?',
      options: ['Equilibrar emissão e remoção de carbono', 'Não usar carbono nenhum', 'Pintar o carbono de branco', 'Parar de respirar'],
      correct: 0,
      explanation: 'É o estado onde as emissões de gases estufa são compensadas pela remoção de carbono da atmosfera.'
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
  // Check for exact match first
  if (MANUAL_QUIZ_BY_AGE[age]) {
    const source = MANUAL_QUIZ_BY_AGE[age].map(x => ({ ...x }));
    if (validateQuestionsForAge(age, source)) {
      writeJson(key, source);
      return source.slice();
    }
  }

  // Fallback: Find nearest available age
  const availableAges = Object.keys(MANUAL_QUIZ_BY_AGE).map(Number).sort((a, b) => a - b);
  if (availableAges.length > 0) {
    const nearest = availableAges.reduce((prev, curr) =>
      Math.abs(curr - age) < Math.abs(prev - age) ? curr : prev
    );
    console.warn(`No manual questions for age ${age}. Using fallback age ${nearest}.`);
    // Return nearest age questions but keep the requested age in the ID/Metadata if possible?
    // Actually, simply returning the nearest set is fine for manual fallback.
    const source = MANUAL_QUIZ_BY_AGE[nearest].map(x => ({ ...x }));
    return source;
  }

  return [];
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
