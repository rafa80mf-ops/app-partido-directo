import { useMemo, useState } from 'react';
import { translateUiText } from '../i18n/uiTranslator';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function sortPlayers(firstPlayer, secondPlayer) {
  const firstIsSubstitute = /^Suplente\s+\d+$/i.test(firstPlayer?.name?.trim() || '');
  const secondIsSubstitute = /^Suplente\s+\d+$/i.test(secondPlayer?.name?.trim() || '');

  if (firstIsSubstitute !== secondIsSubstitute) {
    return firstIsSubstitute ? 1 : -1;
  }

  if (firstIsSubstitute && secondIsSubstitute) {
    const firstSubstituteNumber = Number(firstPlayer.name.match(/\d+/)?.[0]) || 0;
    const secondSubstituteNumber = Number(secondPlayer.name.match(/\d+/)?.[0]) || 0;
    return firstSubstituteNumber - secondSubstituteNumber;
  }

  return (Number(firstPlayer.number) || 0) - (Number(secondPlayer.number) || 0);
}

function getPlayerName(player) {
  return player?.name?.trim() || `Jugadora ${player?.number || ''}`.trim();
}

function getNextTrainingNumber(sessions) {
  return sessions.reduce((highestNumber, training) => Math.max(highestNumber, Number(training.number) || 0), 0) + 1;
}

