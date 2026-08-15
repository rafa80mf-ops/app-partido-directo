import { useEffect, useMemo, useState } from 'react';
import './App.css';
import MatchHeader from './components/MatchHeader';
import ControlPanel from './components/ControlPanel';
import MatchEvents from './components/MatchEvents';
import PitchField from './components/PitchField';
import RosterPanel from './components/RosterPanel';
import SubstitutionModal from './components/SubstitutionModal';
import YellowCardModal from './components/YellowCardModal';
import { createEmptyMatchState, loadMatchState, saveMatchState } from './data/storage';
import { loadMatchSnapshot, saveMatchSnapshot } from './data/localDb';

function buildEvent(type, label, team = 'neutral') {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    team,
    createdAt: new Date().toISOString(),
  };
}

function App() {
  const [matchState, setMatchState] = useState(() => loadMatchState());
  const [injuredPlayerModal, setInjuredPlayerModal] = useState(null);
  const [selectingInjured, setSelectingInjured] = useState(false);
  const [yellowCardModal, setYellowCardModal] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadMatchSnapshot()
      .then((savedSnapshot) => {
        if (!isMounted || !savedSnapshot) {
          return;
        }

        setMatchState((currentState) => ({
          ...currentState,
          ...savedSnapshot,
          teams: {
            ...currentState.teams,
            ...(savedSnapshot.teams || {}),
          },
          scores: {
            ...currentState.scores,
            ...(savedSnapshot.scores || {}),
          },
          roster: savedSnapshot.roster || currentState.roster,
          ball: savedSnapshot.ball || currentState.ball,
          events: Array.isArray(savedSnapshot.events) ? savedSnapshot.events : currentState.events,
        }));
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

    const timer = window.setInterval(() => {
      setMatchState((currentState) => ({
        ...currentState,
        elapsedSeconds: currentState.elapsedSeconds + 1,
        updatedAt: new Date().toISOString(),
      }));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [matchState.isRunning]);

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
        [team]: value.trim() || (team === 'local' ? 'LOCAL' : 'VISITANTE'),
      },
    }));
  };

  const handleToggleRunning = () => {
    updateMatchState((currentState) => ({
      ...currentState,
      isRunning: !currentState.isRunning,
      events: [
        buildEvent('info', currentState.isRunning ? 'Partido pausado' : 'Partido reanudado'),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleReset = () => {
    const resetState = createEmptyMatchState();
    resetState.teams = { ...matchState.teams };
    setMatchState(resetState);
    setMatchState((currentState) => ({
      ...currentState,
      events: [buildEvent('reset', 'Marcador reiniciado'), ...currentState.events].slice(0, 25),
    }));
  };

  const handleGoal = (team) => {
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
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('assist', `${currentState.teams[team]} tiene asistencia`, team),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleCard = (team, color) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent(color === 'yellow' ? 'yellow' : 'red', `${currentState.teams[team]} recibe tarjeta ${color}`, team),
        ...currentState.events,
      ].slice(0, 25),
    }));
  };

  const handleSubstitution = (team) => {
    updateMatchState((currentState) => ({
      ...currentState,
      events: [
        buildEvent('substitution', `${currentState.teams[team]} hace cambio`, team),
        ...currentState.events,
      ].slice(0, 25),
    }));
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

    updateMatchState((currentState) => ({
      ...currentState,
      roster: {
        ...currentState.roster,
        bench: [...currentState.roster.bench, { ...newPlayer, id: newPlayer.id || crypto.randomUUID() }],
      },
    }));
  };

  const handleUpdatePlayer = (side, playerId, updates) => {
    updateMatchState((currentState) => ({
      ...currentState,
      roster: {
        ...currentState.roster,
        local: currentState.roster.local.map((player) =>
          player.id === playerId ? { ...player, ...updates } : player,
        ),
        bench: currentState.roster.bench.map((player) =>
          player.id === playerId ? { ...player, ...updates } : player,
        ),
      },
    }));
  };

  const handleToggleInjured = (side, playerId) => {
    updateMatchState((currentState) => ({
      ...currentState,
      roster: {
        ...currentState.roster,
        local: currentState.roster.local.map((player) =>
          player.id === playerId ? { ...player, injured: !player.injured } : player,
        ),
        bench: currentState.roster.bench.map((player) =>
          player.id === playerId ? { ...player, injured: !player.injured } : player,
        ),
      },
    }));
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

  const handleInjurySubstitution = (substituteId) => {
    if (!injuredPlayerModal) return;

    const { player: injuredPlayer } = injuredPlayerModal;

    updateMatchState((currentState) => {
      // Encontrar la suplente que entra
      const substitute = currentState.roster.bench.find((p) => p.id === substituteId);
      if (!substitute) return currentState;

      // Sacar a la lesionada del campo y ponerla en banquillo
      const updatedInjured = { ...injuredPlayer, injured: true };
      const nextLocal = currentState.roster.local.map((p) =>
        p.id === injuredPlayer.id ? updatedInjured : p,
      );
      const injuredOutOfField = nextLocal.filter((p) => p.id !== injuredPlayer.id);
      const benchWithInjured = [
        ...currentState.roster.bench.filter((p) => p.id !== injuredPlayer.id),
        updatedInjured,
      ];

      // Traer la suplente al campo en la misma posición
      const substituteIntoField = {
        ...substitute,
        x: injuredPlayer.x,
        y: injuredPlayer.y,
        injured: false,
      };
      const benchWithoutSubstitute = benchWithInjured.filter((p) => p.id !== substituteId);
      const localWithSubstitute = [...injuredOutOfField, substituteIntoField];

      return {
        ...currentState,
        roster: {
          local: localWithSubstitute,
          bench: benchWithoutSubstitute,
        },
        events: [
          ...currentState.events,
          buildEvent(
            'substitution',
            `${injuredPlayer.name} sale por lesión. Entra ${substitute.name}`,
            'neutral',
          ),
        ],
      };
    });

    setInjuredPlayerModal(null);
  };

  const handlePlayerClick = (player) => {
    if (selectingInjured) {
      // Modo selección: marcar esta jugadora como lesionada
      updateMatchState((currentState) => ({
        ...currentState,
        roster: {
          ...currentState.roster,
          local: currentState.roster.local.map((p) =>
            p.id === player.id ? { ...p, injured: true } : p,
          ),
        },
      }));
      setSelectingInjured(false);
      setInjuredPlayerModal({ player: { ...player, injured: true } });
    } else if (player.injured) {
      // Lesionada ya marcada: abrir modal de suplentes
      setInjuredPlayerModal({ player });
    }
  };

  const handleInitiateInjury = () => {
    setSelectingInjured(!selectingInjured);
    setInjuredPlayerModal(null);
  };

  const handleYellowCardClick = (player) => {
    updateMatchState((currentState) => {
      // Buscar jugadora en local
      const playerIndex = currentState.roster.local.findIndex((p) => p.id === player.id);
      let updatedPlayer = null;
      let updatedRoster = { ...currentState.roster };
      let eventLabel = '';

      if (playerIndex !== -1) {
        // En campo
        updatedPlayer = { ...currentState.roster.local[playerIndex] };
        updatedPlayer.yellowCards = (updatedPlayer.yellowCards || 0) + 1;

        // Si es segunda amarilla, expulsa
        if (updatedPlayer.yellowCards >= 2) {
          updatedPlayer.injured = true;
          const nextLocal = currentState.roster.local.filter((p) => p.id !== player.id);
          updatedRoster = {
            ...currentState.roster,
            local: nextLocal,
            bench: [...currentState.roster.bench, updatedPlayer],
          };
          eventLabel = `${updatedPlayer.name} recibe segunda tarjeta amarilla y es expulsado`;
        } else {
          // Primera amarilla
          const nextLocal = currentState.roster.local.map((p) =>
            p.id === player.id ? updatedPlayer : p,
          );
          updatedRoster = {
            ...currentState.roster,
            local: nextLocal,
          };
          eventLabel = `${updatedPlayer.name} recibe tarjeta amarilla`;
        }
      } else {
        // En banquillo
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
          eventLabel = `${updatedPlayer.name} recibe tarjeta amarilla`;
        }
      }

      return {
        ...currentState,
        roster: updatedRoster,
        events: [...currentState.events, buildEvent('yellow_card', eventLabel, 'neutral')],
      };
    });

    setYellowCardModal(false);
  };

  const handleInitiateYellowCard = () => {
    setYellowCardModal(true);
  };

  return (
    <main className="app-shell">
      <MatchHeader
        teams={matchState.teams}
        scores={matchState.scores}
        elapsedSeconds={matchState.elapsedSeconds}
        onTeamNameChange={handleTeamNameChange}
      />

      <div className="status-bar">
        <span>{summary.status}</span>
        <span>{summary.totalGoals} goles</span>
      </div>

      <div className="pitch-section">
        <PitchField
          teams={matchState.teams}
          roster={matchState.roster}
          ball={matchState.ball}
          onPlayerClick={handlePlayerClick}
          selectingInjured={selectingInjured}
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
          onSubstitution={handleSubstitution}
          onManualScoreChange={handleManualScoreChange}
          selectingInjured={selectingInjured}
          onInitiateInjury={handleInitiateInjury}
          onInitiateYellowCard={handleInitiateYellowCard}
        />

        <MatchEvents events={matchState.events} />
      </div>

      <div className="roster-section">
        <RosterPanel
          teams={matchState.teams}
          roster={matchState.roster}
          onAddPlayer={handleAddPlayer}
          onUpdatePlayer={handleUpdatePlayer}
          onToggleInjured={handleToggleInjured}
          onMovePlayer={handleMovePlayer}
        />
      </div>

      {injuredPlayerModal && (
        <SubstitutionModal
          injuredPlayer={injuredPlayerModal.player}
          benchPlayers={matchState.roster.bench}
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
    </main>
  );
}

export default App;
