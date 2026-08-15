export default function PitchField({ teams, roster, ball, onPlayerClick, selectingInjured }) {
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

        {/* Jugadoras */}
        {roster.local.map((player) => (
          <div
            key={player.id}
            className={`player-token ${player.injured ? 'injured' : ''} ${selectingInjured ? 'selectable' : ''}`}
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
            }}
            title={`${player.name} #${player.number}${player.injured ? ' (Lesionada)' : ''}`}
            onClick={() => {
              if ((player.injured || selectingInjured) && onPlayerClick) {
                onPlayerClick(player);
              }
            }}
            role={player.injured || selectingInjured ? 'button' : 'img'}
            tabIndex={player.injured || selectingInjured ? 0 : -1}
          >
            <span className="player-number">{player.number}</span>
            <span className="player-name">{player.name}</span>
            {player.injured && <span className="injury-icon">🩹</span>}
            {player.redCards > 0 && <span className="red-card">🟥</span>}
            {player.yellowCards > 0 && !player.redCards && (
              <span className="yellow-card-badge">🟨</span>
            )}
          </div>
        ))}

        {/* Balón */}
        <div
          className="pitch-ball"
          style={{
            left: `${ball.x}%`,
            top: `${ball.y}%`,
          }}
          aria-label="Balón"
        />
      </div>

      <div className="bench-section" aria-label="Banquillo">
        {roster.bench.map((player) => (
          <div
            key={player.id}
            className={`bench-player ${selectingInjured ? 'selectable' : ''}`}
            title={`${player.name} #${player.number}${player.injured ? ' (Lesionada)' : ''}`}
            onClick={() => {
              if (selectingInjured && onPlayerClick) {
                onPlayerClick(player);
              }
            }}
            role={selectingInjured ? 'button' : 'img'}
            tabIndex={selectingInjured ? 0 : -1}
          >
            <span className="player-number">{player.number}</span>
            <span className="player-name">{player.name}</span>
            {player.injured && <span className="injury-icon">🩹</span>}
            {player.redCards > 0 && <span className="red-card">🟥</span>}
            {player.yellowCards > 0 && !player.redCards && (
              <span className="yellow-card-badge">🟨</span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
