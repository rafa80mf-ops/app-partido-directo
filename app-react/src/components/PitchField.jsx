import { useRef, useState } from 'react';
import FootballBall from './FootballBall';

export const FORMATION_POSITIONS = {
  '4-4-2': [
    { x: 10, y: 50 }, { x: 23, y: 20 }, { x: 23, y: 40 }, { x: 23, y: 60 }, { x: 23, y: 80 },
    { x: 48, y: 25 }, { x: 48, y: 42 }, { x: 48, y: 58 }, { x: 48, y: 75 },
    { x: 72, y: 38 }, { x: 72, y: 62 },
  ],
  '4-3-3': [
    { x: 10, y: 50 }, { x: 23, y: 20 }, { x: 23, y: 40 }, { x: 23, y: 60 }, { x: 23, y: 80 },
    { x: 48, y: 28 }, { x: 48, y: 50 }, { x: 48, y: 72 },
    { x: 73, y: 25 }, { x: 75, y: 50 }, { x: 73, y: 75 },
  ],
  '3-5-2': [
    { x: 10, y: 50 }, { x: 23, y: 28 }, { x: 23, y: 50 }, { x: 23, y: 72 },
    { x: 48, y: 15 }, { x: 48, y: 34 }, { x: 48, y: 50 }, { x: 48, y: 66 }, { x: 48, y: 85 },
    { x: 73, y: 38 }, { x: 73, y: 62 },
  ],
  '4-2-3-1': [
    { x: 10, y: 50 }, { x: 23, y: 20 }, { x: 23, y: 40 }, { x: 23, y: 60 }, { x: 23, y: 80 },
    { x: 45, y: 38 }, { x: 45, y: 62 }, { x: 67, y: 25 }, { x: 67, y: 50 }, { x: 67, y: 75 },
    { x: 82, y: 50 },
  ],
  '5-3-2': [
    { x: 10, y: 50 }, { x: 23, y: 12 }, { x: 23, y: 31 }, { x: 23, y: 50 }, { x: 23, y: 69 }, { x: 23, y: 88 },
    { x: 50, y: 30 }, { x: 50, y: 50 }, { x: 50, y: 70 }, { x: 74, y: 38 }, { x: 74, y: 62 },
  ],
};

const FORMATION_NAMES = Object.keys(FORMATION_POSITIONS);

function hasRegisteredName(player) {
  const name = player.name?.trim() || '';
  return Boolean(name) && !/^(Suplente|Portera|Defensa|Media|Delantera)\s+\d+$/i.test(name);
}

function sortPlayersByNumber(firstPlayer, secondPlayer) {
  return (Number(firstPlayer.number) || 0) - (Number(secondPlayer.number) || 0);
}

function sortBenchPlayers(players) {
  const namedPlayers = players.filter(hasRegisteredName).sort(sortPlayersByNumber);
  const unnamedPlayers = players.filter((player) => !hasRegisteredName(player)).sort(sortPlayersByNumber);
  return [...namedPlayers, ...unnamedPlayers];
}

