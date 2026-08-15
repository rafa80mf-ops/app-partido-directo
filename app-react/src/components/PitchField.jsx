export default function PitchField({ teams, roster, ball }) {
  return (
    <section className="pitch-wrapper" aria-label="Campo del partido">
      <div className="pitch-canvas">
        {roster.local.map((player) => (
          <div
            key={player.id}
            className="player-token"
            style={{
              left: `${player.x}%`,
              top: `${player.y}%`,
            }}
            title={`${player.name} (${player.role})`}
          >
            {player.number}
          </div>
        ))}

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
          <span key={player.id} className="bench-player">
            {player.number}. {player.name}
          </span>
        ))}
      </div>
    </section>
  );
}
