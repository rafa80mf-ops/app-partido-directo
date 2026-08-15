export default function SubstitutionModal({ injuredPlayer, benchPlayers, onSubstitute, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Sustitución por lesión</h2>
        <p className="injured-player">
          <strong>{injuredPlayer.name}</strong> (#{injuredPlayer.number}) sale del campo
        </p>

        <div className="substitutes-list">
          <p className="list-label">Selecciona suplente:</p>
          {benchPlayers.length > 0 ? (
            <ul>
              {benchPlayers.map((player) => (
                <li key={player.id}>
                  <button
                    className="substitute-btn"
                    onClick={() => onSubstitute(player.id)}
                  >
                    #{player.number} - {player.name}
                    {player.position && <span className="position">{player.position}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-substitutes">No hay suplentes disponibles</p>
          )}
        </div>

        <button className="cancel-btn" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
}
