const actionCopy = {
  goal: {
    title: 'Gol local',
    label: 'Selecciona la goleadora:',
  },
  assist: {
    title: 'Asistencia local',
    label: 'Selecciona la asistente:',
  },
};

export default function PlayerActionModal({ actionType, fieldPlayers, onSelectPlayer, onCancel }) {
  const copy = actionCopy[actionType];

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <h2>{copy.title}</h2>
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