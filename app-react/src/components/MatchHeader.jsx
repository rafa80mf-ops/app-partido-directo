function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}

export default function MatchHeader({ teams, scores, elapsedSeconds, clubSide, clubCrest }) {

  return (
    <header className="match-header">
      <div className="team-block local-team">
        <div className="match-team-name">
          {clubSide === 'local' && <img className="club-crest" src={clubCrest} alt="Escudo del club" />}
          <div>
            <span>Local</span>
            <strong>{teams.local}</strong>
          </div>
        </div>
      </div>

      <div className="match-score-center">
        <div className="score-block" aria-live="polite">
          <span className="score-value">{scores.local}</span>
          <span className="score-divider">:</span>
          <span className="score-value">{scores.visitor}</span>
        </div>
        <div className="clock-block" aria-live="polite">
          <span className="clock-label">TIEMPO</span>
          {formatClock(elapsedSeconds)}
        </div>
      </div>

      <div className="team-block visitor-team">
        <div className="match-team-name match-team-visitor">
          <div>
            <span>Visitante</span>
            <strong>{teams.visitor}</strong>
          </div>
          {clubSide === 'visitor' && <img className="club-crest" src={clubCrest} alt="Escudo del club" />}
        </div>
      </div>
    </header>
  );
}
