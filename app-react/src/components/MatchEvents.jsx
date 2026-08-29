import FootballBall from './FootballBall';
import { useState } from 'react';

function getEventEmoji(type) {
  const mapping = {
    goal: null,
    assist: '🅰️',
    yellow: '🟨',
    red: '🟥',
    injury: null,
    substitution: '🔄',
    info: 'ℹ️',
    reset: '⟲',
  };

  return mapping[type] || '📌';
}

function getEventMinuteLabel(event) {
  if (Number.isFinite(event?.elapsedSeconds)) {
    return `${Math.floor(event.elapsedSeconds / 60)}'`;
  }

  if (Number.isFinite(event?.minute)) {
    return `${Math.floor(event.minute)}'`;
  }

  return null;
}

export default function MatchEvents({ events, teamAppearance, enabledPlayerActions = [] }) {
  const [eventsOpen, setEventsOpen] = useState(false);

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
      <button type="button" className="events-toggle" onClick={() => setEventsOpen((isOpen) => !isOpen)} aria-expanded={eventsOpen}>
        <span>Acta</span>
        <span aria-hidden="true">{eventsOpen ? '▴' : '▾'}</span>
      </button>

      {eventsOpen && (
        <>
          {events.length === 0 ? (
            <p className="empty-state">Todavía no hay eventos registrados.</p>
          ) : (
            <ul className="event-list">
              {events.map((event) => (
            <li key={event.id} className="event-item">
              {getEventMinuteLabel(event) && <span className="event-minute">{getEventMinuteLabel(event)}</span>}
              <span className={`event-emoji ${event.team === 'local' ? 'local-event-emoji' : event.team === 'visitor' ? 'visitor-event-emoji' : ''} ${event.team === 'local' && teamAppearance?.shape === 'shirt' ? 'appearance-shirt' : ''} ${event.type === 'injury' ? 'injury-event-emoji' : ''}`} style={event.team === 'local' ? { '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' } : undefined}>{event.type === 'goal' ? <FootballBall className="event-ball" /> : event.type === 'injury' ? <span className="injury-cross">✚</span> : getEventEmoji(event.type)}</span>
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
        </>
      )}
    </section>
  );
}