export default function PitchField({ teams, clubSide, roster, ball, onPlayerClick, onPlayerMove, onApplyFormation, selectingInjured, showPlayerNames, teamAppearance }) {
  const dragRef = useRef(null);
  const [benchTab, setBenchTab] = useState('team');
  const [formationSide, setFormationSide] = useState('local');

  const localPlayers = roster?.local ?? [];
  const visitorPlayers = roster?.visitor ?? [];

  const getFieldPosition = (event) => {
    const field = event.currentTarget.parentElement;
    const bounds = field.getBoundingClientRect();
    return {
      x: Math.max(2, Math.min(98, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(4, Math.min(96, ((event.clientY - bounds.top) / bounds.height) * 100)),
    };
  };

  const handlePointerDown = (event, player, team) => {
    if (selectingInjured) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      playerId: player.id,
      team,
      moved: false,
    };
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;

    dragRef.current.moved = true;
    if (onPlayerMove) {
      onPlayerMove(dragRef.current.playerId, getFieldPosition(event), dragRef.current.team);
    }
  };

  const handlePointerUp = (event, player, team) => {
    const wasDragged = dragRef.current?.moved;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (!wasDragged && onPlayerClick) {
      onPlayerClick(player, team);
    }
  };

  const renderTeamPlayers = (teamKey, players) => players.map((player) => (
    <div
      key={player.id}
      className={`player-token ${(teamKey === 'visitor' ? 'visitor-player' : '')} ${teamKey === 'local' ? `appearance-${teamAppearance?.shape || 'ball'}` : ''} ${player.role === 'POR' ? 'goalkeeper' : ''} ${player.injured ? 'injured' : ''} ${selectingInjured ? 'selectable' : ''}`}
      style={{
        left: `${player.x}%`,
        top: `${player.y}%`,
        ...(teamKey === 'local' ? { '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' } : {}),
      }}
      title={`Dorsal ${player.number}${player.injured ? ' (Lesionada)' : ''}`}
      onPointerDown={(event) => handlePointerDown(event, player, teamKey)}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => handlePointerUp(event, player, teamKey)}
      role={player.injured || selectingInjured ? 'button' : 'img'}
      tabIndex={player.injured || selectingInjured ? 0 : -1}
    >
      <span className="player-number">{player.number}</span>
      {teamKey === 'local' && <span className="player-name">{player.name}</span>}
      {player.injured && <span className="injury-icon">✚</span>}
      {player.redCards > 0 && <span className="red-card">🟥</span>}
      {player.yellowCards > 0 && !player.redCards && (
        <span className="yellow-card-badge">🟨</span>
      )}
    </div>
  ));

  return (
    <section className="pitch-wrapper" aria-label="Campo del partido">
      <div className="pitch-canvas">
        {/* Áreas y portería */}
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

        {/* Jugadoras */}
        {renderTeamPlayers('local', localPlayers)}
        {renderTeamPlayers('visitor', visitorPlayers)}

        {/* Balón */}
        <FootballBall
          className="pitch-ball"
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}%`,
          }}
          aria-label="Balón"
        />
      </div>

      <div className="bench-section" aria-label="Banquillos">
        <div className="bench-tabs" role="tablist" aria-label="Equipo y formación">
          <button type="button" className={benchTab === 'team' ? 'active' : ''} onClick={() => setBenchTab('team')} role="tab" aria-selected={benchTab === 'team'}>
            Equipo
          </button>
          <button type="button" className={benchTab === 'formation' ? 'active' : ''} onClick={() => setBenchTab('formation')} role="tab" aria-selected={benchTab === 'formation'}>
            Formación
          </button>
        </div>

        {benchTab === 'team' && [
          ['local', clubSide === 'visitor' ? teams?.visitor : teams?.local],
          ...(visitorPlayers.length > 0
            ? [['visitor', clubSide === 'visitor' ? teams?.local : teams?.visitor]]
            : []),
        ].map(([team, teamName]) => (
          <div className="bench-group" key={team}>
            <h3>{showPlayerNames ? teamName : team === 'local' ? 'Banquillo' : 'Banquillo rival'}</h3>
            <div className="bench-players">
              {sortBenchPlayers([...(team === 'visitor' ? (roster.visitorBench || []) : roster.bench)]
                .filter((player) => !player.absent && !player.injured))
                .map((player) => (
                <div
                  key={`${team}-${player.id}`}
                  className={`bench-player ${team === 'visitor' ? 'visitor-bench' : `appearance-${teamAppearance?.shape || 'ball'}`} ${player.role === 'POR' ? 'goalkeeper' : ''} ${selectingInjured && team === 'local' ? 'selectable' : ''}`}
                  style={team === 'local' ? { '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' } : undefined}
                  title={`Dorsal ${player.number}${player.injured ? ' (Lesionada)' : ''}`}
                  onClick={() => {
                    if (selectingInjured && onPlayerClick) {
                      onPlayerClick(player, team);
                    }
                  }}
                  role={selectingInjured ? 'button' : 'img'}
                  tabIndex={selectingInjured ? 0 : -1}
                >
                  <span className="player-number">{player.number}</span>
                  <span className="bench-player-name">{player.name}</span>
                  {player.injured && <span className="injury-icon">✚</span>}
                  {player.redCards > 0 && <span className="red-card">🟥</span>}
                  {player.yellowCards > 0 && !player.redCards && (
                    <span className="yellow-card-badge">🟨</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {benchTab === 'formation' && (
          <div className="formation-picker">
            <div className="formation-side-tabs" role="tablist" aria-label="Equipo para la formación">
              <button type="button" className={formationSide === 'local' ? 'active' : ''} onClick={() => setFormationSide('local')}>
                Mi equipo
              </button>
              <button type="button" className={formationSide === 'visitor' ? 'active' : ''} onClick={() => setFormationSide('visitor')}>
                Visitante
              </button>
            </div>
            <p>Elige una formación</p>
            <div className="formation-options">
              {FORMATION_NAMES.map((formation) => (
                <button
                  type="button"
                  className="formation-option"
                  key={formation}
                  onClick={() => onApplyFormation?.(formation, formationSide)}
                >
                  <span className="formation-mini-pitch">
                    {FORMATION_POSITIONS[formation].map((position, index) => (
                      <i key={`${formation}-${index}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} />
                    ))}
                  </span>
                  <strong>{formation}</strong>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
