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

export default function MatchEvents({ events }) {
  return (
    <section className="events-panel" aria-label="Eventos del partido">
      <h2>Eventos</h2>

      {events.length === 0 ? (
        <p className="empty-state">Todavía no hay eventos registrados.</p>
      ) : (
        <ul className="event-list">
          {events.map((event) => (
            <li key={event.id} className="event-item">
              <span className="event-emoji">{getEventEmoji(event.type)}</span>
              <div>
                <strong>{event.label}</strong>
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
    </section>
  );
}
