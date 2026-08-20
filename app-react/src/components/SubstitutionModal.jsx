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
  const sortedBenchPlayers = [...benchPlayers]
    .filter((player) => !player.absent && !player.injured)
    .sort((firstPlayer, secondPlayer) => {
      const firstName = firstPlayer.name?.trim() || '';
      const secondName = secondPlayer.name?.trim() || '';
      const firstHasRegisteredName = Boolean(firstName) && !/^(Suplente|Portera|Defensa|Media|Delantera)\s+\d+$/i.test(firstName);
      const secondHasRegisteredName = Boolean(secondName) && !/^(Suplente|Portera|Defensa|Media|Delantera)\s+\d+$/i.test(secondName);

      if (firstHasRegisteredName !== secondHasRegisteredName) {
        return firstHasRegisteredName ? -1 : 1;
      }

      return (Number(firstPlayer.number) || 0) - (Number(secondPlayer.number) || 0);
    });

  const renderPlayerLabel = (player) => (
    <>
      <strong>{player.number}</strong>
      {player.name && <span>{player.name}</span>}
    </>
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
        <div className="modal-content substitution-modal" onClick={(event) => event.stopPropagation()}>
          <h2>Cambio visitante</h2>
          <p className="modal-label">Selecciona el número del suplente:</p>

          <div className="substitutes-list">
            {sortedBenchPlayers.length > 0 ? (
              <ul>
                {sortedBenchPlayers.map((player) => (
                  <li key={player.id}>
                    <button
                      type="button"
                      className="substitute-btn"
                      onClick={() => onSubstitute(outgoingPlayerId, player.id)}
                    >
                      {renderPlayerLabel(player)}
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
        <div className="modal-content substitution-modal" onClick={(event) => event.stopPropagation()}>
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
                      {renderPlayerLabel(player)}
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
            {sortedBenchPlayers.length > 0 ? (
              <ul>
                {sortedBenchPlayers.map((player) => (
                  <li key={player.id}>
                    <button
                      type="button"
                      className={`substitute-btn${selectedIncomingId === player.id ? ' selected' : ''}`}
                      aria-pressed={selectedIncomingId === player.id}
                      onClick={() => setSelectedIncomingId(player.id)}
                    >
                      {renderPlayerLabel(player)}
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
      <div className="modal-content substitution-modal" onClick={(event) => event.stopPropagation()}>
        <h2>Sustitución por lesión</h2>
        <p className="injured-player">
          {!isVisitor && <strong>{injuredPlayer.name} </strong>}(#{injuredPlayer.number}) sale del campo
        </p>

        <div className="substitutes-list">
          <p className="list-label">Selecciona suplente:</p>
          {sortedBenchPlayers.length > 0 ? (
            <ul>
              {sortedBenchPlayers.map((player) => (
                <li key={player.id}>
                  <button
                    type="button"
                    className="substitute-btn"
                    onClick={() => {
                      setSelectedIncomingId(player.id);
                      onSubstitute(player.id);
                    }}
                  >
                    {renderPlayerLabel(player)}
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
