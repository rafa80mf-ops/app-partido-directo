import { useState } from 'react';

export default function HistoryModal({ matches, onEdit, onDelete, onShare, onClose }) {
  const [shareMessage, setShareMessage] = useState('');
  const [openType, setOpenType] = useState('Liga');

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

  const matchesByType = {
    Liga: [...matches].filter((match) => (match.type || 'Liga') === 'Liga').reverse(),
    Amistoso: [...matches].filter((match) => (match.type || 'Liga') === 'Amistoso').reverse(),
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
          <div className="calendar-list history-competition-list">
            {Object.entries(matchesByType).map(([type, typeMatches]) => typeMatches.length > 0 && (
              <section className="history-competition-group" key={type}>
                <button type="button" className="history-competition-toggle" onClick={() => setOpenType((current) => current === type ? null : type)} aria-expanded={openType === type}>
                  <span><span className="competition-icon" aria-hidden="true">{type === 'Liga' ? <img src="/fcf-logo.svg" alt="" /> : <img src="/club-crest.svg" alt="" />}</span>{type === 'Liga' ? 'Liga' : 'Amistosos'}</span><span aria-hidden="true">{openType === type ? '⌃' : '⌄'}</span>
                </button>
                {openType === type && typeMatches.map((match) => (
                  <div className="calendar-match" key={match.id}>
                    <div className="calendar-match-info history-match-info">
                      <strong>{match.teams.local} {match.scores.local} - {match.scores.visitor} {match.teams.visitor}</strong>
                      <small>🗓️ {match.finishedAt}</small>
                    </div>
                    <button type="button" className="calendar-edit" onClick={() => onEdit(match)} title="Editar acta" aria-label="Editar acta">✎</button>
                    <button type="button" className="calendar-share" onClick={() => handleShare(match)} title="Compartir acta" aria-label="Compartir acta">↗</button>
                    <button type="button" className="calendar-delete" onClick={() => onDelete(match.id)} title="Borrar acta" aria-label="Borrar acta">×</button>
                  </div>
                ))}
              </section>
            ))}
          </div>
        )}
        {shareMessage && <p className="selection-count" role="status">{shareMessage}</p>}
      </div>
    </div>
  );
}
