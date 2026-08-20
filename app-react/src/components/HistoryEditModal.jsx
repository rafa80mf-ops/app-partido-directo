import { useState } from 'react';

function buildActionLabel(event, actionType) {
  const player = event.players?.[0];
  if (!player) return event.label;

  const playerLabel = event.team === 'visitor' ? String(player.number) : player.name;
  const actionLabels = {
    goal: 'marca gol',
    assist: 'da asistencia',
    yellow: 'recibe tarjeta amarilla',
    red: 'recibe tarjeta roja y es expulsada',
    substitution: 'participa en un cambio',
    injury: 'se lesiona',
  };

  return actionLabels[actionType] ? `${playerLabel} ${actionLabels[actionType]}` : event.label;
}

function getPlayerKey(player) {
  return String(player.id ?? `${player.number}-${player.name}`);
}

export default function HistoryEditModal({ match, onSave, onClose }) {
  const [events, setEvents] = useState(() => [...match.events]);
  const [editingEventId, setEditingEventId] = useState(null);

  const updateEvent = (eventId, changes) => {
    setEvents((currentEvents) => currentEvents.map((event) => (
      event.id === eventId ? { ...event, ...changes } : event
    )));
  };

  const removeEvent = (eventId) => {
    setEvents((currentEvents) => currentEvents.filter((event) => event.id !== eventId));
  };

  const sortedEvents = [...events].sort((firstEvent, secondEvent) => {
    const firstTime = Date.parse(firstEvent.createdAt || 0) || 0;
    const secondTime = Date.parse(secondEvent.createdAt || 0) || 0;
    return firstTime - secondTime;
  });

  const players = [...(match.roster?.local || []), ...(match.roster?.bench || []), ...(match.roster?.visitor || []), ...(match.roster?.visitorBench || [])]
    .filter((player, index, allPlayers) => allPlayers.findIndex((candidate) => candidate.id === player.id) === index)
    .sort((firstPlayer, secondPlayer) => (Number(firstPlayer.number) || 0) - (Number(secondPlayer.number) || 0));

  const resolveEventPlayer = (event) => {
    const eventPlayer = event.players?.[0];
    if (!eventPlayer) return null;

    return players.find((player) => eventPlayer.id && String(player.id) === String(eventPlayer.id))
      || players.find((player) => Number(player.number) === Number(eventPlayer.number) && player.name === eventPlayer.name)
      || players.find((player) => Number(player.number) === Number(eventPlayer.number))
      || null;
  };

  const getEventIcon = (eventType) => ({ goal: '⚽', assist: '🅰️', yellow: '🟨', red: '🟥', substitution: '🔄', injury: '🩹' }[eventType] || '•');

  const updateEventPlayer = (event, playerId) => {
    const player = players.find((candidate) => getPlayerKey(candidate) === String(playerId));
    const previousPlayer = resolveEventPlayer(event) || event.players?.[0];
    if (!player || !previousPlayer) return;

    const nextLabel = event.team === 'visitor' ? String(player.number) : player.name;
    const label = event.label.replace(event.team === 'visitor' ? /^#?\d+/ : new RegExp(`^${previousPlayer.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), nextLabel);
    updateEvent(event.id, { label, players: [{ id: player.id, name: player.name, number: player.number }, ...(event.players || []).slice(1)] });
  };
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
        <p className="modal-label">Pulsa una acción para modificarla:</p>

        <div className="history-action-list history-edit-action-list">
          {sortedEvents.length === 0 ? <p className="empty-state">No hay acciones registradas.</p> : sortedEvents.map((event) => (
            <div className={`history-action-row ${editingEventId === event.id ? 'editing' : ''}`} key={event.id}>
              <button type="button" className="history-action-preview" onClick={() => setEditingEventId((currentId) => currentId === event.id ? null : event.id)}>
                <span className="report-event-icon" aria-hidden="true">{getEventIcon(event.type)}</span>
                <span>{event.label}</span>
              </button>
              <button type="button" className="calendar-delete" onClick={() => removeEvent(event.id)} aria-label="Borrar acción">×</button>
              {editingEventId === event.id && (
                <div className="history-action-editor">
                  <div className="history-action-editor-title">Modificar acción</div>
                  <select value={event.type || 'other'} onChange={(inputEvent) => updateEvent(event.id, { type: inputEvent.target.value, label: buildActionLabel(event, inputEvent.target.value) })} aria-label="Modificar acción">
                    <option value={event.type || 'other'}>{event.label}</option>
                    {[
                      ['goal', 'Gol'],
                      ['assist', 'Asistencia'],
                      ['yellow', 'Tarjeta amarilla'],
                      ['red', 'Tarjeta roja'],
                      ['substitution', 'Cambio'],
                      ['injury', 'Lesión'],
                      ['other', 'Otra acción'],
                    ].filter(([type]) => type !== (event.type || 'other')).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
                  </select>
                  {resolveEventPlayer(event) && <label>Modificar jugadora
                    <select value={getPlayerKey(resolveEventPlayer(event))} onChange={(inputEvent) => updateEventPlayer(event, inputEvent.target.value)}>
                      {players.map((player) => <option key={getPlayerKey(player)} value={getPlayerKey(player)}>{player.number} - {player.name}</option>)}
                    </select>
                  </label>}
                </div>
              )}
            </div>
          ))}
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
