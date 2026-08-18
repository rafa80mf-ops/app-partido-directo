export default function RedCardModal({ fieldPlayers, onSelectPlayer, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <h2>Tarjeta Roja</h2>
        <p className="modal-label">Selecciona jugadora del campo:</p>

        <div className="players-grid">
          {fieldPlayers.length > 0 ? (
            fieldPlayers.map((player) => (
              <button
                key={player.id}
                className="player-select-btn"
                onClick={() => onSelectPlayer(player)}
              >
                <span className="player-circle">{player.number}</span>
                <span className="player-info">
                  {player.name}
                  {player.redCards > 0 && <span className="card-count"> ({player.redCards}🟥)</span>}
                </span>
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