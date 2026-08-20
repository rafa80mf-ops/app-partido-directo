import { useMemo, useState } from 'react';

const emptyPlayer = {
  number: 1,
  name: 'Nueva jugadora',
  role: 'FWD',
  injured: false,
};

function hasPlayerName(player) {
  const name = player.name?.trim() || '';
  return Boolean(name) && !/^(Suplente|Portera|Defensa|Media|Delantera)\s+\d+$/i.test(name);
}

function sortRosterPlayers(firstPlayer, secondPlayer) {
  const firstHasName = hasPlayerName(firstPlayer);
  const secondHasName = hasPlayerName(secondPlayer);

  if (firstHasName !== secondHasName) {
    return firstHasName ? -1 : 1;
  }

  return firstPlayer.number - secondPlayer.number;
}

export default function RosterPanel({
  teams,
  roster,
  onAddPlayer,
  onUpdatePlayer,
  onMovePlayer,
  onSelectLineup,
  lineupConfirmed,
  managementOnly = false,
}) {
  const [draft, setDraft] = useState(emptyPlayer);
  const [editingId, setEditingId] = useState(null);
  const [addFormOpen, setAddFormOpen] = useState(false);

  const starterPlayers = useMemo(
    () => [...roster.local].sort(sortRosterPlayers),
    [roster.local],
  );
  const benchPlayers = useMemo(
    () => [...roster.bench].sort(sortRosterPlayers),
    [roster.bench],
  );
  const allPlayers = useMemo(
    () => [...starterPlayers, ...benchPlayers].sort(sortRosterPlayers),
    [starterPlayers, benchPlayers],
  );
  const rosterGroups = managementOnly
    ? [{ title: 'Plantilla', players: allPlayers, moveTarget: null }]
    : lineupConfirmed
    ? [
        { title: teams.local, players: starterPlayers, moveTarget: 'bench' },
        { title: 'Banquillo', players: benchPlayers, moveTarget: 'starter' },
      ]
    : [{ title: 'Plantilla', players: allPlayers, moveTarget: null }];

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    onAddPlayer('local', {
      ...draft,
      name: draft.name.trim(),
      role: draft.role || 'FWD',
      number: Number(draft.number) || 1,
    });

    setDraft(emptyPlayer);
    setAddFormOpen(false);
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setDraft({
      number: player.number,
      name: player.name,
      role: player.role || 'MED',
      injured: Boolean(player.injured),
    });
  };

  const saveInlineEdit = (event) => {
    event.preventDefault();
    if (editingId === null || !draft.name.trim()) return;

    onUpdatePlayer('local', editingId, {
      ...draft,
      name: draft.name.trim(),
      role: draft.role || 'MED',
      number: Number(draft.number) || 1,
    });
    setEditingId(null);
    setDraft(emptyPlayer);
  };

  return (
    <section className="roster-panel" aria-label="Gestión de jugadoras">
      <div className="roster-header">
        <h2>Plantilla</h2>
        <button type="button" className={`secondary-button roster-toggle-button ${addFormOpen ? 'open' : ''}`} onClick={() => setAddFormOpen((isOpen) => !isOpen)} aria-expanded={addFormOpen}>
          {addFormOpen ? '− Ocultar plantilla' : '+ Añadir jugadora'}
        </button>
      </div>

      {addFormOpen && <>
        <form className="player-form" onSubmit={handleSubmit}>
        <input
          type="number"
          min="1"
          value={draft.number}
          onChange={(event) => setDraft((current) => ({ ...current, number: Number(event.target.value) || 1 }))}
          aria-label="Número de jugadora"
          placeholder="Dorsal"
        />

        <input
          type="text"
          value={draft.name}
          onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
          aria-label="Nombre de jugadora"
          placeholder="Nombre"
        />

        <select
          value={draft.role}
          onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))}
          aria-label="Posición"
        >
          <option value="POR">POR</option>
          <option value="DEF">DEF</option>
          <option value="MED">MED</option>
          <option value="DEL">DEL</option>
        </select>

        <button type="submit" className="primary-button">
          {editingId ? 'Guardar' : 'Crear'}
        </button>
        </form>

        <div className={`roster-columns ${lineupConfirmed && !managementOnly ? '' : 'roster-single-column'}`}>
        {rosterGroups.map((group) => (
          <div className="roster-group" key={group.title}>
            <h3>{group.title}</h3>
            <ul className="roster-list">
              {group.players.map((player) => (
                <li key={player.id} className={`roster-item ${player.injured ? 'injured' : ''}`}>
                  {editingId === player.id ? (
                    <form className="roster-inline-editor" onSubmit={saveInlineEdit}>
                      <input type="number" min="1" value={draft.number} onChange={(event) => setDraft((current) => ({ ...current, number: Number(event.target.value) || 1 }))} aria-label="Dorsal" />
                      <input type="text" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} aria-label="Nombre" autoFocus />
                      <select value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} aria-label="Posición"><option value="POR">POR</option><option value="DEF">DEF</option><option value="MED">MED</option><option value="DEL">DEL</option></select>
                      <button type="submit" className="primary-button">Guardar</button>
                      <button type="button" className="secondary-button" onClick={() => { setEditingId(null); setDraft(emptyPlayer); }}>Cancelar</button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <strong>{player.number}. {player.name}</strong>
                        <small>{player.role}</small>
                      </div>
                      <div className="roster-actions">
                        <button type="button" onClick={() => startEdit(player)}>Editar</button>
                        {group.moveTarget && (
                          <button type="button" onClick={() => onMovePlayer('local', player.id, group.moveTarget)}>
                            {group.moveTarget === 'bench' ? '↓ Banquillo' : '↑ Titular'}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
        </div>

        {!managementOnly && (
          <button type="button" className="primary-button" onClick={onSelectLineup}>
            Seleccionar 11 titulares
          </button>
        )}
      </>}
    </section>
  );
}
