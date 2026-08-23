import { useState } from 'react';
import { CLUB_NAME } from '../data/storage';

export default function StartMatchModal({ matches, isFreshStart = false, onSelectCalendarMatch, onCreateInstant, onClose }) {
  const [instantOpen, setInstantOpen] = useState(isFreshStart || matches.length === 0);
  const [clubSide, setClubSide] = useState('local');
  const [rival, setRival] = useState('');

  const handleInstantSubmit = (event) => {
    event.preventDefault();
    if (!rival.trim()) return;
    onCreateInstant({
      clubSide,
      local: clubSide === 'local' ? CLUB_NAME : rival.trim(),
      visitor: clubSide === 'visitor' ? CLUB_NAME : rival.trim(),
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content start-match-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading-row">
          <h2>Iniciar partido</h2>
          <button type="button" className="icon-close-button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>

        {!isFreshStart && (
          <>
            <p className="modal-label">Elige un partido del calendario o créalo ahora:</p>
            <div className="start-match-calendar-list">
              {matches.length === 0 ? (
                <p className="empty-state">No hay partidos creados en el calendario.</p>
              ) : (
                matches.map((match) => (
                  <button type="button" className="calendar-match-info" key={match.id} onClick={() => onSelectCalendarMatch(match)}>
                    <strong>{match.local} - {match.visitor}</strong>
                    <small>{match.date} · {match.time || 'Sin hora'} · {match.type}</small>
                  </button>
                ))
              )}
            </div>
          </>
        )}

        <button type="button" className="primary-button instant-match-button" onClick={() => setInstantOpen((open) => !open)}>
          {instantOpen ? 'Ocultar creación rápida' : 'Crear partido al instante'}
        </button>

        {instantOpen && (
          <form className="instant-match-form" onSubmit={handleInstantSubmit}>
            <div className="club-calendar-preview">
              <img src="/club-crest.svg" alt="Escudo de C.F. Navarcles" />
              <strong>{CLUB_NAME}</strong>
            </div>
            <label>¿Juega como local o visitante?
              <select value={clubSide} onChange={(event) => setClubSide(event.target.value)}>
                <option value="local">Local</option>
                <option value="visitor">Visitante</option>
              </select>
            </label>
            <label>Equipo rival
              <input value={rival} onChange={(event) => setRival(event.target.value)} placeholder="Nombre del rival" required />
            </label>
            <button type="submit" className="primary-button">Crear y seleccionar titulares</button>
          </form>
        )}
      </div>
    </div>
  );
}
