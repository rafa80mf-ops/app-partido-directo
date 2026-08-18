import { useState } from 'react';
import { CLUB_NAME } from '../data/storage';

const initialForm = {
  date: '',
  time: '',
  type: 'Liga',
  visitor: '',
  clubSide: 'local',
};

export default function CalendarModal({
  matches,
  previousSeasons,
  onAddMatch,
  onUpdateMatch,
  onSelectMatch,
  onDeleteMatch,
  onClose,
}) {
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);
  const [activeTab, setActiveTab] = useState('current');

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.date || !form.time || !form.visitor.trim()) return;

    const matchData = {
      ...form,
      local: form.clubSide === 'local' ? CLUB_NAME : form.visitor.trim(),
      visitor: form.clubSide === 'visitor' ? CLUB_NAME : form.visitor.trim(),
    };

    if (editingId) {
      onUpdateMatch(editingId, matchData);
    } else {
      onAddMatch(matchData);
    }
    setOpenGroup(matchData.type);

    setForm(initialForm);
    setEditingId(null);
  };

  const startEdit = (match) => {
    setEditingId(match.id);
    setForm({
      date: match.date || '',
      time: match.time || '',
      type: match.type || 'Liga',
      visitor: match.clubSide === 'local' ? match.visitor : match.local,
      clubSide: match.clubSide || (match.local === CLUB_NAME ? 'local' : 'visitor'),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const renderMatches = (type) => {
    const filteredMatches = matches.filter((match) => match.type === type);

    if (filteredMatches.length === 0) {
      return <p className="empty-state">No hay partidos de {type.toLowerCase()}.</p>;
    }

    return filteredMatches.map((match) => (
      <div className="calendar-match" key={match.id}>
        <button type="button" className="calendar-match-info" onClick={() => onSelectMatch(match)}>
          <strong>{match.local} - {match.visitor}</strong>
          <small>📅 {match.date} · 🕒 {match.time || 'Sin hora'}</small>
        </button>
        <button type="button" className="calendar-edit" onClick={() => startEdit(match)} aria-label="Editar partido">✎</button>
        <button type="button" className="calendar-delete" onClick={() => onDeleteMatch(match.id)} aria-label="Borrar partido">×</button>
      </div>
    ));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calendar-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading-row">
          <h2>Calendario</h2>
          <button type="button" className="modal-exit-button" onClick={onClose}>Salir</button>
        </div>

        <div className="calendar-tabs" role="tablist" aria-label="Temporadas">
          <button type="button" className={activeTab === 'current' ? 'active' : ''} onClick={() => setActiveTab('current')} role="tab" aria-selected={activeTab === 'current'}>Temporada actual</button>
          <button type="button" className={activeTab === 'previous' ? 'active' : ''} onClick={() => setActiveTab('previous')} role="tab" aria-selected={activeTab === 'previous'}>Temporadas anteriores</button>
        </div>

        {activeTab === 'current' && (
          <>
            <form className="calendar-form" onSubmit={handleSubmit}>
          <label>Fecha<input type="date" value={form.date} onChange={(event) => updateForm('date', event.target.value)} required /></label>
          <label>Hora<input type="time" value={form.time} onChange={(event) => updateForm('time', event.target.value)} required /></label>
          <label>Competición<select value={form.type} onChange={(event) => updateForm('type', event.target.value)}><option value="Liga">Liga</option><option value="Amistoso">Amistoso</option></select></label>
          <label>Mi equipo
            <div className="club-calendar-preview">
              <img src="/club-crest.svg" alt="Escudo de C.F. Navarcles" />
              <strong>{CLUB_NAME}</strong>
            </div>
          </label>
          <label>¿Juega como local o visitante?
            <select value={form.clubSide} onChange={(event) => updateForm('clubSide', event.target.value)}>
              <option value="local">Local</option>
              <option value="visitor">Visitante</option>
            </select>
          </label>
          <label>Nombre del equipo rival
            <input value={form.visitor} onChange={(event) => updateForm('visitor', event.target.value)} placeholder="Nombre del rival" required />
          </label>
          <div className="calendar-form-actions">
            <button type="submit" className="primary-button">{editingId ? 'Guardar cambios' : 'Añadir partido'}</button>
            <button type="button" className="cancel-btn" onClick={onClose}>{editingId ? 'Cerrar' : 'Cerrar sin guardar'}</button>
            {editingId && <button type="button" className="secondary-button" onClick={cancelEdit}>Cancelar edición</button>}
          </div>
            </form>

            <div className="calendar-list">
          <section className="calendar-group">
            <button type="button" className="calendar-group-toggle" onClick={() => setOpenGroup((current) => current === 'Liga' ? null : 'Liga')} aria-expanded={openGroup === 'Liga'}>
              <span>🏆 Liga</span><span>{openGroup === 'Liga' ? '▴' : '▾'}</span>
            </button>
            {openGroup === 'Liga' && renderMatches('Liga')}
          </section>
          <section className="calendar-group">
            <button type="button" className="calendar-group-toggle" onClick={() => setOpenGroup((current) => current === 'Amistoso' ? null : 'Amistoso')} aria-expanded={openGroup === 'Amistoso'}>
              <span>🤝 Amistosos</span><span>{openGroup === 'Amistoso' ? '▴' : '▾'}</span>
            </button>
            {openGroup === 'Amistoso' && renderMatches('Amistoso')}
          </section>
        </div>
          </>
        )}

        {activeTab === 'previous' && (
          <section className="previous-seasons-panel">
            {previousSeasons.length === 0 ? (
              <p className="empty-state">No hay temporadas registradas.</p>
            ) : previousSeasons.map((season) => (
              <article className="previous-season-card" key={season.id}>
                <h3>Temporada {season.name}</h3>
                {season.matches.length === 0 ? (
                  <p className="empty-state">No hay partidos guardados.</p>
                ) : season.matches.map((match) => (
                  <div className="calendar-match archived-match" key={match.id}>
                    <div className="calendar-match-info">
                      <strong>{match.local} - {match.visitor}</strong>
                      <small>{match.type} · {match.date} · {match.time || 'Sin hora'}</small>
                    </div>
                  </div>
                ))}
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
