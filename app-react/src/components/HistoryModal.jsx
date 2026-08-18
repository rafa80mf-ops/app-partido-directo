import { useState } from 'react';

export default function HistoryModal({ matches, onEdit, onDelete, onShare, onClose }) {
  const [shareMessage, setShareMessage] = useState('');

  const handleShare = async (match) => {
    const text = `${match.teams.local} ${match.scores.local} - ${match.scores.visitor} ${match.teams.visitor}\nFinalizado: ${match.finishedAt}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Acta del partido', text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      onShare(match);
      setShareMessage('Acta compartida o copiada.');
    } catch {
      setShareMessage('No se pudo compartir el acta.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calendar-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading-row">
          <h2>Historial de partidos</h2>
          <button type="button" className="icon-close-button" onClick={onClose} aria-label="Cerrar historial">×</button>
        </div>
        {matches.length === 0 ? (
          <p className="empty-state">Todavía no hay partidos finalizados.</p>
        ) : (
          <div className="calendar-list">
            {[...matches].reverse().map((match) => (
              <div className="calendar-match" key={match.id}>
                <div className="calendar-match-info history-match-info">
                  <strong>{match.teams.local} {match.scores.local} - {match.scores.visitor} {match.teams.visitor}</strong>
                  <small>📅 {match.finishedAt}</small>
                </div>
                <button type="button" className="calendar-edit" onClick={() => onEdit(match)} aria-label="Editar partido del historial">✎</button>
                <button type="button" className="calendar-share" onClick={() => handleShare(match)} aria-label="Compartir acta del partido">↗</button>
                <button type="button" className="calendar-delete" onClick={() => onDelete(match.id)} aria-label="Borrar partido del historial">×</button>
              </div>
            ))}
          </div>
        )}
        {shareMessage && <p className="selection-count" role="status">{shareMessage}</p>}
      </div>
    </div>
  );
}
