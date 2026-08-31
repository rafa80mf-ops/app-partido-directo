export const ACTION_PRIORITY = [
  'goal',
  'assist',
  'shot-on-goal',
  'shot',
  'clear-chance-created',
  'clear-chance-missed',
  'key-pass',
  'dribble',
  'crosses',
  'completed-passes',
  'ball-loss',
  'offside',
  'interception',
  'tackle',
  'defensive-duel-won',
  'defensive-duel-lost',
  'ball-recovery',
  'clearance',
  'block',
  'recovery-opposition',
  'error-goal',
  'error-chance',
  'saves',
  'shots-faced',
  'goals-conceded',
  'save-rate',
  'clean-sheet',
  'one-on-one-won',
  'yellow',
  'red',
  'foul',
  'fouls-received',
  'penalty',
  'penalty-awarded',
  'injury',
  'substitution',
  'edit-number',
];

const ACTION_LABELS = {
  goal: 'Gol',
  assist: 'Asistencia',
  'shot-on-goal': 'Tiro a puerta',
  shot: 'Tiros',
  'clear-chance-created': 'Ocasión clara creada',
  'clear-chance-missed': 'Ocasión clara fallada',
  'key-pass': 'Pases clave',
  dribble: 'Regates',
  crosses: 'Centros',
  'completed-passes': 'Pases completados',
  'ball-loss': 'Pérdidas de balón',
  offside: 'Fueras de juego',
  interception: 'Intercepciones',
  tackle: 'Entradas',
  'defensive-duel-won': 'Duelos defensivos ganados',
  'defensive-duel-lost': 'Duelos defensivos perdidos',
  'ball-recovery': 'Balones recuperados',
  clearance: 'Despejes',
  block: 'Bloqueos',
  'recovery-opposition': 'Recuperaciones en campo rival',
  'error-goal': 'Error provoca gol',
  'error-chance': 'Error provoca ocasión',
  saves: 'Paradas',
  'shots-faced': 'Tiros recibidos',
  'goals-conceded': 'Goles encajados',
  'save-rate': '% de paradas',
  'clean-sheet': 'Portería a cero',
  'one-on-one-won': '1 contra 1 ganados',
  yellow: 'Tarjeta amarilla',
  red: 'Tarjeta roja',
  foul: 'Faltas cometidas',
  'fouls-received': 'Faltas recibidas',
  penalty: 'Penaltis cometidos',
  'penalty-awarded': 'Penaltis recibidos',
  injury: 'Lesión',
  substitution: 'Cambio',
  'edit-number': 'Dorsal',
};

export const ACTION_GROUPS = [
  {
    id: 'offensive',
    title: 'Estadísticas ofensivas',
    types: ['goal', 'assist', 'shot-on-goal', 'shot', 'clear-chance-created', 'clear-chance-missed', 'key-pass', 'dribble', 'crosses', 'completed-passes', 'ball-loss', 'offside'],
  },
  {
    id: 'defensive',
    title: 'Estadísticas defensivas',
    types: ['interception', 'tackle', 'defensive-duel-won', 'defensive-duel-lost', 'ball-recovery', 'clearance', 'block', 'recovery-opposition', 'error-goal', 'error-chance'],
  },
  {
    id: 'goalkeeper',
    title: 'Porteras/os',
    types: ['saves', 'shots-faced', 'goals-conceded', 'save-rate', 'clean-sheet', 'one-on-one-won', 'clearance', 'completed-passes', 'ball-loss'],
  },
  {
    id: 'discipline',
    title: 'Disciplina',
    types: ['yellow', 'red', 'foul', 'fouls-received', 'penalty', 'penalty-awarded'],
  },
  {
    id: 'special',
    title: 'Extras',
    types: ['injury', 'substitution', 'edit-number'],
  },
];

export const PLAYER_ACTIONS = ACTION_PRIORITY.map((type) => ({
  type,
  label: ACTION_LABELS[type] || type,
}));

export const DEFAULT_ENABLED_PLAYER_ACTIONS = [...ACTION_PRIORITY];

export function normalizeEnabledPlayerActions(rawValue) {
  const uniqueSelected = new Set();

  (Array.isArray(rawValue) ? rawValue : DEFAULT_ENABLED_PLAYER_ACTIONS)
    .forEach((actionType) => {
      if (ACTION_PRIORITY.includes(actionType)) {
        uniqueSelected.add(actionType);
      }
    });

  return ACTION_PRIORITY.filter((actionType) => uniqueSelected.has(actionType));
}
