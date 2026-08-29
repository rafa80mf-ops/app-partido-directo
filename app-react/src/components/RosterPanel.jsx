import { useEffect, useMemo, useState } from 'react';

const emptyPlayer = {
  number: 1,
  name: 'Nueva jugadora',
  role: 'DEL',
  injured: false,
};

const technicalStaffRoleOptions = [
  { value: 'ENTRENADOR', label: 'Entrenador/a' },
  { value: 'SEGUNDO_ENTRENADOR', label: 'Segundo entrenador/a' },
  { value: 'DELEGADO', label: 'Delegado/a' },
  { value: 'FISIO', label: 'Fisio' },
  { value: 'AUXILIAR', label: 'Auxiliar' },
];

const emptyTechnicalStaffMember = {
  name: '',
  role: 'ENTRENADOR',
};

function normalizeTechnicalStaffMember(member, index) {
  if (!member || typeof member !== 'object') {
    return null;
  }

  const name = typeof member.name === 'string' ? member.name.trim() : '';
  if (!name) {
    return null;
  }

  const role = typeof member.role === 'string' ? member.role : 'AUXILIAR';
  return {
    id: typeof member.id === 'string' && member.id.trim() ? member.id : `staff-${index}`,
    name,
    role,
  };
}

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

  const firstIsSubstitute = /^Suplente\s+\d+$/i.test(firstPlayer.name?.trim() || '');
  const secondIsSubstitute = /^Suplente\s+\d+$/i.test(secondPlayer.name?.trim() || '');

  if (firstIsSubstitute !== secondIsSubstitute) {
    return firstIsSubstitute ? 1 : -1;
  }

  if (firstIsSubstitute && secondIsSubstitute) {
    return (Number(firstPlayer.name.match(/\d+/)?.[0]) || 0) - (Number(secondPlayer.name.match(/\d+/)?.[0]) || 0);
  }

  return (Number(firstPlayer.number) || 0) - (Number(secondPlayer.number) || 0);
}

export default function RosterPanel({
  teams,
  roster,
  technicalStaff = [],
  onAddPlayer,
  onUpdatePlayer,
  onMovePlayer,
  onUpdateTechnicalStaff = () => {},
  onSelectLineup,
  lineupConfirmed,
  managementOnly = false,
}) {
  const [draft, setDraft] = useState(emptyPlayer);
  const [editingId, setEditingId] = useState(null);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [technicalStaffDraft, setTechnicalStaffDraft] = useState(emptyTechnicalStaffMember);
  const [editingTechnicalStaffId, setEditingTechnicalStaffId] = useState(null);

  const technicalStaffList = useMemo(
    () => (Array.isArray(technicalStaff) ? technicalStaff : [])
      .map((member, index) => normalizeTechnicalStaffMember(member, index))
      .filter(Boolean),
    [technicalStaff],
  );

  useEffect(() => {
    if (editingTechnicalStaffId && !technicalStaffList.some((member) => member.id === editingTechnicalStaffId)) {
      setEditingTechnicalStaffId(null);
      setTechnicalStaffDraft(emptyTechnicalStaffMember);
    }
  }, [editingTechnicalStaffId, technicalStaffList]);

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
      role: draft.role || 'DEL',
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

  const handleSaveTechnicalStaff = (event) => {
    event.preventDefault();

    const normalizedName = technicalStaffDraft.name.trim();
    if (!normalizedName) {
      return;
    }

    if (editingTechnicalStaffId) {
      onUpdateTechnicalStaff(
        technicalStaffList.map((member) => member.id === editingTechnicalStaffId
          ? { ...member, name: normalizedName, role: technicalStaffDraft.role }
          : member),
      );
      setEditingTechnicalStaffId(null);
    } else {
      onUpdateTechnicalStaff([
        ...technicalStaffList,
        {
          id: crypto.randomUUID(),
          name: normalizedName,
          role: technicalStaffDraft.role,
        },
      ]);
    }

    setTechnicalStaffDraft(emptyTechnicalStaffMember);
  };

  const startEditTechnicalStaff = (member) => {
    setEditingTechnicalStaffId(member.id);
    setTechnicalStaffDraft({
      name: member.name,
      role: member.role,
    });
  };

  const removeTechnicalStaff = (memberId) => {
    onUpdateTechnicalStaff(technicalStaffList.filter((member) => member.id !== memberId));

    if (editingTechnicalStaffId === memberId) {
      setEditingTechnicalStaffId(null);
      setTechnicalStaffDraft(emptyTechnicalStaffMember);
    }
  };

  const technicalStaffRoleLabel = (role) => {
    const option = technicalStaffRoleOptions.find((roleOption) => roleOption.value === role);
    return option ? option.label : 'Auxiliar';
  };

  return (
    <section className="roster-panel" aria-label="Gestión de jugadoras">
      <div className="roster-header">
        <h2>Plantilla</h2>
        <button type="button" className={`secondary-button roster-toggle-button ${addFormOpen ? 'open' : ''}`} onClick={() => setAddFormOpen((isOpen) => !isOpen)} aria-expanded={addFormOpen}>
          {addFormOpen ? '− Ocultar plantilla' : '+ Añadir jugadora'}
        </button>
      </div>

      {addFormOpen && (
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
      )}

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

      <section className="technical-staff-panel" aria-label="Cuerpo técnico">
        <h3>Cuerpo técnico</h3>
        <form className="technical-staff-form" onSubmit={handleSaveTechnicalStaff}>
          <select
            value={technicalStaffDraft.role}
            onChange={(event) => setTechnicalStaffDraft((current) => ({ ...current, role: event.target.value }))}
            aria-label="Rol de cuerpo técnico"
          >
            {technicalStaffRoleOptions.map((roleOption) => (
              <option key={roleOption.value} value={roleOption.value}>{roleOption.label}</option>
            ))}
          </select>
          <input
            type="text"
            value={technicalStaffDraft.name}
            onChange={(event) => setTechnicalStaffDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Nombre"
            aria-label="Nombre de cuerpo técnico"
          />
          <button type="submit" className="secondary-button">{editingTechnicalStaffId ? 'Guardar' : 'Añadir'}</button>
          {editingTechnicalStaffId && (
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setEditingTechnicalStaffId(null);
                setTechnicalStaffDraft(emptyTechnicalStaffMember);
              }}
            >
              Cancelar
            </button>
          )}
        </form>

        {technicalStaffList.length > 0 && (
          <ul className="technical-staff-list">
            {technicalStaffList.map((member) => (
              <li key={member.id}>
                <div>
                  <strong>{member.name}</strong>
                  <small>{technicalStaffRoleLabel(member.role)}</small>
                </div>
                <div className="roster-actions">
                  <button type="button" onClick={() => startEditTechnicalStaff(member)}>Editar</button>
                  <button type="button" onClick={() => removeTechnicalStaff(member.id)}>Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!managementOnly && (
        <button type="button" className="primary-button" onClick={onSelectLineup}>
          Seleccionar 11 titulares
        </button>
      )}
    </section>
  );
}
