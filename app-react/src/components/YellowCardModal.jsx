export default function YellowCardModal({ allPlayers, onSelectPlayer, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Tarjeta Amarilla</h2>
        <p className="modal-label">Selecciona jugadora:</p>

        <div className="players-grid">
          {allPlayers.length > 0 ? (
            allPlayers.map((player) => (
              <button
                key={player.id}
                className="player-select-btn"
                onClick={() => onSelectPlayer(player)}
              >
                <span className="player-circle">
                  {player.number}
                </span>
                <span className="player-info">
                  {player.name}
                  {player.yellowCards > 0 && <span className="card-count"> ({player.yellowCards}🟨)</span>}
                </span>
              </button>
            ))
          ) : (
            <p className="no-players">No hay jugadoras disponibles</p>
          )}
        </div>

        <button className="cancel-btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