export default function TrainingDashboard({ roster, trainingSessions = [], onSaveTraining, onDeleteTraining, appLanguage = 'es' }) {
  const players = useMemo(() => [...(roster?.local || []), ...(roster?.bench || [])]
    .filter((player, index, allPlayers) => allPlayers.findIndex((candidate) => candidate.id === player.id) === index)
    .sort(sortPlayers), [roster]);
  const sessions = useMemo(() => [...(Array.isArray(trainingSessions) ? trainingSessions : [])].sort((first, second) => second.date.localeCompare(first.date)), [trainingSessions]);
  const [selectedDate, setSelectedDate] = useState(sessions[0]?.date || today());
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || null);
  const [trainingNumber, setTrainingNumber] = useState(sessions[0]?.number || getNextTrainingNumber(sessions));
  const [attendance, setAttendance] = useState(() => sessions[0]?.attendance || {});
  const [showStats, setShowStats] = useState(false);
  const [showTrainingHistory, setShowTrainingHistory] = useState(false);

  const selectedSession = sessions.find((training) => training.id === selectedSessionId) || null;
  const stats = useMemo(() => players.map((player) => {
    const records = sessions.map((training) => training.attendance?.[player.id]).filter(Boolean);
    const present = records.filter((status) => status === 'present').length;
    return {
      ...player,
      present,
      absent: records.filter((status) => status === 'absent').length,
      percentage: records.length > 0 ? Math.round((present / records.length) * 100) : 0,
    };
  }), [players, sessions]);

  const openSession = (date) => {
    const session = sessions.find((training) => training.date === date);
    setShowTrainingHistory(true);
    setSelectedDate(date);
    setSelectedSessionId(session?.id || null);
    setTrainingNumber(session?.number || getNextTrainingNumber(sessions));
    setAttendance(session?.attendance || {});
  };

  const handleDateChange = (date) => {
    openSession(date);
  };

  const updateAttendance = (playerId, status) => {
    setAttendance((current) => {
      if (current[playerId] === status) {
        const next = { ...current };
        delete next[playerId];
        return next;
      }

      return { ...current, [playerId]: status };
    });
  };

  const handleTrainingNumberChange = (number) => {
    const safeNumber = Math.max(1, Number(number) || 1);
    setTrainingNumber(safeNumber);
    if (!selectedSessionId) {
      const session = sessions.find((training) => training.date === selectedDate && training.number === safeNumber);
      setSelectedSessionId(session?.id || null);
      setAttendance(session?.attendance || {});
    }
  };

  const startNewTraining = () => {
    setSelectedSessionId(null);
    setSelectedDate(today());
    setTrainingNumber(getNextTrainingNumber(sessions));
    setAttendance({});
    setShowTrainingHistory(false);
  };

  const handleSave = (event) => {
    event.preventDefault();
    onSaveTraining({
      id: selectedSession?.id,
      date: selectedDate,
      number: trainingNumber,
      attendance: Object.fromEntries(players
        .filter((player) => attendance[player.id] === 'present' || attendance[player.id] === 'absent')
        .map((player) => [player.id, attendance[player.id]])),
    });
  };

  return (
    <section className="training-dashboard" aria-label="Entrenos">
      <header className="section-heading">
        <div>
          <h1>Entrenos</h1>
          <p>Control de asistencia y ausencia de la plantilla.</p>
        </div>
      </header>

      <div className="training-layout">
        <aside className="training-calendar-panel">
          <div className="training-panel-heading">
            <div>
              <h2>Calendario</h2>
              <span>{sessions.length} entrenos</span>
            </div>
            <div className="training-calendar-actions">
              <button type="button" className="secondary-button training-new-button" onClick={startNewTraining}>Nuevo entreno</button>
              <button type="button" className="secondary-button training-history-toggle" onClick={() => setShowTrainingHistory((current) => !current)} aria-expanded={showTrainingHistory}>
                {showTrainingHistory ? 'Ocultar historial' : 'Historial entrenos'}
              </button>
            </div>
          </div>
          <label className="training-date-picker">
            Día
            <input type="date" value={selectedDate} onChange={(event) => handleDateChange(event.target.value)} />
          </label>
          {showTrainingHistory && <div className="training-session-list">
            {sessions.length === 0 && <p className="empty-state">Todavía no hay entrenos guardados.</p>}
            {sessions.map((training) => (
              <div className={`training-session-card ${training.id === selectedSessionId ? 'active' : ''}`} key={training.id}>
                <button type="button" className="training-session-select" onClick={() => {
                  setSelectedDate(training.date);
                  setSelectedSessionId(training.id);
                  setTrainingNumber(training.number);
                  setAttendance(training.attendance || {});
                }}>
                  <strong>{training.date}</strong>
                  <span>Entreno {training.number}</span>
                </button>
                <div className="training-session-actions">
                  <button type="button" className="training-session-edit" onClick={() => {
                    setSelectedDate(training.date);
                    setSelectedSessionId(training.id);
                    setTrainingNumber(training.number);
                    setAttendance(training.attendance || {});
                  }}>
                    Modificar
                  </button>
                  <button type="button" className="training-session-delete" onClick={() => {
                    if (window.confirm(translateUiText('¿Borrar este entreno?', appLanguage))) {
                      onDeleteTraining(training.id);
                    }
                  }}>
                    Borrar
                  </button>
                </div>
              </div>
            ))}
          </div>}
        </aside>

        <form className="training-attendance-panel" onSubmit={handleSave}>
          <div className="training-panel-heading">
            <div>
              <h2>Control de entreno</h2>
              <p>{selectedDate}</p>
            </div>
            <label className="training-number-picker">
              Nº de entreno
              <span className="training-stepper">
                <button type="button" onClick={() => handleTrainingNumberChange(trainingNumber - 1)} aria-label="Entreno anterior">−</button>
                <input type="number" min="1" value={trainingNumber} onChange={(event) => handleTrainingNumberChange(event.target.value)} aria-label="Número de entreno" />
                <button type="button" onClick={() => handleTrainingNumberChange(trainingNumber + 1)} aria-label="Siguiente entreno">+</button>
              </span>
            </label>
          </div>

          <div className="training-player-list">
            {players.map((player) => (
              <div className="training-player-row" key={player.id}>
                <div className="training-player-name">
                  <strong>{player.number}. {getPlayerName(player)}</strong>
                  <small>{player.role}</small>
                </div>
                <div className="attendance-actions" role="group" aria-label={`Asistencia de ${getPlayerName(player)}`}>
                  <button type="button" className={attendance[player.id] === 'present' ? 'present active' : 'present'} onClick={() => updateAttendance(player.id, 'present')}>Asiste</button>
                  <button type="button" className={attendance[player.id] === 'absent' ? 'absent active' : 'absent'} onClick={() => updateAttendance(player.id, 'absent')}>Ausente</button>
                </div>
              </div>
            ))}
          </div>
          <button type="submit" className="primary-button training-save-button">Guardar entreno</button>
        </form>
      </div>

      <button type="button" className="primary-button training-stats-toggle" onClick={() => setShowStats((current) => !current)} aria-expanded={showStats}>
        {showStats ? 'Ocultar estadística' : 'Ver estadística'}
      </button>

      {showStats && <section className="training-stats-panel">
        <div className="training-panel-heading">
          <div>
            <h2>Estadística de asistencia</h2>
            <p>Resumen de todos los entrenos guardados.</p>
          </div>
          <strong>{sessions.length} sesiones</strong>
        </div>
        {sessions.length === 0 ? <p className="empty-state">Guarda el primer entreno para ver las estadísticas.</p> : (
          <div className="training-stats-table-wrap">
            <table className="training-stats-table">
              <thead><tr><th>Jugadora</th><th>Asiste</th><th>Ausente</th><th>Asistencia</th></tr></thead>
              <tbody>{stats.map((player) => <tr key={player.id}><td><strong>{player.number}</strong> {getPlayerName(player)}</td><td>{player.present}</td><td>{player.absent}</td><td><span className="attendance-progress"><i style={{ width: `${player.percentage}%` }} /></span><strong>{player.percentage}%</strong></td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>}
    </section>
  );
}
