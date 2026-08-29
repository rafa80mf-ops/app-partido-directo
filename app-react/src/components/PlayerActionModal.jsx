const actionCopy = {
  goal: {
    title: 'Gol local',
    label: 'Selecciona la goleadora:',
    icon: '⚽',
  },
  assist: {
    title: 'Asistencia local',
    label: 'Selecciona la asistente:',
    icon: '🅰️',
  },
};

export default function PlayerActionModal({ actionType, fieldPlayers, onSelectPlayer, onCancel }) {
  const copy = actionCopy[actionType] || {
    title: 'Acción local',
    label: 'Selecciona la jugadora:',
    icon: '•',
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <h2>{copy.icon} {copy.title}</h2>
        <p className="modal-label">{copy.label}</p>

        <div className="players-grid">
          {fieldPlayers.length > 0 ? (
            fieldPlayers.map((player) => (
              <button
                key={player.id}
                className="player-select-btn"
                onClick={() => onSelectPlayer(player)}
              >
                <span className="player-circle">{player.number}</span>
                <span className="player-info">{player.name}</span>
              </button>
            ))
          ) : (
            <p className="no-players">No hay jugadoras en el campo</p>
          )}
        </div>

        <button className="cancel-btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}