import { useEffect, useState } from 'react';

export default function SubstitutionModal({
  injuredPlayer,
  fieldPlayers = [],
  benchPlayers = [],
  isVisitor,
  onSubstitute,
  onCancel,
  outgoingPlayerId = null,
}) {
  const isRegularSubstitution = !injuredPlayer;
  const [selectedOutgoingId, setSelectedOutgoingId] = useState(outgoingPlayerId ?? null);
  const [selectedIncomingId, setSelectedIncomingId] = useState(null);

  useEffect(() => {
    setSelectedOutgoingId(outgoingPlayerId ?? null);
    setSelectedIncomingId(null);
  }, [outgoingPlayerId]);

  const resolvedOutgoingId = selectedOutgoingId ?? outgoingPlayerId ?? null;

  const formatPlayerLabel = (player) => (
    isVisitor ? `#${player.number}` : `#${player.number} - ${player.name}`
  );

  const handleConfirm = () => {
    if (isRegularSubstitution) {
      if (!resolvedOutgoingId || !selectedIncomingId) return;
      onSubstitute(resolvedOutgoingId, selectedIncomingId);
      return;
    }

    if (!selectedIncomingId) return;
    onSubstitute(selectedIncomingId);
  };

  const quickVisitorSubstitution = isRegularSubstitution && isVisitor && outgoingPlayerId;

  if (isRegularSubstitution && quickVisitorSubstitution) {
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content" onClick={(event) => event.stopPropagation()}>
          <h2>Cambio visitante</h2>
          <p className="modal-label">Selecciona el número del suplente:</p>

          <div className="substitutes-list">
            {benchPlayers.length > 0 ? (
              <ul>
                {benchPlayers.map((player) => (
                  <li key={player.id}>
                    <button
                      type="button"
                      className="substitute-btn"
                      onClick={() => onSubstitute(outgoingPlayerId, player.id)}
                    >
                      {formatPlayerLabel(player)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-substitutes">No hay suplentes disponibles</p>
            )}
          </div>

          <button type="button" className="cancel-btn" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    );
  }

  if (isRegularSubstitution) {
    return (
      <div className="modal-overlay" onClick={onCancel}>
        <div className="modal-content" onClick={(event) => event.stopPropagation()}>
          <h2>Cambio</h2>
          <p className="modal-label">{isVisitor ? 'Elige el número que sale y el suplente.' : 'Elige la jugadora que sale y la suplente que entra.'}</p>

          <div className="substitutes-list">
            <p className="list-label">{isVisitor ? 'Sale:' : 'Jugador que sale:'}</p>
            {fieldPlayers.length > 0 ? (
              <ul>
                {fieldPlayers.map((player) => (
                  <li key={player.id}>
                    <button
                      type="button"
                      className={`substitute-btn${selectedOutgoingId === player.id ? ' selected' : ''}`}
                      aria-pressed={selectedOutgoingId === player.id}
                      onClick={() => setSelectedOutgoingId(player.id)}
                    >
                      {formatPlayerLabel(player)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-substitutes">No hay jugadoras en el campo</p>
            )}
          </div>

          <div className="substitutes-list">
            <p className="list-label">{isVisitor ? 'Suplente:' : 'Suplente:'}</p>
            {benchPlayers.length > 0 ? (
              <ul>
                {benchPlayers.map((player) => (
                  <li key={player.id}>
                    <button
                      type="button"
                      className={`substitute-btn${selectedIncomingId === player.id ? ' selected' : ''}`}
                      aria-pressed={selectedIncomingId === player.id}
                      onClick={() => setSelectedIncomingId(player.id)}
                    >
                      {formatPlayerLabel(player)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="no-substitutes">No hay suplentes disponibles</p>
            )}
          </div>

          <button
            type="button"
            className="action-button"
            disabled={!resolvedOutgoingId || !selectedIncomingId}
            onClick={handleConfirm}
          >
            Confirmar cambio
          </button>
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <h2>Sustitución por lesión</h2>
        <p className="injured-player">
          {!isVisitor && <strong>{injuredPlayer.name} </strong>}(#{injuredPlayer.number}) sale del campo
        </p>

        <div className="substitutes-list">
          <p className="list-label">Selecciona suplente:</p>
          {benchPlayers.length > 0 ? (
            <ul>
              {benchPlayers.map((player) => (
                <li key={player.id}>
                  <button
                    type="button"
                    className="substitute-btn"
                    onClick={() => {
                      setSelectedIncomingId(player.id);
                      onSubstitute(player.id);
                    }}
                  >
                    {formatPlayerLabel(player)}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-substitutes">No hay suplentes disponibles</p>
          )}
        </div>

        <button type="button" className="cancel-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
