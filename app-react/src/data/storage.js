export const STORAGE_KEY = 'partido_directo_match_state_v1';
const ROSTER_BACKUP_KEY = 'partido_directo_roster_backup_v1';
export const ROSTER_SIZE = 20;
export const CLUB_NAME = 'C.F. NAVARCLES';
export const DEFAULT_CLUB_CREST = '/club-crest.svg';
export const DEFAULT_LEAGUE_NAME = 'Liga';
export const DEFAULT_LEAGUE_LOGO = '/fcf-logo.svg';
export const DEFAULT_TEAM_APPEARANCE = { color: '#facc15', secondaryColor: '#111827', shape: 'ball' };
export const DEFAULT_APP_LANGUAGE = 'es';
const BLOCKED_PLAYER_NUMBERS = new Set([28, 29, 30]);

const SUPPORTED_APP_LANGUAGES = new Set(['es', 'en', 'fr', 'pt', 'de', 'it']);

function normalizeAppLanguage(language) {
  const safeLanguage = typeof language === 'string' ? language.trim().toLowerCase() : '';
  return SUPPORTED_APP_LANGUAGES.has(safeLanguage) ? safeLanguage : DEFAULT_APP_LANGUAGE;
}

function getDefaultSeason() {
  const currentYear = new Date().getFullYear();
  const startsThisYear = new Date().getMonth() >= 6;
  const firstYear = startsThisYear ? currentYear : currentYear - 1;
  return `${firstYear}-${firstYear + 1}`;
}

function normalizeCalendarMatches(matches) {
  return (Array.isArray(matches) ? matches : []).map((match) => ({
    ...match,
    type: match.type || 'Liga',
    time: match.time || '',
  })).sort((firstMatch, secondMatch) => `${firstMatch.date}T${firstMatch.time}`.localeCompare(`${secondMatch.date}T${secondMatch.time}`));
}

const TECHNICAL_STAFF_ROLES = new Set([
  'ENTRENADOR',
  'SEGUNDO_ENTRENADOR',
  'DELEGADO',
  'FISIO',
  'AUXILIAR',
]);

function normalizeTechnicalStaffRole(role) {
  const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
  if (TECHNICAL_STAFF_ROLES.has(normalizedRole)) {
    return normalizedRole;
  }

  return 'AUXILIAR';
}

function normalizeTechnicalStaffMember(member, fallbackIndex = 0) {
  if (!member || typeof member !== 'object') {
    return null;
  }

  const name = typeof member.name === 'string' ? member.name.trim() : '';
  if (!name) {
    return null;
  }

  return {
    id: typeof member.id === 'string' && member.id.trim() ? member.id.trim() : `staff-${fallbackIndex}-${name.toLowerCase().replace(/\s+/g, '-')}`,
    role: normalizeTechnicalStaffRole(member.role),
    name,
  };
}

function normalizeTechnicalStaff(rawValue) {
  if (typeof rawValue === 'string') {
    return rawValue
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          return null;
        }

        const [rawRole, ...rest] = trimmedLine.split(':');
        const maybeName = rest.join(':').trim();
        const hasRoleAndName = Boolean(rawRole?.trim()) && Boolean(maybeName);

        return normalizeTechnicalStaffMember({
          role: hasRoleAndName ? rawRole : 'AUXILIAR',
          name: hasRoleAndName ? maybeName : trimmedLine,
          id: `staff-${index}`,
        }, index);
      })
      .filter(Boolean)
      .slice(0, 20);
  }

  if (Array.isArray(rawValue)) {
    return rawValue
      .map((member, index) => {
        if (typeof member === 'string') {
          return normalizeTechnicalStaffMember({ role: 'AUXILIAR', name: member, id: `staff-${index}` }, index);
        }

        return normalizeTechnicalStaffMember(member, index);
      })
      .filter(Boolean)
      .slice(0, 20);
  }

  return [];
}

