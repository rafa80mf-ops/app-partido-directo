import { useMemo, useState } from 'react';

export default function LineupModal({ players, initialSelectedIds, onConfirm, onCancel, canCancel }) {
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialSelectedIds || players.slice(0, 11).map((player) => player.id)),
  );
  const [selectionMessage, setSelectionMessage] = useState('');
  const [limitNoticeOpen, setLimitNoticeOpen] = useState(false);
  const [absentReasons, setAbsentReasons] = useState({});
  const sortedPlayers = useMemo(() => [...players].sort((firstPlayer, secondPlayer) => {
    const firstHasName = Boolean(firstPlayer.name?.trim()) && !/^Suplente\s+\d+$/i.test(firstPlayer.name.trim());
    const secondHasName = Boolean(secondPlayer.name?.trim()) && !/^Suplente\s+\d+$/i.test(secondPlayer.name.trim());

    if (firstHasName !== secondHasName) return firstHasName ? -1 : 1;
    return firstPlayer.number - secondPlayer.number;
  }), [players]);

  const togglePlayer = (playerId) => {
    if (absentReasons[playerId]) return;
    if (selectedIds.has(playerId)) {
      setSelectionMessage('');
      setSelectedIds((currentIds) => {
        const nextIds = new Set(currentIds);
        nextIds.delete(playerId);
        return nextIds;
      });
      return;
    }

    if (selectedIds.size >= 11) {
      setLimitNoticeOpen(true);
      return;
    }

    setSelectionMessage('');
    setSelectedIds((currentIds) => new Set([...currentIds, playerId]));
  };

  const toggleAbsence = (event, playerId) => {
    event.stopPropagation();
    setAbsentReasons((currentReasons) => {
      const nextReasons = { ...currentReasons };
      if (nextReasons[playerId]) {
        delete nextReasons[playerId];
      } else {
        nextReasons[playerId] = 'Lesión';
      }
      return nextReasons;
    });
    setSelectedIds((currentIds) => {
      const nextIds = new Set(currentIds);
      nextIds.delete(playerId);
      return nextIds;
    });
  };

  const changeAbsenceReason = (event, playerId) => {
    event.stopPropagation();
    setAbsentReasons((currentReasons) => ({ ...currentReasons, [playerId]: event.target.value }));
  };

  return (
    <div className="modal-overlay lineup-overlay" onClick={onCancel || undefined}>
      <div className="modal-content lineup-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading-row">
          <div>
            <h2>Equipo titular</h2>
            <p className="lineup-subtitle">Elige las 11 jugadoras que iniciarán el partido.</p>
          </div>
          {canCancel && <button type="button" className="modal-exit-button" onClick={onCancel}>Salir</button>}
        </div>
        <p className="selection-count" role="status">
          Once titular: {selectedIds.size}/11
        </p>
        {selectionMessage && <p className="selection-warning" role="status">{selectionMessage}</p>}
        {limitNoticeOpen && (
          <div className="selection-notice" role="alert">
            <strong>Ya hay 11 titulares seleccionadas.</strong>
            <p>Para cambiar una, desmarca primero una titular y después selecciona otra.</p>
            <div className="selection-notice-actions">
              <button type="button" className="secondary-button" onClick={() => setLimitNoticeOpen(false)}>
                OK
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => {
                  setLimitNoticeOpen(false);
                  setSelectionMessage('Desmarca una titular para poder elegir otra.');
                }}
              >
                Cambiar selección
              </button>
            </div>
          </div>
        )}

        <div className="lineup-squad-list" aria-label="Plantilla disponible">
          {sortedPlayers.map((player) => (
            <div key={player.id} className={`lineup-player-entry ${absentReasons[player.id] ? 'absent' : ''}`}>
              <button
                type="button"
                className={`lineup-squad-player ${selectedIds.has(player.id) ? 'selected' : ''} ${player.role === 'POR' ? 'goalkeeper' : ''}`}
                onClick={() => togglePlayer(player.id)}
                aria-pressed={selectedIds.has(player.id)}
              >
                <strong>{player.number}</strong>
                <span className="lineup-player-name">{player.name}</span>
                <small>{absentReasons[player.id] ? `Ausente: ${absentReasons[player.id]}` : selectedIds.has(player.id) ? 'Titular' : 'Disponible'}</small>
              </button>
              <button type="button" className="absence-toggle" onClick={(event) => toggleAbsence(event, player.id)}>
                {absentReasons[player.id] ? 'Disponible' : 'Ausente'}
              </button>
              {absentReasons[player.id] && <select className="absence-reason" value={absentReasons[player.id]} onClick={(event) => event.stopPropagation()} onChange={(event) => changeAbsenceReason(event, player.id)} aria-label={`Motivo de ausencia de ${player.name}`}><option value="Lesión">Lesión</option><option value="Otro">Otro motivo</option></select>}
            </div>
          ))}
        </div>

        <div className="lineup-actions">
          <button type="button" className="primary-button" disabled={selectedIds.size !== 11} onClick={() => onConfirm([...selectedIds], absentReasons)}>
            Confirmar once ({selectedIds.size}/11)
          </button>
          {canCancel && <button type="button" className="cancel-btn" onClick={onCancel}>Salir sin cambios</button>}
        </div>
      </div>
    </div>
  );
}