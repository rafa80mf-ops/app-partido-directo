import { useEffect, useMemo, useRef, useState } from 'react';
import { FORMATION_POSITIONS } from './PitchField';

const DEFAULT_POSITIONS = [
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

const SEVEN_A_SIDE_POSITIONS = [
  { x: 10, y: 50 },
  { x: 28, y: 25 },
  { x: 28, y: 50 },
  { x: 28, y: 75 },
  { x: 55, y: 25 },
  { x: 55, y: 50 },
  { x: 55, y: 75 },
];

function sortSquadPlayers(firstPlayer, secondPlayer) {
  const firstHasName = Boolean(firstPlayer.name?.trim()) && !/^Suplente\s+\d+$/i.test(firstPlayer.name.trim());
  const secondHasName = Boolean(secondPlayer.name?.trim()) && !/^Suplente\s+\d+$/i.test(secondPlayer.name.trim());

  if (firstHasName !== secondHasName) {
    return firstHasName ? -1 : 1;
  }

  return firstPlayer.number - secondPlayer.number;
}

function prioritizeGoalkeeper(players) {
  return [...players].sort((firstPlayer, secondPlayer) => Number(secondPlayer.role === 'POR') - Number(firstPlayer.role === 'POR'));
}

export default function TacticsBoardModal({
  roster,
  onClose,
  onMovePlayer,
  onApplyFormation,
  teamAppearance,
}) {
  const dragRef = useRef(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [tacticalPlayerIds, setTacticalPlayerIds] = useState([]);
  const [tacticalPositions, setTacticalPositions] = useState({});
  const [visitorTacticalPlayerIds, setVisitorTacticalPlayerIds] = useState([]);
  const [visitorTacticalPositions, setVisitorTacticalPositions] = useState({});
  const [formationOpen, setFormationOpen] = useState(false);

  const squadPlayers = useMemo(() => {
    const players = [...(roster?.local || []), ...(roster?.bench || [])];
    return players
      .filter((player, index) => players.findIndex((candidate) => candidate.id === player.id) === index)
      .sort(sortSquadPlayers);
  }, [roster]);

  const visitorSquadPlayers = useMemo(() => {
    const configuredPlayers = [...(roster?.visitor || []), ...(roster?.visitorBench || [])];
    const players = configuredPlayers.length > 0
      ? configuredPlayers
      : squadPlayers.map((player) => ({
          ...player,
          id: `tactics-visitor-${player.id}`,
          name: '',
          x: 0,
          y: 0,
        }));
    return players
      .filter((player, index) => players.findIndex((candidate) => candidate.id === player.id) === index)
      .sort(sortSquadPlayers);
  }, [roster, squadPlayers]);

  useEffect(() => {
    setTacticalPlayerIds((currentIds) => {
      const availableIds = new Set(squadPlayers.map((player) => player.id));
      const remainingIds = currentIds.filter((id) => availableIds.has(id));

      return remainingIds.length > 0
        ? remainingIds.slice(0, 11)
        : (roster?.local || []).slice(0, 11).map((player) => player.id);
    });
  }, [roster, squadPlayers]);

  useEffect(() => {
    setVisitorTacticalPlayerIds((currentIds) => {
      const availableIds = new Set(visitorSquadPlayers.map((player) => player.id));
      const remainingIds = currentIds.filter((id) => availableIds.has(id));

      return remainingIds.length > 0
        ? remainingIds.slice(0, 11)
        : (roster?.visitor || []).slice(0, 11).map((player) => player.id);
    });
  }, [roster, visitorSquadPlayers]);

  const boardPlayers = useMemo(() => {
    const getDefaultPosition = (index, playerCount) => (
      (playerCount <= 7 ? SEVEN_A_SIDE_POSITIONS : DEFAULT_POSITIONS)[index] || { x: 50, y: 50 }
    );
    const localPlayers = prioritizeGoalkeeper(tacticalPlayerIds
      .map((id) => squadPlayers.find((candidate) => candidate.id === id))
      .filter(Boolean)).map((player, index) => {

      return {
        ...player,
        ...(tacticalPositions[player.id] || getDefaultPosition(index, tacticalPlayerIds.length)),
        side: 'local',
      };
    });
    const visitorPlayers = prioritizeGoalkeeper(visitorTacticalPlayerIds
      .map((id) => visitorSquadPlayers.find((candidate) => candidate.id === id))
      .filter(Boolean)).map((player, index) => {

      const defaultPosition = getDefaultPosition(index, visitorTacticalPlayerIds.length);
      return {
        ...player,
        ...(visitorTacticalPositions[player.id] || { x: 100 - defaultPosition.x, y: defaultPosition.y }),
        side: 'visitor',
      };
    });
    return [...localPlayers, ...visitorPlayers];
  }, [squadPlayers, tacticalPlayerIds, tacticalPositions, visitorSquadPlayers, visitorTacticalPlayerIds, visitorTacticalPositions]);

  const selectedPlayer = boardPlayers.find((player) => player.id === selectedPlayerId) || null;

  const getBoardPosition = (event, board) => {
    const rect = board.getBoundingClientRect();

    return {
      x: Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(4, Math.min(96, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const handlePointerDown = (event, player) => {
    if (!player) return;

    const board = event.currentTarget.closest('.tactics-board-surface');
    if (!board) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { player, board };
    setSelectedPlayerId(player.id);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;

    const { player, board } = dragRef.current;
    const position = getBoardPosition(event, board);

    const setPositions = player.side === 'visitor' ? setVisitorTacticalPositions : setTacticalPositions;
    setPositions((current) => ({ ...current, [player.id]: position }));
  };

  const handlePointerUp = (event) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const toggleTacticalPlayer = (player) => {
    const isSelected = tacticalPlayerIds.includes(player.id);

    if (!isSelected && tacticalPlayerIds.length >= 11) return;

    setTacticalPlayerIds((currentIds) => (
      isSelected
        ? currentIds.filter((id) => id !== player.id)
        : player.role === 'POR' ? [player.id, ...currentIds] : [...currentIds, player.id]
    ));
  };

  const toggleVisitorTacticalPlayer = (player) => {
    const isSelected = visitorTacticalPlayerIds.includes(player.id);
    if (!isSelected && visitorTacticalPlayerIds.length >= 11) return;

    setVisitorTacticalPlayerIds((currentIds) => (
      isSelected
        ? currentIds.filter((id) => id !== player.id)
        : player.role === 'POR' ? [player.id, ...currentIds] : [...currentIds, player.id]
    ));
  };

  const applyFormation = (side, formation) => {
    const players = side === 'visitor' ? visitorSquadPlayers : squadPlayers;
    const setIds = side === 'visitor' ? setVisitorTacticalPlayerIds : setTacticalPlayerIds;
    const setPositions = side === 'visitor' ? setVisitorTacticalPositions : setTacticalPositions;
    const formationPositions = FORMATION_POSITIONS[formation];
    if (!formationPositions) return;
    const goalkeeper = players.find((player) => player.role === 'POR');
    const selectedPlayers = goalkeeper
      ? [goalkeeper, ...players.filter((player) => player.id !== goalkeeper.id)].slice(0, formationPositions.length)
      : players.slice(0, formationPositions.length);

    setIds(selectedPlayers.map((player) => player.id));
    setPositions(Object.fromEntries(selectedPlayers.map((player, index) => [
      player.id,
      side === 'visitor'
        ? { x: 100 - formationPositions[index].x, y: formationPositions[index].y }
        : formationPositions[index],
    ])));
      onApplyFormation?.(formation, side);
  };

    const applyPlayerCount = (side, playerCount) => {
      const players = side === 'visitor' ? visitorSquadPlayers : squadPlayers;
      const setIds = side === 'visitor' ? setVisitorTacticalPlayerIds : setTacticalPlayerIds;
      const setPositions = side === 'visitor' ? setVisitorTacticalPositions : setTacticalPositions;
      const goalkeeper = players.find((player) => player.role === 'POR');
      const selectedPlayers = goalkeeper
        ? [goalkeeper, ...players.filter((player) => player.id !== goalkeeper.id)].slice(0, playerCount)
        : players.slice(0, playerCount);

      setIds(selectedPlayers.map((player) => player.id));
      setPositions({});
    };

  return (
    <div className="modal-overlay tactics-board-overlay" onClick={onClose}>
      <div className="modal-content tactics-board-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading-row">
          <h2>Pizarra táctica</h2>
          <button type="button" className="icon-close-button" onClick={onClose} aria-label="Cerrar pizarra">×</button>
        </div>

        <div className="tactics-board-layout">
          <div className="tactics-board-surface pitch-canvas" aria-label="Tablero táctico">
            <div className="area-large-left" />
            <div className="area-small-left" />
            <div className="area-large-right" />
            <div className="area-small-right" />
            <div className="goal-left" />
            <div className="goal-right" />
            <div className="penalty-spot-left" />
            <div className="penalty-spot-right" />
            <div className="corner-mark corner-top-left" />
            <div className="corner-mark corner-bottom-left" />
            <div className="corner-mark corner-top-right" />
            <div className="corner-mark corner-bottom-right" />
            <div className="corner-flag flag-top-left" aria-hidden="true" />
            <div className="corner-flag flag-bottom-left" aria-hidden="true" />
            <div className="corner-flag flag-top-right" aria-hidden="true" />
            <div className="corner-flag flag-bottom-right" aria-hidden="true" />
            {boardPlayers.map((player) => (
              <button
                key={`${player.side}-${player.id}`}
                type="button"
                className={`tactics-player ${selectedPlayerId === player.id ? 'selected' : ''} ${player.side === 'visitor' ? 'visitor' : `appearance-${teamAppearance?.shape || 'ball'}`} ${player.role === 'POR' ? 'goalkeeper' : ''}`}
                style={player.side === 'local' ? { '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' } : undefined}
                onClick={() => setSelectedPlayerId(player.id)}
                onPointerDown={(event) => handlePointerDown(event, player)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  left: `${player.x ?? 50}%`,
                  top: `${player.y ?? 50}%`,
                }}
                title={player.side === 'visitor' ? `Dorsal ${player.number}` : `${player.name} #${player.number}`}
              >
                <span className="tactics-player-number">{player.number}</span>
                {player.side === 'local' && <span className="tactics-player-name">{player.name}</span>}
              </button>
            ))}
          </div>

          <div className="tactics-squads" aria-label="Plantillas tácticas">
            <aside className="tactics-squad-picker" aria-label="Once táctico local">
              <span className="tactics-squad-count">Mi once: {tacticalPlayerIds.length}/11</span>
              <div className="tactics-squad-list">
              {squadPlayers.map((player) => {
                const isSelected = tacticalPlayerIds.includes(player.id);
                const isUnavailable = !isSelected && tacticalPlayerIds.length >= 11;

                return (
                  <button
                    key={player.id}
                    type="button"
                    className={`tactics-squad-player ${isSelected ? 'selected' : ''} ${player.role === 'POR' ? 'goalkeeper' : ''}`}
                    style={{ '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' }}
                    onClick={() => toggleTacticalPlayer(player)}
                    aria-pressed={isSelected}
                    disabled={isUnavailable}
                    title={`${player.name} #${player.number}`}
                  >
                    <strong>{player.number}</strong>
                    <span>{player.name}</span>
                  </button>
                );
              })}
              </div>
              <div className="tactics-formation-actions">
                <button type="button" onClick={() => applyPlayerCount('local', 7)}>F7</button>
                <button type="button" onClick={() => applyPlayerCount('local', 11)}>F11</button>
                <button type="button" onClick={() => setFormationOpen((isOpen) => !isOpen)} aria-expanded={formationOpen}>
                  Formación {formationOpen ? '▴' : '▾'}
                </button>
                {formationOpen && Object.keys(FORMATION_POSITIONS).map((formation) => (
                  <button type="button" key={formation} onClick={() => applyFormation('local', formation)}>{formation}</button>
                ))}
              </div>
            </aside>
            <aside className="tactics-squad-picker visitor-picker" aria-label="Once táctico visitante">
              <span className="tactics-squad-count">Visitante: {visitorTacticalPlayerIds.length}/11</span>
              <div className="tactics-squad-list">
                {visitorSquadPlayers.map((player) => {
                  const isSelected = visitorTacticalPlayerIds.includes(player.id);
                  const isUnavailable = !isSelected && visitorTacticalPlayerIds.length >= 11;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      className={`tactics-squad-player visitor ${isSelected ? 'selected' : ''} ${player.role === 'POR' ? 'goalkeeper' : ''}`}
                      onClick={() => toggleVisitorTacticalPlayer(player)}
                      aria-pressed={isSelected}
                      disabled={isUnavailable}
                      title={`Dorsal ${player.number}`}
                    >
                      <strong>{player.number}</strong>
                    </button>
                  );
                })}
              </div>
              <div className="tactics-formation-actions">
                <button type="button" onClick={() => applyPlayerCount('visitor', 7)}>F7</button>
                <button type="button" onClick={() => applyPlayerCount('visitor', 11)}>F11</button>
                <button type="button" onClick={() => setFormationOpen((isOpen) => !isOpen)} aria-expanded={formationOpen}>
                  Formación {formationOpen ? '▴' : '▾'}
                </button>
                {formationOpen && Object.keys(FORMATION_POSITIONS).map((formation) => (
                  <button type="button" key={formation} onClick={() => applyFormation('visitor', formation)}>{formation}</button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