function normalizeTrainingSessions(rawValue) {
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((training, index) => {
      if (!training || typeof training !== 'object' || !training.date) {
        return null;
      }

      const attendance = training.attendance && typeof training.attendance === 'object'
        ? Object.fromEntries(Object.entries(training.attendance).map(([playerId, status]) => [
            playerId,
            status === 'present' ? 'present' : 'absent',
          ]))
        : {};

      const absenceReasons = training.absenceReasons && typeof training.absenceReasons === 'object'
        ? Object.fromEntries(Object.entries(training.absenceReasons)
          .filter(([playerId]) => attendance[playerId] === 'absent')
          .map(([playerId, reason]) => {
            const safeReason = typeof reason === 'string' ? reason.trim().toLowerCase() : 'otros';
            return [playerId, ['lesion', 'estudios', 'medicos', 'otros'].includes(safeReason) ? safeReason : 'otros'];
          }))
        : {};

      return {
        id: typeof training.id === 'string' && training.id.trim() ? training.id : `training-${index}-${training.date}`,
        date: String(training.date),
        number: Math.max(1, Number(training.number) || 1),
        attendance,
        absenceReasons,
      };
    })
    .filter(Boolean)
    .sort((firstTraining, secondTraining) => secondTraining.date.localeCompare(firstTraining.date));
}

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

function sortPlayers(players) {
  return [...players].sort((firstPlayer, secondPlayer) => {
    const firstNumber = Number(firstPlayer.number) || 0;
    const secondNumber = Number(secondPlayer.number) || 0;
    return firstNumber - secondNumber;
  });
}

function createBenchPlayer(number) {
  return {
    id: `bench-${number}`,
    number,
    name: `Suplente ${number}`,
    role: 'SUP',
    injured: false,
    yellowCards: 0,
    redCards: 0,
    x: 0,
    y: 0,
  };
}

function isBlockedPlayer(player) {
  return BLOCKED_PLAYER_NUMBERS.has(Number(player?.number));
}

function defaultPlayerName(player, fallbackNumber = 1) {
  const trimmedName = typeof player?.name === 'string' ? player.name.trim() : '';
  if (trimmedName) {
    return trimmedName;
  }

  const role = (player?.role || 'MED').toUpperCase();
  const number = Number(player?.number) || fallbackNumber;
  return `${role === 'POR' ? 'Portera' : role === 'DEF' ? 'Defensa' : role === 'MED' ? 'Media' : 'Delantera'} ${number}`;
}

function isNamedPlayer(player) {
  return Boolean(player?.name?.trim()) && !/^(Suplente\s+\d+|Portera|Defensa|Media|Medio|Delantera)$/i.test(player.name.trim());
}

function loadRosterBackup() {
  try {
    const backup = JSON.parse(localStorage.getItem(ROSTER_BACKUP_KEY) || 'null');
    return Array.isArray(backup) ? backup : [];
  } catch {
    return [];
  }
}

function saveRosterBackup(roster) {
  const players = [...(roster?.local || []), ...(roster?.bench || [])]
    .filter((player) => isNamedPlayer(player))
    .map((player) => ({
      id: player.id,
      number: player.number,
      name: player.name,
      role: player.role,
    }));

  if (players.length > 0) {
    localStorage.setItem(ROSTER_BACKUP_KEY, JSON.stringify(players));
  }
}

