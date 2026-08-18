import { useEffect, useMemo, useState } from 'react';
import './App.css';
import MatchHeader from './components/MatchHeader';
import ControlPanel from './components/ControlPanel';
import MatchEvents from './components/MatchEvents';
import PitchField from './components/PitchField';
import RosterPanel from './components/RosterPanel';
import SubstitutionModal from './components/SubstitutionModal';
import YellowCardModal from './components/YellowCardModal';
import RedCardModal from './components/RedCardModal';
import PlayerActionModal from './components/PlayerActionModal';
import LineupModal from './components/LineupModal';
import CalendarModal from './components/CalendarModal';
import HistoryModal from './components/HistoryModal';
import HistoryEditModal from './components/HistoryEditModal';
import HistoryDashboard from './components/HistoryDashboard';
import PlayerActionMenuModal from './components/PlayerActionMenuModal';
import StartMatchModal from './components/StartMatchModal';
import TacticsBoardModal from './components/TacticsBoardModal';
import {
  CLUB_NAME,
  createEmptyMatchState,
  loadMatchState,
  normalizeMatchState,
  ROSTER_SIZE,
  saveMatchState,
} from './data/storage';
import { loadMatchSnapshot, saveMatchSnapshot } from './data/localDb';

function buildEvent(type, label, team = 'neutral', players = []) {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    team,
    players: players.map((player) => ({ name: player.name, number: player.number })),
    createdAt: new Date().toISOString(),
  };
}

function cloneVisitorPlayers(players) {
  return players.map((player) => ({
    ...player,
    id: `visitor-${player.id}`,
    x: 100 - (Number(player.x) || 50),
    y: Number(player.y) || 50,
    injured: false,
    yellowCards: 0,
    redCards: 0,
  }));
}

function cloneVisitorBenchPlayers(players) {
  return players.map((player) => ({
    ...player,
    id: `visitor-${player.id}`,
    x: 0,
    y: 0,
    injured: false,
    yellowCards: 0,
    redCards: 0,
  }));
}

function getMatchSide(rosterTeam, clubSide) {
  if (rosterTeam === 'local') {
    return clubSide === 'visitor' ? 'visitor' : 'local';
  }

  return clubSide === 'visitor' ? 'local' : 'visitor';
}

function formatPlayerEventLabel(player, rosterTeam) {
  return rosterTeam === 'visitor' ? `#${player.number}` : player.name;
}

