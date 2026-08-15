function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export default function MatchHeader({ teams, scores, elapsedSeconds, onTeamNameChange }) {
  return (
    <header className="match-header">
      <div className="team-block">
        <label htmlFor="team-local" className="sr-only">Equipo local</label>
        <input
          id="team-local"
          value={teams.local}
          onChange={(event) => onTeamNameChange('local', event.target.value)}
          aria-label="Nombre del equipo local"
        />
      </div>

      <div className="score-block" aria-live="polite">
        <span className="score-value">{scores.local}</span>
        <span className="score-divider">:</span>
        <span className="score-value">{scores.visitor}</span>
      </div>

      <div className="clock-block" aria-live="polite">
        {formatClock(elapsedSeconds)}
      </div>

      <div className="team-block">
        <label htmlFor="team-visitor" className="sr-only">Equipo visitante</label>
        <input
          id="team-visitor"
          value={teams.visitor}
          onChange={(event) => onTeamNameChange('visitor', event.target.value)}
          aria-label="Nombre del equipo visitante"
        />
      </div>
    </header>
  );
}