function normalizeRoster(rawRoster, fallbackRoster) {
  const hasLocalRoster = Array.isArray(rawRoster?.local);
  const hasBenchRoster = Array.isArray(rawRoster?.bench);
  const hasVisitorRoster = Array.isArray(rawRoster?.visitor);
  const hasVisitorBenchRoster = Array.isArray(rawRoster?.visitorBench);
  const rawLocal = (hasLocalRoster ? rawRoster.local : fallbackRoster.local).filter(
    (player) => !isBlockedPlayer(player),
  );
  const rawBench = (hasBenchRoster ? rawRoster.bench : fallbackRoster.bench).filter(
    (player) => !isBlockedPlayer(player),
  );
  const rawVisitor = (hasVisitorRoster ? rawRoster.visitor : []).filter(
    (player) => !isBlockedPlayer(player),
  );
  const rawVisitorBench = hasVisitorBenchRoster
    ? rawRoster.visitorBench.filter((player) => !isBlockedPlayer(player))
    : rawVisitor.length > 0
      ? rawBench.map((player) => ({ ...player, id: `visitor-${player.id}` }))
      : [];
  const players = [...rawLocal, ...rawBench].filter(
    (player, index, allPlayers) => player && allPlayers.findIndex((candidate) => candidate.id === player.id) === index,
  );
  const fallbackPlayers = [...fallbackRoster.local, ...fallbackRoster.bench];

  fallbackPlayers.forEach((player) => {
    if (players.length < ROSTER_SIZE && !players.some((currentPlayer) => currentPlayer.id === player.id)) {
      players.push(player);
    }
  });

  let nextNumber = Math.max(0, ...players.map((player) => Number(player.number) || 0)) + 1;
  while (players.length < ROSTER_SIZE) {
    while (players.some((player) => Number(player.number) === nextNumber)) {
      nextNumber += 1;
    }
    players.push(createBenchPlayer(nextNumber));
    nextNumber += 1;
  }

  const backupPlayers = loadRosterBackup();
  const namedPlayerCount = players.filter(isNamedPlayer).length;
  if (backupPlayers.length > namedPlayerCount) {
    backupPlayers.forEach((backupPlayer) => {
      const playerIndex = players.findIndex((player) => player.id === backupPlayer.id || Number(player.number) === Number(backupPlayer.number));
      if (playerIndex >= 0) {
        players[playerIndex] = { ...players[playerIndex], ...backupPlayer };
      }
    });
  }

  const localIds = new Set(rawLocal.map((player) => player.id));
  return {
    local: sortPlayers(players.filter((player) => localIds.has(player.id))).map((player) => ({
      ...player,
      name: defaultPlayerName(player, Number(player.number) || 1),
    })),
    bench: sortPlayers(players.filter((player) => !localIds.has(player.id))).map((player) => ({
      ...player,
      name: defaultPlayerName(player, Number(player.number) || 1),
    })),
    visitor: sortPlayers(rawVisitor.map((player) => ({
      ...player,
      id: player.id || `visitor-${player.number || 1}`,
      name: defaultPlayerName(player, Number(player.number) || 1),
      injured: Boolean(player.injured),
      yellowCards: Number(player.yellowCards) || 0,
      redCards: Number(player.redCards) || 0,
      x: Number(player.x) || 0,
      y: Number(player.y) || 0,
    }))),
    visitorBench: sortPlayers(rawVisitorBench.map((player) => ({
      ...player,
      id: player.id || `visitor-bench-${player.number || 1}`,
      name: defaultPlayerName(player, Number(player.number) || 1),
      injured: Boolean(player.injured),
      yellowCards: Number(player.yellowCards) || 0,
      redCards: Number(player.redCards) || 0,
      x: 0,
      y: 0,
    }))),
  };
}

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
    { id: 17, number: 17, name: 'Suplente 6', role: 'SUP', yellowCards: 0, redCards: 0 },
    { id: 18, number: 18, name: 'Suplente 7', role: 'SUP', yellowCards: 0, redCards: 0 },
    { id: 19, number: 19, name: 'Suplente 8', role: 'SUP', yellowCards: 0, redCards: 0 },
    { id: 20, number: 20, name: 'Suplente 9', role: 'SUP', yellowCards: 0, redCards: 0 },
  ];

  return {
    teams: {
      local: CLUB_NAME,
      visitor: 'VISITANTE',
    },
    clubCrest: DEFAULT_CLUB_CREST,
    leagueName: DEFAULT_LEAGUE_NAME,
    leagueLogo: DEFAULT_LEAGUE_LOGO,
    appLanguage: DEFAULT_APP_LANGUAGE,
    teamAppearance: { ...DEFAULT_TEAM_APPEARANCE },
    clubSide: 'local',
    calendar: [],
    currentSeason: getDefaultSeason(),
    previousSeasons: [],
    history: [],
    technicalStaff: [],
    trainingSessions: [],
    scores: {
      local: 0,
      visitor: 0,
    },
    elapsedSeconds: 0,
    isRunning: false,
    lineupConfirmed: false,
    roster: {
      local: lineUp,
      bench: bench,
      visitor: [],
      visitorBench: [],
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
      local: rawState.teams?.local === 'LOCAL' ? CLUB_NAME : (rawState.teams?.local ?? base.teams.local),
      visitor: rawState.teams?.visitor ?? base.teams.visitor,
    },
    clubCrest: typeof rawState.clubCrest === 'string' && rawState.clubCrest.trim()
      ? rawState.clubCrest.trim()
      : DEFAULT_CLUB_CREST,
    leagueName: typeof rawState.leagueName === 'string' && rawState.leagueName.trim()
      ? rawState.leagueName.trim()
      : DEFAULT_LEAGUE_NAME,
    leagueLogo: typeof rawState.leagueLogo === 'string' && rawState.leagueLogo.trim()
      ? rawState.leagueLogo.trim()
      : DEFAULT_LEAGUE_LOGO,
    appLanguage: normalizeAppLanguage(rawState.appLanguage),
    teamAppearance: {
      color: typeof rawState.teamAppearance?.color === 'string' && rawState.teamAppearance.color.trim()
        ? rawState.teamAppearance.color
        : DEFAULT_TEAM_APPEARANCE.color,
      secondaryColor: typeof rawState.teamAppearance?.secondaryColor === 'string' && rawState.teamAppearance.secondaryColor.trim()
        ? rawState.teamAppearance.secondaryColor
        : DEFAULT_TEAM_APPEARANCE.secondaryColor,
      shape: 'ball',
    },
    clubSide: rawState.clubSide === 'visitor' ? 'visitor' : 'local',
    calendar: normalizeCalendarMatches(rawState.calendar),
    currentSeason: typeof rawState.currentSeason === 'string' && rawState.currentSeason.trim()
      ? rawState.currentSeason.trim()
      : base.currentSeason,
    previousSeasons: (Array.isArray(rawState.previousSeasons) ? rawState.previousSeasons : []).map((season) => ({
      id: season.id || crypto.randomUUID(),
      name: typeof season.name === 'string' && season.name.trim() ? season.name.trim() : 'Temporada sin nombre',
      matches: normalizeCalendarMatches(season.matches),
    })).sort((firstSeason, secondSeason) => secondSeason.name.localeCompare(firstSeason.name)),
    history: Array.isArray(rawState.history) ? rawState.history : [],
    technicalStaff: normalizeTechnicalStaff(rawState.technicalStaff),
    trainingSessions: normalizeTrainingSessions(rawState.trainingSessions),
    scores: {
      local: Number(rawState.scores?.local) || 0,
      visitor: Number(rawState.scores?.visitor) || 0,
    },
    elapsedSeconds: Number(rawState.elapsedSeconds) || 0,
    isRunning: Boolean(rawState.isRunning),
    lineupConfirmed: Boolean(rawState.lineupConfirmed),
    roster: {
      ...normalizeRoster(rawState.roster, base.roster),
      visitor: Array.isArray(rawState.roster?.visitor)
        ? normalizeRoster(rawState.roster, base.roster).visitor
        : [],
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
          players: Array.isArray(event.players) ? event.players : [],
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
    saveRosterBackup(normalizedState.roster);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedState));
    return normalizedState;
  } catch (error) {
    console.warn('No se pudo guardar el estado del partido:', error);
    return state;
  }
}
