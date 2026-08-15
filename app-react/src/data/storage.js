export const STORAGE_KEY = 'partido_directo_match_state_v1';

export const DB_SCHEMA = {
  matches: [
    'id',
    'localName',
    'visitorName',
    'localScore',
    'visitorScore',
    'elapsedSeconds',
    'isRunning',
    'createdAt',
    'updatedAt',
  ],
  events: ['id', 'matchId', 'type', 'team', 'label', 'createdAt'],
  settings: ['key', 'value', 'updatedAt'],
};

export function createEmptyMatchState() {
  const lineUp = [
    { id: 1, number: 1, name: 'Portera', x: 10, y: 50, role: 'POR', yellowCards: 0, redCards: 0 },
    { id: 2, number: 2, name: 'Defensa', x: 22, y: 20, role: 'DEF', yellowCards: 0, redCards: 0 },
    { id: 3, number: 3, name: 'Defensa', x: 22, y: 35, role: 'DEF', yellowCards: 0, redCards: 0 },
    { id: 4, number: 4, name: 'Defensa', x: 22, y: 65, role: 'DEF', yellowCards: 0, redCards: 0 },
    { id: 5, number: 5, name: 'Defensa', x: 22, y: 80, role: 'DEF', yellowCards: 0, redCards: 0 },
    { id: 6, number: 6, name: 'Medio', x: 45, y: 22, role: 'MED', yellowCards: 0, redCards: 0 },
    { id: 7, number: 7, name: 'Medio', x: 45, y: 42, role: 'MED', yellowCards: 0, redCards: 0 },
    { id: 8, number: 8, name: 'Medio', x: 45, y: 58, role: 'MED', yellowCards: 0, redCards: 0 },
    { id: 9, number: 9, name: 'Delantera', x: 45, y: 78, role: 'DEL', yellowCards: 0, redCards: 0 },
    { id: 10, number: 10, name: 'Delantera', x: 68, y: 35, role: 'DEL', yellowCards: 0, redCards: 0 },
    { id: 11, number: 11, name: 'Delantera', x: 68, y: 65, role: 'DEL', yellowCards: 0, redCards: 0 },
  ];

  const bench = [
    { id: 12, number: 12, name: 'Suplente 1', role: 'SUP', yellowCards: 0, redCards: 0 },
    { id: 13, number: 13, name: 'Suplente 2', role: 'SUP', yellowCards: 0, redCards: 0 },
    { id: 14, number: 14, name: 'Suplente 3', role: 'SUP', yellowCards: 0, redCards: 0 },
    { id: 15, number: 15, name: 'Suplente 4', role: 'SUP', yellowCards: 0, redCards: 0 },
    { id: 16, number: 16, name: 'Suplente 5', role: 'SUP', yellowCards: 0, redCards: 0 },
  ];

  return {
    teams: {
      local: 'LOCAL',
      visitor: 'VISITANTE',
    },
    scores: {
      local: 0,
      visitor: 0,
    },
    elapsedSeconds: 0,
    isRunning: false,
    roster: {
      local: lineUp,
      bench: bench,
    },
    ball: {
      x: 50,
      y: 50,
    },
    events: [
      {
        id: crypto.randomUUID(),
        type: 'info',
        label: 'Partido preparado',
        team: 'neutral',
        createdAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeMatchState(rawState) {
  const base = createEmptyMatchState();

  if (!rawState || typeof rawState !== 'object') {
    return base;
  }

  return {
    teams: {
      local: rawState.teams?.local || base.teams.local,
      visitor: rawState.teams?.visitor || base.teams.visitor,
    },
    scores: {
      local: Number(rawState.scores?.local) || 0,
      visitor: Number(rawState.scores?.visitor) || 0,
    },
    elapsedSeconds: Number(rawState.elapsedSeconds) || 0,
    isRunning: Boolean(rawState.isRunning),
    roster: {
      local: Array.isArray(rawState.roster?.local) && rawState.roster.local.length > 0
        ? rawState.roster.local
        : base.roster.local,
      bench: Array.isArray(rawState.roster?.bench) && rawState.roster.bench.length > 0
        ? rawState.roster.bench
        : base.roster.bench,
    },
    ball: {
      x: Number(rawState.ball?.x) || 50,
      y: Number(rawState.ball?.y) || 50,
    },
    events: Array.isArray(rawState.events) && rawState.events.length > 0
      ? rawState.events.map((event) => ({
          id: event.id || crypto.randomUUID(),
          type: event.type || 'info',
          team: event.team || 'neutral',
          label: event.label || 'Evento',
          createdAt: event.createdAt || new Date().toISOString(),
        }))
      : base.events,
    updatedAt: rawState.updatedAt || new Date().toISOString(),
  };
}

export function loadMatchState() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return createEmptyMatchState();
    }

    return normalizeMatchState(JSON.parse(storedValue));
  } catch (error) {
    console.warn('No se pudo cargar el estado del partido:', error);
    return createEmptyMatchState();
  }
}

export function saveMatchState(state) {
  try {
    const normalizedState = normalizeMatchState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedState));
    return normalizedState;
  } catch (error) {
    console.warn('No se pudo guardar el estado del partido:', error);
    return state;
  }
}