function App() {
  const [matchState, setMatchState] = useState(() => loadMatchState());
  const [injuredPlayerModal, setInjuredPlayerModal] = useState(null);
  const [selectingInjured, setSelectingInjured] = useState(false);
  const [yellowCardModal, setYellowCardModal] = useState(false);
  const [redCardModal, setRedCardModal] = useState(null);
  const [playerActionModal, setPlayerActionModal] = useState(null);
  const [lineupSelectionOpen, setLineupSelectionOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeCalendarMatchId, setActiveCalendarMatchId] = useState(null);
  const [editingHistoryId, setEditingHistoryId] = useState(null);
  const [historyEditMatch, setHistoryEditMatch] = useState(null);
  const [playerActionMenu, setPlayerActionMenu] = useState(null);
  const [substitutionModal, setSubstitutionModal] = useState(null);
  const [startMatchOpen, setStartMatchOpen] = useState(false);
  const [startMatchMode, setStartMatchMode] = useState('default');
  const [tacticsBoardOpen, setTacticsBoardOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('live');
  const [teamSeasonDraft, setTeamSeasonDraft] = useState('');
  const [halfTimeNoticeShown, setHalfTimeNoticeShown] = useState(false);
  const [fullTimeNoticeShown, setFullTimeNoticeShown] = useState(false);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadMatchSnapshot()
      .then((savedSnapshot) => {
        if (!isMounted || !savedSnapshot) {
          return;
        }

        setMatchState((currentState) => {
          const currentUpdatedAt = Date.parse(currentState.updatedAt || '') || 0;
          const savedUpdatedAt = Date.parse(savedSnapshot.updatedAt || '') || 0;

          if (savedUpdatedAt < currentUpdatedAt) {
            return currentState;
          }

          const normalizedSnapshot = normalizeMatchState(savedSnapshot);

          return {
            ...currentState,
            ...normalizedSnapshot,
            teams: {
              ...currentState.teams,
              ...(normalizedSnapshot.teams || {}),
            },
            scores: {
              ...currentState.scores,
              ...(normalizedSnapshot.scores || {}),
            },
            roster: normalizedSnapshot.roster || currentState.roster,
            ball: normalizedSnapshot.ball || currentState.ball,
            calendar: Array.isArray(normalizedSnapshot.calendar) ? normalizedSnapshot.calendar : currentState.calendar,
            currentSeason: normalizedSnapshot.currentSeason || currentState.currentSeason,
            previousSeasons: Array.isArray(normalizedSnapshot.previousSeasons)
              ? normalizedSnapshot.previousSeasons
              : currentState.previousSeasons,
            history: Array.isArray(normalizedSnapshot.history) ? normalizedSnapshot.history : currentState.history,
            events: Array.isArray(normalizedSnapshot.events) ? normalizedSnapshot.events : currentState.events,
          };
        });
      })
      .catch(() => {
        // Se ignora y continúa con el estado local del navegador
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!matchState.isRunning) {
      return undefined;
    }

    if (matchState.elapsedSeconds >= 47 * 60 && !halfTimeNoticeShown) {
      setHalfTimeNoticeShown(true);
      const isHalfTime = window.confirm('Han pasado 47 minutos. ¿Ha terminado la primera parte?');
      if (isHalfTime) {
        updateMatchState((currentState) => ({
          ...currentState,
          isRunning: false,
          events: [
            buildEvent('info', 'Primera parte finalizada'),
            ...currentState.events,
          ].slice(0, 25),
        }));
      }
    }

    if (matchState.elapsedSeconds >= 95 * 60 && !fullTimeNoticeShown) {
      setFullTimeNoticeShown(true);
      setFinalizeConfirmOpen(true);
    }

    const timer = window.setInterval(() => {
      setMatchState((currentState) => ({
        ...currentState,
        elapsedSeconds: currentState.elapsedSeconds + 1,
        updatedAt: new Date().toISOString(),
      }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [matchState.isRunning, matchState.elapsedSeconds, halfTimeNoticeShown, fullTimeNoticeShown]);

  useEffect(() => {
    saveMatchState(matchState);
    saveMatchSnapshot(matchState);
  }, [matchState]);

  const summary = useMemo(() => {
    const totalGoals = matchState.scores.local + matchState.scores.visitor;
    return {
      totalGoals,
      status: matchState.isRunning ? 'En directo' : 'Parado',
    };
  }, [matchState]);

  const updateMatchState = (updater) => {
    setMatchState((currentState) => {
      const nextState = typeof updater === 'function' ? updater(currentState) : updater;
      return {
        ...nextState,
        updatedAt: new Date().toISOString(),
      };
    });
  };

  const handleTeamNameChange = (team, value) => {
    updateMatchState((currentState) => ({
      ...currentState,
      teams: {
        ...currentState.teams,
        [team]: value,
      },
    }));
  };

  const handleClubCrestChange = (clubCrest) => {
    updateMatchState((currentState) => ({ ...currentState, clubCrest }));
  };

  const handleClubCrestUpload = (event) => {
    const [file] = event.target.files || [];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = () => handleClubCrestChange(String(reader.result));
    reader.readAsDataURL(file);
  };

  const handleToggleRunning = () => {
    if (!matchState.lineupConfirmed) {
      setStartMatchMode('default');
      setStartMatchOpen(true);
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      isRunning: !currentState.isRunning,
      events: [
        buildEvent('info', currentState.isRunning ? 'Partido pausado' : 'Partido reanudado'),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleCreateInstantMatch = ({ local, visitor, clubSide }) => {
    const allPlayers = [...matchState.roster.local, ...matchState.roster.bench].map((player) => ({
      ...player,
      injured: false,
      yellowCards: 0,
      redCards: 0,
      x: 0,
      y: 0,
    }));

    updateMatchState((currentState) => ({
      ...currentState,
      teams: { local, visitor },
      clubSide,
      scores: { local: 0, visitor: 0 },
      elapsedSeconds: 0,
      isRunning: false,
      lineupConfirmed: false,
      roster: {
        local: [],
        bench: allPlayers,
        visitor: [],
        visitorBench: cloneVisitorBenchPlayers(allPlayers),
      },
      ball: { x: 50, y: 50 },
      events: [buildEvent('info', `${local} - ${visitor} creado al instante`)],
    }));
    setStartMatchOpen(false);
    setStartMatchMode('default');
    setActiveCalendarMatchId(null);
    setEditingHistoryId(null);
    setLineupSelectionOpen(true);
  };

  const handleReset = () => {
    const resetState = createEmptyMatchState();
    resetState.teams = { local: '', visitor: '' };
    resetState.clubSide = 'local';
    resetState.calendar = [...matchState.calendar];
    resetState.currentSeason = matchState.currentSeason;
    resetState.previousSeasons = [...matchState.previousSeasons];
    resetState.history = [...matchState.history];
    resetState.lineupConfirmed = false;
    resetState.roster = {
      local: [],
      bench: [],
      visitor: [],
      visitorBench: [],
    };
    resetState.ball = { x: 50, y: 50 };
    resetState.events = [buildEvent('reset', 'Marcador reiniciado')];
    setMatchState(resetState);
    setLineupSelectionOpen(false);
    setStartMatchMode('fresh');
    setStartMatchOpen(true);
    setHalfTimeNoticeShown(false);
    setFullTimeNoticeShown(false);
  };

  const handleAddCalendarMatch = (match) => {
    updateMatchState((currentState) => ({
      ...currentState,
      calendar: [
        ...currentState.calendar,
        { ...match, id: crypto.randomUUID() },
      ].sort((firstMatch, secondMatch) => `${firstMatch.date}T${firstMatch.time}`.localeCompare(`${secondMatch.date}T${secondMatch.time}`)),
    }));
  };

  const handleUpdateCalendarMatch = (matchId, updates) => {
    updateMatchState((currentState) => ({
      ...currentState,
      calendar: currentState.calendar.map((match) =>
        match.id === matchId ? { ...match, ...updates } : match,
      ).sort((firstMatch, secondMatch) => `${firstMatch.date}T${firstMatch.time}`.localeCompare(`${secondMatch.date}T${secondMatch.time}`)),
    }));
  };

  const handleDeleteCalendarMatch = (matchId) => {
    updateMatchState((currentState) => ({
      ...currentState,
      calendar: currentState.calendar.filter((match) => match.id !== matchId),
    }));
  };

  const handleCreateSeason = () => {
    const nextSeason = teamSeasonDraft.trim();
    if (!nextSeason) return;

    if (nextSeason === matchState.currentSeason) {
      setTeamSeasonDraft(nextSeason);
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      calendar: [],
      currentSeason: nextSeason,
      previousSeasons: [
        {
          id: crypto.randomUUID(),
          name: currentState.currentSeason,
          matches: currentState.calendar,
        },
        ...(currentState.previousSeasons || []).filter((season) => season.name !== currentState.currentSeason),
      ],
    }));
    setTeamSeasonDraft(nextSeason);
  };

  const handleSelectCalendarMatch = (match) => {
    setActiveCalendarMatchId(match.id);
    const allPlayers = [...matchState.roster.local, ...matchState.roster.bench].map((player) => ({
      ...player,
      injured: false,
      yellowCards: 0,
      redCards: 0,
      x: 0,
      y: 0,
    }));
    const isClubVisitor = match.clubSide
      ? match.clubSide === 'visitor'
      : match.visitor.trim().toUpperCase() === CLUB_NAME;

    updateMatchState((currentState) => ({
      ...currentState,
      teams: {
        local: match.local,
        visitor: match.visitor,
      },
      clubSide: isClubVisitor ? 'visitor' : 'local',
      scores: { local: 0, visitor: 0 },
      elapsedSeconds: 0,
      isRunning: false,
      lineupConfirmed: false,
      roster: {
        local: [],
        bench: allPlayers,
        visitor: [],
        visitorBench: cloneVisitorBenchPlayers(allPlayers),
      },
      ball: { x: 50, y: 50 },
      events: [buildEvent('info', `${match.local} - ${match.visitor} seleccionado del calendario`)],
    }));
    setCalendarOpen(false);
    setStartMatchOpen(false);
    setLineupSelectionOpen(true);
    setHalfTimeNoticeShown(false);
    setFullTimeNoticeShown(false);
  };

  const handleFinalize = () => {
    setFinalizeConfirmOpen(true);
  };

  const confirmFinalize = () => {
    const calendarMatch = matchState.calendar.find((match) => match.id === activeCalendarMatchId);
    const historyMatch = matchState.history.find((match) => match.id === editingHistoryId);
    const finishedMatch = {
      id: editingHistoryId || crypto.randomUUID(),
      finishedAt: new Date().toLocaleString('es-ES'),
      teams: { ...matchState.teams },
      scores: { ...matchState.scores },
      elapsedSeconds: matchState.elapsedSeconds,
      clubSide: matchState.clubSide,
      type: calendarMatch?.type || historyMatch?.type || 'Amistoso',
      events: [...matchState.events],
      roster: {
        local: [...matchState.roster.local],
        bench: [...matchState.roster.bench],
      },
      lineupConfirmed: matchState.lineupConfirmed,
    };

    updateMatchState((currentState) => {
      const allPlayers = [...currentState.roster.local, ...currentState.roster.bench].map((player) => ({
        ...player,
        injured: false,
        yellowCards: 0,
        redCards: 0,
        x: 0,
        y: 0,
      }));

      return {
        ...currentState,
        teams: { local: '', visitor: '' },
        clubSide: 'local',
        scores: { local: 0, visitor: 0 },
        elapsedSeconds: 0,
        isRunning: false,
        lineupConfirmed: false,
        roster: {
          local: [],
          bench: allPlayers,
          visitor: [],
          visitorBench: cloneVisitorBenchPlayers(allPlayers),
        },
        ball: { x: 50, y: 50 },
        history: editingHistoryId
          ? currentState.history.map((match) => match.id === editingHistoryId ? finishedMatch : match)
          : [...currentState.history, finishedMatch],
        calendar: activeCalendarMatchId
          ? currentState.calendar.filter((match) => match.id !== activeCalendarMatchId)
          : currentState.calendar,
        events: [buildEvent('info', 'Partido finalizado. Listo para iniciar uno nuevo.')],
      };
    });
    setActiveCalendarMatchId(null);
    setEditingHistoryId(null);
    setLineupSelectionOpen(false);
    setStartMatchMode('fresh');
    setStartMatchOpen(true);
    setFullTimeNoticeShown(true);
    setFinalizeConfirmOpen(false);
  };

  const handleEditHistoryMatch = (historyMatch) => {
    setHistoryEditMatch(historyMatch);
    setHistoryOpen(false);
  };

  const handleSaveHistoryActions = (events) => {
    if (!historyEditMatch) return;

    const countGoals = (eventList, team) => eventList.filter(
      (event) => event.type === 'goal' && event.team === team,
    ).length;
    const originalLocalGoals = countGoals(historyEditMatch.events, 'local');
    const originalVisitorGoals = countGoals(historyEditMatch.events, 'visitor');
    const updatedLocalGoals = countGoals(events, 'local');
    const updatedVisitorGoals = countGoals(events, 'visitor');

    updateMatchState((currentState) => ({
      ...currentState,
      history: currentState.history.map((match) => match.id === historyEditMatch.id ? {
        ...match,
        events,
        scores: {
          local: match.scores.local + updatedLocalGoals - originalLocalGoals,
          visitor: match.scores.visitor + updatedVisitorGoals - originalVisitorGoals,
        },
      } : match),
    }));
    setHistoryEditMatch(null);
  };

  const handleDeleteHistoryMatch = (matchId) => {
    updateMatchState((currentState) => ({
      ...currentState,
      history: currentState.history.filter((match) => match.id !== matchId),
    }));
  };

  const handleConfirmLineup = (selectedIds, absentReasons = {}) => {
    updateMatchState((currentState) => {
      const allPlayers = [...currentState.roster.local, ...currentState.roster.bench];
      const selectedPlayers = allPlayers
        .filter((player) => selectedIds.includes(player.id))
        .sort((firstPlayer, secondPlayer) => Number(secondPlayer.role === 'POR') - Number(firstPlayer.role === 'POR'));
      const playersOnBench = allPlayers.filter((player) => !selectedIds.includes(player.id));
      const fieldPositions = [
        { x: 10, y: 50 },
        { x: 22, y: 20 },
        { x: 22, y: 35 },
        { x: 22, y: 65 },
        { x: 22, y: 80 },
        { x: 45, y: 22 },
        { x: 45, y: 42 },
        { x: 45, y: 58 },
        { x: 45, y: 78 },
        { x: 68, y: 35 },
        { x: 68, y: 65 },
      ];

      return {
        ...currentState,
        lineupConfirmed: true,
        roster: {
          local: selectedPlayers.map((player, index) => ({
            ...player,
            ...fieldPositions[index],
            injured: false,
          })),
          bench: playersOnBench.map((player) => ({ ...player, x: 0, y: 0, absent: absentReasons[player.id] || null })),
          visitor: cloneVisitorPlayers(selectedPlayers.map((player, index) => ({
            ...player,
            ...fieldPositions[index],
          }))),
          visitorBench: cloneVisitorBenchPlayers(playersOnBench).map((player) => ({ ...player, absent: absentReasons[player.id.replace('visitor-', '')] || null })),
        },
      };
    });
    setLineupSelectionOpen(false);
  };

  const handleGoal = (team) => {
    if (team === 'local') {
      setPlayerActionModal({ type: 'goal', team });
      return;
    }

    const side = team === 'local' ? 'local' : 'visitor';

    updateMatchState((currentState) => ({
      ...currentState,
      scores: {
        ...currentState.scores,
        [side]: currentState.scores[side] + 1,
      },
      events: [
        buildEvent('goal', `${currentState.teams[team]} marca gol`, team),
        ...currentState.events,
      ].slice(0, 25),
      ball: {
        x: 50,
        y: 50,
      },
    }));
  };

  const handleAssist = (team) => {
    if (team === 'local') {
      setPlayerActionModal({ type: 'assist', team });
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('assist', `${currentState.teams[team]} tiene asistencia`, team),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleCard = (team, color) => {
    if (color === 'red') {
      setRedCardModal({ team });
      return;
    }

    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent(color === 'yellow' ? 'yellow' : 'red', `${currentState.teams[team]} recibe tarjeta ${color}`, team),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const performSubstitution = (team, outgoingPlayerId, incomingPlayerId) => {
    updateMatchState((currentState) => {
      const rosterKey = team === 'visitor' ? 'visitor' : 'local';
      const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';
      const fieldPlayers = currentState.roster[rosterKey] || [];
      const benchPlayers = currentState.roster[benchKey] || [];

      const outgoingPlayer = fieldPlayers.find((player) => player.id === outgoingPlayerId);
      const incomingPlayer = benchPlayers.find((player) => player.id === incomingPlayerId);

      if (!outgoingPlayer || !incomingPlayer) {
        return currentState;
      }

      const nextFieldPlayers = fieldPlayers
        .filter((player) => player.id !== outgoingPlayerId)
        .concat({
          ...incomingPlayer,
          x: outgoingPlayer.x,
          y: outgoingPlayer.y,
          injured: false,
        });

      const nextBenchPlayers = benchPlayers
        .filter((player) => player.id !== incomingPlayerId)
        .concat({
          ...outgoingPlayer,
          x: 0,
          y: 0,
          injured: false,
        });

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: nextFieldPlayers,
          [benchKey]: nextBenchPlayers,
        },
        events: [
          buildEvent(
            'substitution',
            `${formatPlayerEventLabel(outgoingPlayer, rosterKey)} sale. Entra ${formatPlayerEventLabel(incomingPlayer, rosterKey)}`,
            getMatchSide(rosterKey, currentState.clubSide),
            [outgoingPlayer, incomingPlayer],
          ),
          ...currentState.events,
        ].slice(0, 25),
      };
    });
  };

  const handleSubstitution = (team, outgoingPlayerId = null) => {
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';
    const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';

    setSubstitutionModal({
      team,
      fieldPlayers: matchState.roster[rosterKey] || [],
      benchPlayers: matchState.roster[benchKey] || [],
      outgoingPlayerId,
      quickVisitor: team === 'visitor' && Boolean(outgoingPlayerId),
    });
  };

  const handleManualScoreChange = (team, value) => {
    const safeValue = Number.isFinite(value) ? Math.max(0, value) : 0;

    updateMatchState((currentState) => ({
      ...currentState,
      scores: {
        ...currentState.scores,
        [team]: safeValue,
      },
    }));
  };

  const handleAddPlayer = (side, player = null) => {
    const newPlayer = player || {
      id: crypto.randomUUID(),
      number: 99,
      name: 'Nueva jugadora',
      role: 'MED',
      injured: false,
      x: 52,
      y: 50,
    };

    updateMatchState((currentState) => {
      const totalPlayers = currentState.roster.local.length + currentState.roster.bench.length;
      if (totalPlayers >= ROSTER_SIZE) {
        return currentState;
      }

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          bench: [...currentState.roster.bench, { ...newPlayer, id: newPlayer.id || crypto.randomUUID() }],
        },
      };
    });
  };

  const handleUpdatePlayer = (side, playerId, updates) => {
    const safeName = typeof updates.name === 'string' ? updates.name.trim() : '';

    updateMatchState((currentState) => {
      const resolvePlayerName = (player) => {
        if (safeName) {
          return safeName;
        }

        if (player?.name?.trim()) {
          return player.name.trim();
        }

        return `Jugadora ${Number(updates.number) || Number(player?.number) || 1}`;
      };

      const normalizedUpdates = {
        ...updates,
        name: safeName || 'Jugadora',
        number: Number(updates.number) || 1,
        role: updates.role || 'MED',
      };

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          local: currentState.roster.local.map((player) =>
            player.id === playerId
              ? { ...player, ...normalizedUpdates, name: resolvePlayerName(player) }
              : player,
          ),
          bench: currentState.roster.bench.map((player) =>
            player.id === playerId
              ? { ...player, ...normalizedUpdates, name: resolvePlayerName(player) }
              : player,
          ),
        },
      };
    });
  };

  const handleMovePlayer = (side, playerId, target) => {
    updateMatchState((currentState) => {
      const playerToMove = [...currentState.roster.local, ...currentState.roster.bench].find(
        (player) => player.id === playerId,
      );

      if (!playerToMove) {
        return currentState;
      }

      const nextLocal = currentState.roster.local.filter((player) => player.id !== playerId);
      const nextBench = currentState.roster.bench.filter((player) => player.id !== playerId);

      if (target === 'starter') {
        return {
          ...currentState,
          roster: {
            local: [...nextLocal, { ...playerToMove, x: 50, y: 50 }],
            bench: nextBench,
          },
        };
      }

      return {
        ...currentState,
        roster: {
          local: nextLocal,
          bench: [...nextBench, { ...playerToMove, x: 0, y: 0 }],
        },
      };
    });
  };

  const handlePlayerMove = (playerId, position, team = 'local') => {
    updateMatchState((currentState) => {
      const teamRoster = currentState.roster[team] || [];

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [team]: teamRoster.map((player) =>
            player.id === playerId ? { ...player, ...position } : player,
          ),
        },
      };
    });
  };

  const handleTacticsBoardMove = (playerId, position, team = 'local') => {
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';

    updateMatchState((currentState) => {
      const teamRoster = currentState.roster[rosterKey] || [];

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: teamRoster.map((player) =>
            player.id === playerId ? { ...player, x: position.x, y: position.y } : player,
          ),
        },
      };
    });
  };

  const handleInjurySubstitution = (substituteId) => {
    if (!injuredPlayerModal) return;

    const { player: injuredPlayer, team = 'local' } = injuredPlayerModal;
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';
    const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';

    updateMatchState((currentState) => {
      const substitute = (currentState.roster[benchKey] || []).find((p) => p.id === substituteId);
      if (!substitute) return currentState;

      const updatedInjured = { ...injuredPlayer, injured: true };
      const nextStarters = (currentState.roster[rosterKey] || []).map((p) =>
        p.id === injuredPlayer.id ? updatedInjured : p,
      );
      const startersWithoutInjured = nextStarters.filter((p) => p.id !== injuredPlayer.id);
      const benchWithInjured = [
        ...(currentState.roster[benchKey] || []).filter((p) => p.id !== injuredPlayer.id),
        updatedInjured,
      ];

      const substituteIntoField = {
        ...substitute,
        x: injuredPlayer.x,
        y: injuredPlayer.y,
        injured: false,
      };
      const benchWithoutSubstitute = benchWithInjured.filter((p) => p.id !== substituteId);

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: [...startersWithoutInjured, substituteIntoField],
          [benchKey]: benchWithoutSubstitute,
        },
        events: [
          ...currentState.events,
          buildEvent(
            'substitution',
            `${formatPlayerEventLabel(injuredPlayer, rosterKey)} sale por lesión. Entra ${formatPlayerEventLabel(substitute, rosterKey)}`,
            getMatchSide(rosterKey, currentState.clubSide),
            [injuredPlayer, substitute],
          ),
        ],
      };
    });

    setInjuredPlayerModal(null);
  };

  const handlePlayerClick = (player, team = 'local') => {
    if (selectingInjured) {
      updateMatchState((currentState) => {
        const rosterKey = team === 'visitor' ? 'visitor' : 'local';
        const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';
        const isBenchPlayer = (currentState.roster[benchKey] || []).some((p) => p.id === player.id);

        return {
          ...currentState,
          roster: {
            ...currentState.roster,
            [isBenchPlayer ? benchKey : rosterKey]: (currentState.roster[isBenchPlayer ? benchKey : rosterKey] || []).map((p) =>
              p.id === player.id ? { ...p, injured: true } : p,
            ),
          },
        };
      });
      setSelectingInjured(false);
      setInjuredPlayerModal({ player: { ...player, injured: true }, team });
    } else {
      setPlayerActionMenu({ player, team });
    }
  };

  const handlePlayerAction = (actionType) => {
    const currentSelection = playerActionMenu;
    if (!currentSelection) return;

    const { player, team } = currentSelection;
    const rosterKey = team === 'visitor' ? 'visitor' : 'local';
    const benchKey = team === 'visitor' ? 'visitorBench' : 'bench';

    if (actionType === 'yellow') {
      handleYellowCardClick(player, team);
      setPlayerActionMenu(null);
      return;
    }

    if (actionType === 'substitution') {
      setSubstitutionModal({
        team,
        fieldPlayers: matchState.roster[rosterKey] || [],
        benchPlayers: matchState.roster[benchKey] || [],
        outgoingPlayerId: player.id,
        quickVisitor: team === 'visitor',
      });
      setPlayerActionMenu(null);
      return;
    }

    if (actionType === 'edit-number') {
      const nextNumber = Number(window.prompt(`Nuevo dorsal para ${player.name}`, player.number));
      if (Number.isFinite(nextNumber) && nextNumber > 0) {
        updateMatchState((currentState) => ({
          ...currentState,
          roster: {
            ...currentState.roster,
            [rosterKey]: (currentState.roster[rosterKey] || []).map((item) =>
              item.id === player.id ? { ...item, number: nextNumber } : item,
            ),
          },
        }));
      }
      setPlayerActionMenu(null);
      return;
    }

    updateMatchState((currentState) => {
      const matchSide = getMatchSide(rosterKey, currentState.clubSide);
      const selectedPlayer = (currentState.roster[rosterKey] || []).find((item) => item.id === player.id);
      if (!selectedPlayer) return currentState;

      if (actionType === 'goal' || actionType === 'assist') {
        const actionLabel = actionType === 'goal' ? 'marca gol' : 'da asistencia';
        const nextState = {
          ...currentState,
          events: [
            buildEvent(actionType, `${formatPlayerEventLabel(selectedPlayer, rosterKey)} ${actionLabel}`, matchSide, [selectedPlayer]),
            ...currentState.events,
          ].slice(0, 25),
        };

        if (actionType === 'goal') {
          nextState.scores = {
            ...currentState.scores,
            [matchSide]: currentState.scores[matchSide] + 1,
          };
          nextState.ball = { x: 50, y: 50 };
        }
        return nextState;
      }

      if (actionType === 'red') {
        if (team === 'local') {
          const expelledPlayer = {
            ...selectedPlayer,
            injured: false,
            redCards: (selectedPlayer.redCards || 0) + 1,
          };
          return {
            ...currentState,
            roster: {
              ...currentState.roster,
              local: currentState.roster.local.filter((item) => item.id !== player.id),
              bench: [...currentState.roster.bench, expelledPlayer],
            },
            events: [
              buildEvent('red', `${formatPlayerEventLabel(selectedPlayer, rosterKey)} recibe tarjeta roja y es expulsada`, matchSide, [selectedPlayer]),
              ...currentState.events,
            ].slice(0, 25),
          };
        }

        return {
          ...currentState,
          roster: {
            ...currentState.roster,
            visitor: (currentState.roster.visitor || []).filter((item) => item.id !== player.id),
            visitorBench: [
              ...(currentState.roster.visitorBench || []),
              { ...selectedPlayer, redCards: (selectedPlayer.redCards || 0) + 1, injured: false, x: 0, y: 0 },
            ],
          },
          events: [
            buildEvent('red', `${formatPlayerEventLabel(selectedPlayer, rosterKey)} recibe tarjeta roja y es expulsada`, matchSide, [selectedPlayer]),
            ...currentState.events,
          ].slice(0, 25),
        };
      }

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          [rosterKey]: (currentState.roster[rosterKey] || []).map((item) =>
            item.id === player.id ? { ...item, injured: true } : item,
          ),
        },
        events: [
          buildEvent('injury', `${formatPlayerEventLabel(selectedPlayer, rosterKey)} se lesiona`, matchSide, [selectedPlayer]),
          ...currentState.events,
        ].slice(0, 25),
      };
    });

    if (actionType === 'injury') {
      setInjuredPlayerModal({ player: { ...player, injured: true }, team });
    }
    setPlayerActionMenu(null);
  };

  const handleInitiateInjury = () => {
    setSelectingInjured(!selectingInjured);
    setInjuredPlayerModal(null);
  };

  const handleYellowCardClick = (player, team = 'local') => {
    updateMatchState((currentState) => {
      const rosterKey = team === 'visitor' ? 'visitor' : 'local';
      const matchSide = getMatchSide(rosterKey, currentState.clubSide);
      const playerIndex = (currentState.roster[rosterKey] || []).findIndex((p) => p.id === player.id);
      let updatedPlayer = null;
      let updatedRoster = { ...currentState.roster };
      let eventLabel = '';
      let eventType = 'yellow';

      if (playerIndex !== -1) {
        updatedPlayer = { ...(currentState.roster[rosterKey] || [])[playerIndex] };
        updatedPlayer.yellowCards = (updatedPlayer.yellowCards || 0) + 1;

        if (updatedPlayer.yellowCards >= 2) {
          updatedPlayer.injured = false;
          updatedPlayer.redCards = (updatedPlayer.redCards || 0) + 1;
          if (team === 'local') {
            const nextLocal = currentState.roster.local.filter((p) => p.id !== player.id);
            updatedRoster = {
              ...currentState.roster,
              local: nextLocal,
              bench: [...currentState.roster.bench, updatedPlayer],
            };
          } else {
            updatedRoster = {
              ...currentState.roster,
              visitor: (currentState.roster.visitor || []).filter((p) => p.id !== player.id),
              visitorBench: [
                ...(currentState.roster.visitorBench || []),
                { ...updatedPlayer, x: 0, y: 0 },
              ],
            };
          }
          eventType = 'red';
          eventLabel = `${formatPlayerEventLabel(updatedPlayer, rosterKey)} recibe segunda tarjeta amarilla y es expulsada`;
        } else {
          const nextRoster = (currentState.roster[rosterKey] || []).map((p) =>
            p.id === player.id ? updatedPlayer : p,
          );
          updatedRoster = {
            ...currentState.roster,
            [rosterKey]: nextRoster,
          };
          eventLabel = `${formatPlayerEventLabel(updatedPlayer, rosterKey)} recibe tarjeta amarilla`;
        }
      } else {
        const benchIndex = currentState.roster.bench.findIndex((p) => p.id === player.id);
        if (benchIndex !== -1) {
          updatedPlayer = { ...currentState.roster.bench[benchIndex] };
          updatedPlayer.yellowCards = (updatedPlayer.yellowCards || 0) + 1;

          const nextBench = currentState.roster.bench.map((p) =>
            p.id === player.id ? updatedPlayer : p,
          );
          updatedRoster = {
            ...currentState.roster,
            bench: nextBench,
          };
          eventLabel = `${formatPlayerEventLabel(updatedPlayer, 'local')} recibe tarjeta amarilla`;
        }
      }

      return {
        ...currentState,
        roster: updatedRoster,
        events: [buildEvent(eventType, eventLabel, matchSide, updatedPlayer ? [updatedPlayer] : []), ...currentState.events].slice(0, 25),
      };
    });

    setYellowCardModal(false);
  };

  const handleRedCardClick = (player) => {
    if (!redCardModal) return;

    updateMatchState((currentState) => {
      const playerToExpel = currentState.roster.local.find((p) => p.id === player.id);
      if (!playerToExpel) return currentState;

      const expelledPlayer = {
        ...playerToExpel,
        injured: false,
        redCards: (playerToExpel.redCards || 0) + 1,
      };

      return {
        ...currentState,
        roster: {
          ...currentState.roster,
          local: currentState.roster.local.filter((p) => p.id !== player.id),
          bench: [...currentState.roster.bench, expelledPlayer],
        },
        events: [
          buildEvent(
            'red',
            `${playerToExpel.name} recibe tarjeta roja y es expulsada`,
            redCardModal.team,
          ),
          ...currentState.events,
        ].slice(0, 25),
      };
    });

    setRedCardModal(null);
  };

  const handlePlayerActionClick = (player) => {
    if (!playerActionModal) return;

    updateMatchState((currentState) => {
      const selectedPlayer = currentState.roster.local.find((p) => p.id === player.id);
      if (!selectedPlayer) return currentState;

      const actionLabel = playerActionModal.type === 'goal' ? 'marca gol' : 'da asistencia';
      const matchSide = getMatchSide('local', currentState.clubSide);
      const nextState = {
        ...currentState,
        events: [
          buildEvent(
            playerActionModal.type,
            `${selectedPlayer.name} (#${selectedPlayer.number}) ${actionLabel}`,
            matchSide,
            [selectedPlayer],
          ),
          ...currentState.events,
        ].slice(0, 25),
      };

      if (playerActionModal.type === 'goal') {
        nextState.scores = {
          ...currentState.scores,
          [matchSide]: currentState.scores[matchSide] + 1,
        };
        nextState.ball = { x: 50, y: 50 };
      }

      return nextState;
    });

    setPlayerActionModal(null);
  };

  const handleInitiateYellowCard = () => {
    setYellowCardModal(true);
  };

  const handleRemoveVisitorTeam = () => {
    updateMatchState((currentState) => ({
      ...currentState,
      roster: {
        ...currentState.roster,
        visitor: [],
        visitorBench: [],
      },
    }));
  };

  const handlePlaceVisitorTeam = () => {
    updateMatchState((currentState) => ({
      ...currentState,
      roster: {
        ...currentState.roster,
        visitor: cloneVisitorPlayers((currentState.roster.local || []).map((player) => ({
          ...player,
          x: Number(player.x) || 50,
          y: Number(player.y) || 50,
        }))),
        visitorBench: cloneVisitorBenchPlayers(currentState.roster.bench || []),
      },
    }));
  };

  return (
    <main className="app-shell">
      <div className="app-frame">
        <nav className="app-navigation" aria-label="Secciones principales">
          <div className="app-navigation-brand">Partido directo</div>
          <button type="button" className={`app-navigation-item ${activeSection === 'live' ? 'active' : ''}`} onClick={() => setActiveSection('live')}><span aria-hidden="true">●</span>En directo</button>
          <button type="button" className={`app-navigation-item ${activeSection === 'team' ? 'active' : ''}`} onClick={() => setActiveSection('team')}><span aria-hidden="true">♙</span>Mi equipo</button>
          <button type="button" className={`app-navigation-item ${activeSection === 'tactics' ? 'active' : ''}`} onClick={() => setActiveSection('tactics')}><span aria-hidden="true">⌘</span>Pizarra táctica</button>
          <button type="button" className={`app-navigation-item ${activeSection === 'calendar' ? 'active' : ''}`} onClick={() => setActiveSection('calendar')}><span aria-hidden="true">□</span>Calendario</button>
          <button type="button" className={`app-navigation-item ${activeSection === 'history' ? 'active' : ''}`} onClick={() => setActiveSection('history')}><span aria-hidden="true">≡</span>Historial</button>
        </nav>

        <div className="app-workspace">
          {activeSection === 'live' && (
            <section className="live-view" aria-label="Partido en directo">
              <MatchHeader
                teams={matchState.teams}
                scores={matchState.scores}
                elapsedSeconds={matchState.elapsedSeconds}
                clubSide={matchState.clubSide}
                clubCrest={matchState.clubCrest}
                showTeams={Boolean(activeCalendarMatchId)}
              />

              <div className="status-bar">
                <span>{summary.status}</span>
                <span>{summary.totalGoals} goles</span>
              </div>

              <div className="pitch-section">
                <PitchField
                  teams={matchState.teams}
                  clubSide={matchState.clubSide}
                  roster={matchState.roster}
                  ball={matchState.ball}
                  onPlayerClick={handlePlayerClick}
                  onPlayerMove={handlePlayerMove}
                  selectingInjured={selectingInjured}
                  showPlayerNames={Boolean(activeCalendarMatchId)}
                />
              </div>

              <div className="content-grid">
                <ControlPanel
                  isRunning={matchState.isRunning}
                  localScore={matchState.scores.local}
                  visitorScore={matchState.scores.visitor}
                  onToggleRunning={handleToggleRunning}
                  onReset={handleReset}
                  onGoal={handleGoal}
                  onAssist={handleAssist}
                  onCard={handleCard}
                  onToggleRoster={() => setActiveSection('team')}
                  onOpenCalendar={() => setActiveSection('calendar')}
                  onFinalize={handleFinalize}
                  onOpenHistory={() => setActiveSection('history')}
                  onOpenTacticsBoard={() => setActiveSection('tactics')}
                  onSubstitution={handleSubstitution}
                  onManualScoreChange={handleManualScoreChange}
                  selectingInjured={selectingInjured}
                  onInitiateInjury={handleInitiateInjury}
                  onInitiateYellowCard={handleInitiateYellowCard}
                  onPlaceVisitorTeam={handlePlaceVisitorTeam}
                  onRemoveVisitorTeam={handleRemoveVisitorTeam}
                />

                <MatchEvents
                  events={matchState.events}
                  onStartNewMatch={() => {
                    setActiveSection('calendar');
                    setStartMatchOpen(false);
                  }}
                />
              </div>
            </section>
          )}

          {activeSection === 'team' && (
            <section className="team-view" aria-label="Mi equipo">
              <header className="section-heading">
                <div>
                  <h1>Mi equipo</h1>
                  <p>Gestiona la identidad del club, la temporada y la plantilla.</p>
                </div>
              </header>
              <section className="team-details-panel" aria-label="Datos del club">
                <label className="club-name-field team-club-name-field">
                  Nombre del club
                  <input value={matchState.teams[matchState.clubSide]} onChange={(event) => handleTeamNameChange(matchState.clubSide, event.target.value)} />
                </label>
                <label className="club-name-field season-name-field">
                  Temporada actual
                  <input value={teamSeasonDraft || matchState.currentSeason} onChange={(event) => setTeamSeasonDraft(event.target.value)} placeholder="2026-2027" />
                  <button type="button" onClick={handleCreateSeason}>Crear temporada</button>
                </label>
              </section>
              <section className="club-crest-manager" aria-label="Escudo del club">
                <img className="club-crest-preview" src={matchState.clubCrest} alt={`Escudo de ${matchState.teams[matchState.clubSide]}`} />
                <div className="club-crest-controls">
                  <strong>Escudo del club</strong>
                  <label className="crest-upload-button">
                    Subir imagen
                    <input type="file" accept="image/*" onChange={handleClubCrestUpload} />
                  </label>
                  <label className="crest-url-field">
                    URL de imagen
                    <input value={matchState.clubCrest.startsWith('data:') ? '' : matchState.clubCrest} onChange={(event) => handleClubCrestChange(event.target.value)} placeholder="https://..." />
                  </label>
                </div>
              </section>
              <RosterPanel
                teams={matchState.teams}
                roster={matchState.roster}
                onAddPlayer={handleAddPlayer}
                onUpdatePlayer={handleUpdatePlayer}
                onMovePlayer={handleMovePlayer}
                onSelectLineup={() => setLineupSelectionOpen(true)}
                lineupConfirmed={matchState.lineupConfirmed}
                managementOnly={true}
              />
            </section>
          )}

          {activeSection === 'history' && (
            <HistoryDashboard matches={matchState.history} onEditMatch={handleEditHistoryMatch} onDeleteMatch={handleDeleteHistoryMatch} />
          )}
        </div>
      </div>

      {(tacticsBoardOpen || activeSection === 'tactics') && (
        <TacticsBoardModal
          roster={matchState.roster}
          onClose={() => {
            setTacticsBoardOpen(false);
            setActiveSection('live');
          }}
          onMovePlayer={handleTacticsBoardMove}
        />
      )}

      {substitutionModal && (
        <SubstitutionModal
          fieldPlayers={substitutionModal.fieldPlayers}
          benchPlayers={substitutionModal.benchPlayers}
          isVisitor={substitutionModal.team === 'visitor'}
          outgoingPlayerId={substitutionModal.outgoingPlayerId || null}
          onSubstitute={(outgoingPlayerId, incomingPlayerId) => {
            performSubstitution(substitutionModal.team, outgoingPlayerId, incomingPlayerId);
            setSubstitutionModal(null);
          }}
          onCancel={() => setSubstitutionModal(null)}
        />
      )}

      {injuredPlayerModal && (
        <SubstitutionModal
          injuredPlayer={injuredPlayerModal.player}
          isVisitor={injuredPlayerModal.team === 'visitor'}
          benchPlayers={injuredPlayerModal.team === 'visitor'
            ? (matchState.roster.visitorBench || [])
            : matchState.roster.bench}
          onSubstitute={handleInjurySubstitution}
          onCancel={() => setInjuredPlayerModal(null)}
        />
      )}

      {yellowCardModal && (
        <YellowCardModal
          allPlayers={[...matchState.roster.local, ...matchState.roster.bench]}
          onSelectPlayer={handleYellowCardClick}
          onCancel={() => setYellowCardModal(false)}
        />
      )}

      {playerActionMenu && (
        <PlayerActionMenuModal
          player={playerActionMenu.player}
          team={playerActionMenu.team}
          onSelectAction={handlePlayerAction}
          onCancel={() => setPlayerActionMenu(null)}
        />
      )}

      {redCardModal && (
        <RedCardModal
          fieldPlayers={matchState.roster.local}
          onSelectPlayer={handleRedCardClick}
          onCancel={() => setRedCardModal(null)}
        />
      )}

      {playerActionModal && (
        <PlayerActionModal
          actionType={playerActionModal.type}
          fieldPlayers={matchState.roster.local}
          onSelectPlayer={handlePlayerActionClick}
          onCancel={() => setPlayerActionModal(null)}
        />
      )}

      {lineupSelectionOpen && (
        <LineupModal
          players={[...matchState.roster.local, ...matchState.roster.bench].sort(
            (firstPlayer, secondPlayer) => firstPlayer.number - secondPlayer.number,
          )}
          initialSelectedIds={matchState.roster.local.map((player) => player.id)}
          onConfirm={handleConfirmLineup}
          onCancel={() => setLineupSelectionOpen(false)}
          canCancel={true}
        />
      )}

      {startMatchOpen && (
        <StartMatchModal
          matches={matchState.calendar}
          isFreshStart={startMatchMode === 'fresh'}
          onSelectCalendarMatch={handleSelectCalendarMatch}
          onCreateInstant={handleCreateInstantMatch}
          onClose={() => {
            setStartMatchOpen(false);
            setStartMatchMode('default');
          }}
        />
      )}

      {(calendarOpen || activeSection === 'calendar') && (
        <CalendarModal
          matches={matchState.calendar}
          previousSeasons={matchState.previousSeasons}
          onAddMatch={handleAddCalendarMatch}
          onUpdateMatch={handleUpdateCalendarMatch}
          onSelectMatch={handleSelectCalendarMatch}
          onDeleteMatch={handleDeleteCalendarMatch}
          onClose={() => {
            setCalendarOpen(false);
            setActiveSection('live');
          }}
        />
      )}

      {historyOpen && (
        <HistoryModal
          matches={matchState.history}
          onEdit={handleEditHistoryMatch}
          onDelete={handleDeleteHistoryMatch}
          onShare={() => {}}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {historyEditMatch && (
        <HistoryEditModal
          match={historyEditMatch}
          onSave={handleSaveHistoryActions}
          onClose={() => setHistoryEditMatch(null)}
        />
      )}

      {finalizeConfirmOpen && (
        <div className="modal-overlay" role="alertdialog" aria-modal="true">
          <div className="modal-content finalize-confirm-modal">
            <h2>¿Ha finalizado el partido?</h2>
            <p className="modal-label">
              Al aceptar se guardará en el historial, se quitará del calendario y se limpiará el campo.
            </p>
            <div className="finalize-confirm-actions">
              <button type="button" className="primary-button" onClick={confirmFinalize}>
                Sí, finalizar
              </button>
              <button type="button" className="cancel-btn" onClick={() => setFinalizeConfirmOpen(false)}>
                No, continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default App;
