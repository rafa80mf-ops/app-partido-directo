import { useMemo, useState } from 'react';

function formatMinutes(seconds) {
  return Math.floor((Number(seconds) || 0) / 60);
}

function buildPlayerStats(matches) {
  const stats = new Map();

  matches.forEach((match) => {
    const players = [...(match.roster?.local || []), ...(match.roster?.bench || [])];
    const clubTeam = match.clubSide === 'visitor' ? 'visitor' : 'local';
    const fieldIds = new Set((match.roster?.local || []).map((player) => player.id));

    players.forEach((player) => {
      const key = `${player.number}-${player.name}`;
      const current = stats.get(key) || { key, number: player.number, name: player.name, minutes: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
      if (fieldIds.has(player.id)) current.minutes += formatMinutes(match.elapsedSeconds);
      stats.set(key, current);
    });

    (match.events || []).filter((event) => event.team === clubTeam).forEach((event) => {
      (event.players || []).forEach((eventPlayer) => {
        const key = `${eventPlayer.number}-${eventPlayer.name}`;
        const current = stats.get(key) || { key, number: eventPlayer.number, name: eventPlayer.name, minutes: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
        if (event.type === 'goal') current.goals += 1;
        if (event.type === 'assist') current.assists += 1;
        if (event.type === 'yellow') current.yellowCards += 1;
        if (event.type === 'red') current.redCards += 1;
        stats.set(key, current);
      });
    });
  });

  return [...stats.values()].sort((firstPlayer, secondPlayer) => (
    secondPlayer.goals - firstPlayer.goals
    || secondPlayer.assists - firstPlayer.assists
    || secondPlayer.minutes - firstPlayer.minutes
    || firstPlayer.number - secondPlayer.number
  ));
}

function getEventIcon(eventType) {
  return {
    goal: '⚽',
    assist: '🅰️',
    yellow: '🟨',
    red: '🟥',
    substitution: '🔄',
    injury: '🩹',
  }[eventType] || '•';
}

function formatReportEventLabel(event) {
  return event.team === 'visitor' ? event.label.replace(/^#(\d+)/, '$1') : event.label;
}

export default function HistoryDashboard({ matches, onEditMatch, onDeleteMatch, teamAppearance }) {
  const [view, setView] = useState('reports');
  const [selectedMatchId, setSelectedMatchId] = useState(matches.at(-1)?.id || null);
  const [openCompetition, setOpenCompetition] = useState(() => (
    matches.some((match) => (match.type || 'Liga') === 'Liga') ? 'Liga' : 'Amistoso'
  ));
  const playerStats = useMemo(() => buildPlayerStats(matches), [matches]);
  const selectedMatch = matches.find((match) => match.id === selectedMatchId) || null;
  const selectedAppearance = selectedMatch?.teamAppearance || teamAppearance;
  const selectedEvents = selectedMatch?.events || [];
  const matchesByType = useMemo(() => ({
    Liga: [...matches].filter((match) => (match.type || 'Liga') === 'Liga').reverse(),
    Amistoso: [...matches].filter((match) => (match.type || 'Liga') === 'Amistoso').reverse(),
  }), [matches]);

  return (
    <section className="history-dashboard" aria-label="Historial">
      <header className="section-heading">
        <div><h1>Historial</h1><p>Consulta las actas y el rendimiento de tu equipo.</p></div>
      </header>
      <div className="history-tabs" role="tablist" aria-label="Historial">
        <button type="button" className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')} role="tab" aria-selected={view === 'reports'}>Actas</button>
        <button type="button" className={view === 'stats' ? 'active' : ''} onClick={() => setView('stats')} role="tab" aria-selected={view === 'stats'}>Estadísticas</button>
      </div>
      {matches.length === 0 ? <p className="empty-state history-empty-state">Todavía no hay partidos finalizados.</p> : view === 'reports' ? (
        <div className="reports-layout">
          <aside className="report-match-list" aria-label="Partidos finalizados">
            {Object.entries(matchesByType).map(([type, typeMatches]) => typeMatches.length > 0 && (
              <section className="report-competition-group" key={type}>
                <button type="button" className="report-competition-toggle" onClick={() => setOpenCompetition((current) => current === type ? null : type)} aria-expanded={openCompetition === type}>
                  <span><span className="competition-icon" aria-hidden="true">{type === 'Liga' ? <img src="/fcf-logo.svg" alt="" /> : <img src="/club-crest.svg" alt="" />}</span>{type === 'Liga' ? 'Liga' : 'Amistosos'}</span><span aria-hidden="true">{openCompetition === type ? '⌃' : '⌄'}</span>
                </button>
                {openCompetition === type && typeMatches.map((match) => <button key={match.id} type="button" className={selectedMatch?.id === match.id ? 'active' : ''} onClick={() => setSelectedMatchId(match.id)}><strong>{match.teams.local} {match.scores.local} - {match.scores.visitor} {match.teams.visitor}</strong><span>🗓️ {match.finishedAt}</span></button>)}
              </section>
            ))}
          </aside>
          {selectedMatch && <article className="match-report">
            <div className="match-report-heading"><div><span className="report-competition-badge">{selectedMatch.type === 'Amistoso' ? <><img src="/club-crest.svg" alt="" /> Amistoso</> : <><img src="/fcf-logo.svg" alt="" /> Liga</>}</span><h2>{selectedMatch.teams.local} {selectedMatch.scores.local} - {selectedMatch.scores.visitor} {selectedMatch.teams.visitor}</h2><p>🗓️ {selectedMatch.finishedAt}</p></div><div className="match-report-actions"><button type="button" className="icon-report-button edit-report-button" onClick={() => onEditMatch(selectedMatch)} title="Modificar acta" aria-label="Modificar acta">✎</button><button type="button" className="icon-report-button delete-report-button" onClick={() => { if (window.confirm('¿Borrar esta acta?')) onDeleteMatch(selectedMatch.id); }} title="Borrar acta" aria-label="Borrar acta">⌫</button></div></div>
            <h3 className="report-title">Acta</h3>
            {selectedEvents.length === 0 ? <p className="empty-state">No hay acciones registradas.</p> : <ol className="report-event-list">{selectedEvents.slice().reverse().map((event) => <li key={event.id} className={`${event.team === 'visitor' ? 'visitor-event' : 'local-event'} ${event.type === 'yellow' ? 'yellow-card-event' : ''}`}><span className={`report-event-icon ${event.type === 'yellow' ? 'yellow-card-icon' : ''} ${event.team === 'visitor' ? 'visitor-action-icon' : 'local-action-icon'} ${event.team === 'local' && selectedAppearance?.shape === 'shirt' ? 'appearance-shirt' : ''}`} style={event.team === 'local' ? { '--team-color': selectedAppearance?.color || '#facc15' } : undefined} aria-hidden="true">{getEventIcon(event.type)}</span><span>{formatReportEventLabel(event)}</span></li>)}</ol>}
          </article>}
        </div>
      ) : (
        <div className="stats-table-wrap"><table className="stats-table"><thead><tr><th>Jugadora</th><th>Min.</th><th>Goles</th><th>Asist.</th><th>Amar.</th><th>Rojas</th></tr></thead><tbody>{playerStats.map((player) => <tr key={player.key}><td><strong>{player.number}</strong> {player.name}</td><td>{player.minutes}</td><td>{player.goals}</td><td>{player.assists}</td><td>{player.yellowCards}</td><td>{player.redCards}</td></tr>)}</tbody></table></div>
      )}
    </section>
  );
        return results