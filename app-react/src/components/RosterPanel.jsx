import { useMemo, useState } from 'react';

const emptyPlayer = {
  number: 1,
  name: 'Nueva jugadora',
  role: 'FWD',
  injured: false,
};

export default function RosterPanel({
  teams,
  roster,
  onAddPlayer,
  onUpdatePlayer,
  onToggleInjured,
  onMovePlayer,
}) {
  const [draft, setDraft] = useState(emptyPlayer);
  const [editingId, setEditingId] = useState(null);

  const starterPlayers = useMemo(() => roster.local, [roster.local]);
  const benchPlayers = useMemo(() => roster.bench, [roster.bench]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!draft.name.trim()) {
      return;
    }

    if (editingId) {
      onUpdatePlayer('local', editingId, {
        ...draft,
        name: draft.name.trim(),
        role: draft.role || 'FWD',
        number: Number(draft.number) || 1,
      });
      setEditingId(null);
    } else {
      onAddPlayer('local', {
        ...draft,
        name: draft.name.trim(),
        role: draft.role || 'FWD',
        number: Number(draft.number) || 1,
      });
    }

    setDraft(emptyPlayer);
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setDraft({
      number: player.number,
      name: player.name,
      role: player.role,
      injured: Boolean(player.injured),
    });
  };

  return (
    <section className="roster-panel" aria-label="Gestión de jugadoras">
      <div className="roster-header">
        <h2>Plantilla</h2>
        <button type="button" className="secondary-button" onClick={() => onAddPlayer('local')}>
          + Añadir jugadora
        </button>
      </div>

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

        <label className="check-row">
          <input
            type="checkbox"
            checked={draft.injured}
            onChange={(event) => setDraft((current) => ({ ...current, injured: event.target.checked }))}
          />
          Lesionada
        </label>

        <button type="submit" className="primary-button">
          {editingId ? 'Guardar' : 'Crear'}
        </button>
      </form>

      <div className="roster-columns">
        <div className="roster-group">
          <h3>{teams.local}</h3>
          <ul className="roster-list">
            {starterPlayers.map((player) => (
              <li key={player.id} className={`roster-item ${player.injured ? 'injured' : ''}`}>
                <div>
                  <strong>{player.number}. {player.name}</strong>
                  <small>{player.role}</small>
                </div>
                <div className="roster-actions">
                  <button type="button" onClick={() => startEdit(player)}>Editar</button>
                  <button type="button" onClick={() => onToggleInjured('local', player.id)}>
                    {player.injured ? 'Recuperada' : 'Lesionada'}
                  </button>
                  <button type="button" onClick={() => onMovePlayer('local', player.id, 'bench')}>
                    ↓ Banquillo
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="roster-group">
          <h3>Banquillo</h3>
          <ul className="roster-list">
            {benchPlayers.map((player) => (
              <li key={player.id} className={`roster-item ${player.injured ? 'injured' : ''}`}>
                <div>
                  <strong>{player.number}. {player.name}</strong>
                  <small>{player.role}</small>
                </div>
                <div className="roster-actions">
                  <button type="button" onClick={() => startEdit(player)}>Editar</button>
                  <button type="button" onClick={() => onToggleInjured('local', player.id)}>
                    {player.injured ? 'Recuperada' : 'Lesionada'}
                  </button>
                  <button type="button" onClick={() => onMovePlayer('local', player.id, 'starter')}>
                    ↑ Titular
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
