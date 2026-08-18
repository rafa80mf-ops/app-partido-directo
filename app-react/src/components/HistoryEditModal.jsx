import { useState } from 'react';

export default function HistoryEditModal({ match, onSave, onClose }) {
  const [events, setEvents] = useState(() => [...match.events]);
  const [openSections, setOpenSections] = useState({});

  const updateEvent = (eventId, label) => {
    setEvents((currentEvents) => currentEvents.map((event) => (
      event.id === eventId ? { ...event, label } : event
    )));
  };

  const removeEvent = (eventId) => {
    setEvents((currentEvents) => currentEvents.filter((event) => event.id !== eventId));
  };

  const toggleSection = (sectionKey) => {
    setOpenSections((currentSections) => ({
      ...currentSections,
      [sectionKey]: !currentSections[sectionKey],
    }));
  };

  const sortedEvents = [...events].sort((firstEvent, secondEvent) => {
    const firstTime = Date.parse(firstEvent.createdAt || 0) || 0;
    const secondTime = Date.parse(secondEvent.createdAt || 0) || 0;
    return firstTime - secondTime;
  });

  const renderEventSection = (key, title, eventList, emptyText) => {
    const isOpen = Boolean(openSections[key]);

    return (
      <div className="history-action-group" key={key}>
        <button
          type="button"
          className="history-section-toggle"
          onClick={() => toggleSection(key)}
          aria-expanded={isOpen}
        >
          <span>{title}</span>
          <span>{isOpen ? '−' : '+'}</span>
        </button>

        {isOpen && (
          eventList.length === 0 ? (
            <p className="empty-state">{emptyText}</p>
          ) : (
            <div className="history-action-list">
              {eventList.map((event) => (
                <div className="history-action-row" key={event.id}>
                  <input
                    value={event.label}
                    onChange={(inputEvent) => updateEvent(event.id, inputEvent.target.value)}
                    aria-label={`Descripción de la acción ${title}`}
                  />
                  <button type="button" className="calendar-delete" onClick={() => removeEvent(event.id)} aria-label="Borrar acción">×</button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    );
  };

  const fullEvents = [...sortedEvents];
  const localEvents = sortedEvents.filter((event) => event.team === 'local');
  const visitorEvents = sortedEvents.filter((event) => event.team === 'visitor');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content history-edit-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading-row">
          <h2>Acta del partido</h2>
          <button type="button" className="icon-close-button" onClick={onClose} aria-label="Cerrar acta">×</button>
        </div>
        <p className="history-edit-score">
          {match.teams.local} {match.scores.local} - {match.scores.visitor} {match.teams.visitor}
        </p>
        <p className="modal-label">Modificar acciones:</p>

        <div className="history-section-groups">
          {renderEventSection('full', 'Acta completa', fullEvents, 'No hay acciones registradas.')}
          {renderEventSection('local', `Acta ${match.teams.local}`, localEvents, `No hay acciones del equipo local.`)}
          {renderEventSection('visitor', `Acta ${match.teams.visitor}`, visitorEvents, `No hay acciones del equipo visitante.`)}
        </div>

        <div className="history-edit-actions">
          <button type="button" className="primary-button" onClick={() => onSave(events)}>
            Guardar cambios
          </button>
          <button type="button" className="cancel-btn" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}
