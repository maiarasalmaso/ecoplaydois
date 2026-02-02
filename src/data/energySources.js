import { Sun, Wind, Droplets, Leaf, Flame, Zap } from 'lucide-react';

export const ENERGY_SOURCES = [
    {
        id: 'solar',
        title: 'Energia Solar',
        icon: Sun,
        color: 'amber', // Helper for Tailwind classes: text-amber-500, bg-amber-500
        summary: 'Captada diretamente da luz do sol através de painéis fotovoltaicos ou coletores térmicos.',
        pros: [
            'Inesgotável e renovável.',
            'Baixa manutenção após instalação.'
        ],
        cons: [
            'Depende das condições climáticas.',
            'Custo inicial de instalação pode ser alto.'
        ],
        fact: 'A Terra recebe em 1 hora mais energia do sol do que a humanidade consome em 1 ano inteiro!'
    },
    {
        id: 'wind',
        title: 'Energia Eólica',
        icon: Wind,
        color: 'cyan',
        summary: 'Gerada pelo movimento das pás de turbinas impulsionadas pela força do vento.',
        pros: [
            'Não emite poluentes durante a geração.',
            'Ocupa pouco espaço no solo (pode coexistir com agricultura).'
        ],
        cons: [
            'Visualmente impactante e gera ruído.',
            'Pode afetar pássaros se não bem planejada.'
        ],
        fact: 'Uma única turbina eólica moderna pode abastecer cerca de 1.500 casas.'
    },
    {
        id: 'hydro',
        title: 'Energia Hidrelétrica',
        icon: Droplets,
        color: 'blue',
        summary: 'Produzida pelo aproveitamento do potencial hidráulico de rios em barragens.',
        pros: [
            'Alta eficiência e controle de geração.',
            'Reservatórios podem servir para abastecimento de água.'
        ],
        cons: [
            'Grande impacto ambiental na construção (alagamentos).',
            'Deslocamento de populações ribeirinhas.'
        ],
        fact: 'No Brasil, mais de 60% de toda a energia elétrica vem da força das águas.'
    },
    {
        id: 'biomass',
        title: 'Biomassa',
        icon: Leaf,
        color: 'green',
        summary: 'Gerada através da queima ou decomposição de matéria orgânica (restos de madeira, cana, lixo).',
        pros: [
            'Aproveita resíduos que seriam descartados.',
            'Menos poluente que combustíveis fósseis.'
        ],
        cons: [
            'Ainda emite CO2 (embora neutro no ciclo).',
            'Pode incentivar desmatamento se não controlada.'
        ],
        fact: 'O bagaço da cana-de-açúcar é uma das maiores fontes de energia renovável do Brasil.'
    },
    {
        id: 'geothermal',
        title: 'Geotérmica',
        icon: Flame, // Using Flame as proxy for heat
        color: 'rose',
        summary: 'Obtida através do calor proveniente do interior da Terra (magma e águas termais).',
        pros: [
            'Disponível 24h por dia (não depende de clima).',
            'Usinas ocupam pouco espaço.'
        ],
        cons: [
            'Restrita a locais específicos (falhas geológicas).',
            'Pode liberar gases tóxicos do subsolo.'
        ],
        fact: 'A Islândia produz quase 100% de sua eletricidade a partir de fontes geotérmicas e hidrelétricas.'
    }
];
