import { useRef } from 'react';

function sortBenchPlayers(firstPlayer, secondPlayer) {
  const firstHasName = Boolean(firstPlayer.name?.trim()) && !/^Suplente\s+\d+$/i.test(firstPlayer.name.trim());
  const secondHasName = Boolean(secondPlayer.name?.trim()) && !/^Suplente\s+\d+$/i.test(secondPlayer.name.trim());

  if (firstHasName !== secondHasName) {
    return firstHasName ? -1 : 1;
  }

  return firstPlayer.number - secondPlayer.number;
}

export default function PitchField({ teams, clubSide, roster, ball, onPlayerClick, onPlayerMove, selectingInjured, showPlayerNames }) {
  const dragRef = useRef(null);
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
      className={`player-token ${(teamKey === 'visitor' ? 'visitor-player' : '')} ${player.role === 'POR' ? 'goalkeeper' : ''} ${player.injured ? 'injured' : ''} ${selectingInjured ? 'selectable' : ''}`}
      style={{
        left: `${player.x}%`,
        top: `${player.y}%`,
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
      {player.injured && <span className="injury-icon">🩹</span>}
      {player.redCards > 0 && <span className="red-card">🟥</span>}
      {player.yellowCards > 0 && !player.redCards && (
        <span className="yellow-card-badge">🟨</span>
      )}
    </div>
  ));

  return (
    <section className="pitch-wrapper" aria-label="Campo del partido">
      <div className="stadium-stand stand-top" aria-hidden="true">
        <div className="stand-row stand-row-back">● ● ● ●  ● ● ● ●  ● ● ● ●  ● ● ● ●</div>
        <div className="stand-row stand-row-middle">● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●</div>
        <div className="stand-row stand-row-front">● ● ● ●  ● ● ● ●  ● ● ● ●  ● ● ● ●</div>
        <div className="stand-rail" />
      </div>
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
        <div
          className="pitch-ball"
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}%`,
          }}
          aria-label="Balón"
        >
          <span />
        </div>
      </div>

      <div className="bench-section" aria-label="Banquillos">
        {[
          ['local', clubSide === 'visitor' ? teams?.visitor : teams?.local],
          ...(visitorPlayers.length > 0
            ? [['visitor', clubSide === 'visitor' ? teams?.local : teams?.visitor]]
            : []),
        ].map(([team, teamName]) => (
          <div className="bench-group" key={team}>
            <h3>{showPlayerNames ? teamName : team === 'local' ? 'Banquillo' : 'Banquillo rival'}</h3>
            <div className="bench-players">
              {[...(team === 'visitor' ? (roster.visitorBench || []) : roster.bench)].filter((player) => !player.absent).sort(sortBenchPlayers).map((player) => (
                <div
                  key={`${team}-${player.id}`}
                  className={`bench-player ${team === 'visitor' ? 'visitor-bench' : ''} ${player.role === 'POR' ? 'goalkeeper' : ''} ${selectingInjured && team === 'local' ? 'selectable' : ''}`}
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
                  {team === 'local' && <span className="player-name">{player.name}</span>}
                  {player.injured && <span className="injury-icon">🩹</span>}
                  {player.redCards > 0 && <span className="red-card">🟥</span>}
                  {player.yellowCards > 0 && !player.redCards && (
                    <span className="yellow-card-badge">🟨</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
