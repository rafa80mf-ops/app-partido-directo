function getEventEmoji(type) {
  const mapping = {
    goal: '⚽',
    assist: '🅰️',
    yellow: '🟨',
    red: '🟥',
    substitution: '🔄',
    info: 'ℹ️',
    reset: '⟲',
  };

  return mapping[type] || '📌';
}

export default function MatchEvents({ events, onStartNewMatch, teamAppearance }) {
  const canStartNewMatch = events.some((event) => event.label.includes('Listo para iniciar uno nuevo'));

  const getActionLabel = (event) => {
    if (!event.players?.length) return event.label;

    let actionLabel = event.label;
    event.players.forEach((player, index) => {
      const playerLabel = event.team === 'visitor' ? `${player.number}` : player.name;
      actionLabel = actionLabel.replace(index === 0 ? `${playerLabel} ` : ` ${playerLabel}`, '');
    });
    if (event.team !== 'visitor') {
      actionLabel = actionLabel.replace(/\(#\d+\)\s*/, '');
    }
    return actionLabel;
  };

  return (
    <section className="events-panel" aria-label="Eventos del partido">
      <h2>Eventos</h2>

      {events.length === 0 ? (
        <p className="empty-state">Todavía no hay eventos registrados.</p>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id} className="event-item">
              <span className={`event-emoji ${event.team === 'local' ? 'local-event-emoji' : event.team === 'visitor' ? 'visitor-event-emoji' : ''} ${event.team === 'local' && teamAppearance?.shape === 'shirt' ? 'appearance-shirt' : ''}`} style={event.team === 'local' ? { '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' } : undefined}>{getEventEmoji(event.type)}</span>
              <div>
                {event.players?.length > 0 && (
                  <div className="event-player-list">
                    {event.players.map((player) => (
                      <span key={`${player.number}-${player.name}`} className={`event-player ${event.team === 'visitor' ? 'visitor' : 'local'}`} style={event.team === 'local' ? { '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' } : undefined}>
                        <span className={`event-player-number ${event.team === 'local' && teamAppearance?.shape === 'shirt' ? 'appearance-shirt' : ''}`}>{player.number}</span>
                        {event.team !== 'visitor' && <span className="event-player-name">{player.name}</span>}
                      </span>
                    ))}
                  </div>
                )}
                <strong>{getActionLabel(event)}</strong>
                <small>
                  {event.team === 'local' && 'Local'}
                  {event.team === 'visitor' && 'Visitante'}
                  {event.team === 'neutral' && 'Sistema'}
                </small>
              </div>
            </li>
          ))}
        </ul>
      )}

      {canStartNewMatch && (
        <div className="event-start-new">
          <button type="button" className="primary-button start-new-match-button" onClick={onStartNewMatch}>
            🏁 Iniciar nuevo partido
          </button>
        </div>
      )}
    </section>
  );
}
