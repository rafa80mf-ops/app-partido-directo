import { useMemo, useRef, useState } from 'react';
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

function formatAbsenceReason(reason) {
  return {
    lesion: 'Lesión',
    estudios: 'Estudios',
    medicos: 'Médicos',
    otros: 'Otros',
  }[reason] || 'Otros';
}

function getNextTrainingNumber(sessions) {
  return sessions.reduce((highestNumber, training) => Math.max(highestNumber, Number(training.number) || 0), 0) + 1;
}

function getNextTrainingNumberForDate(sessions, date) {
  const safeDate = String(date || '').trim();
  const highestNumberForDate = sessions
    .filter((training) => training.date === safeDate)
    .reduce((highestNumber, training) => Math.max(highestNumber, Number(training.number) || 0), 0);

  if (highestNumberForDate > 0) {
    return highestNumberForDate + 1;
  }

  return getNextTrainingNumber(sessions);
}

const ABSENCE_REASON_OPTIONS = [
  { value: 'lesion', label: 'Lesión' },
  { value: 'estudios', label: 'Estudios' },
  { value: 'medicos', label: 'Médicos' },
  { value: 'otros', label: 'Otros' },
];

export default function TrainingDashboard({ roster, trainingSessions = [], onSaveTraining, onDeleteTraining, appLanguage = 'es' }) {
  const dateInputRef = useRef(null);
  const players = useMemo(() => [...(roster?.local || []), ...(roster?.bench || [])]
    .filter((player, index, allPlayers) => allPlayers.findIndex((candidate) => candidate.id === player.id) === index)
    .sort(sortPlayers), [roster]);
  const sessions = useMemo(() => [...(Array.isArray(trainingSessions) ? trainingSessions : [])].sort((first, second) => second.date.localeCompare(first.date)), [trainingSessions]);
  const [selectedDate, setSelectedDate] = useState(sessions[0]?.date || today());
  const [selectedSessionId, setSelectedSessionId] = useState(sessions[0]?.id || null);
  const [trainingNumber, setTrainingNumber] = useState(sessions[0]?.number || getNextTrainingNumber(sessions));
  const [attendance, setAttendance] = useState(() => sessions[0]?.attendance || {});
  const [absenceReasons, setAbsenceReasons] = useState(() => sessions[0]?.absenceReasons || {});
  const [showStats, setShowStats] = useState(false);
  const [showTrainingHistory, setShowTrainingHistory] = useState(false);
  const [historyPlayerId, setHistoryPlayerId] = useState(null);

  const selectedSession = sessions.find((training) => training.id === selectedSessionId) || null;
  const selectedHistoryPlayer = players.find((player) => player.id === historyPlayerId) || null;
  const selectedPlayerTimeline = useMemo(() => {
    if (!historyPlayerId) {
      return [];
    }

    return sessions
      .map((training) => {
        const status = training.attendance?.[historyPlayerId];
        if (status !== 'present' && status !== 'absent') {
          return null;
        }

        const reason = status === 'absent'
          ? formatAbsenceReason(training.absenceReasons?.[historyPlayerId] || 'otros')
          : null;

        return {
          id: training.id,
          date: training.date,
          number: training.number,
          status,
          reason,
        };
      })
      .filter(Boolean)
      .sort((first, second) => {
        const byDate = second.date.localeCompare(first.date);
        if (byDate !== 0) {
          return byDate;
        }
        return (Number(second.number) || 0) - (Number(first.number) || 0);
      });
  }, [sessions, historyPlayerId]);

  const stats = useMemo(() => players.map((player) => {
    const records = sessions.map((training) => training.attendance?.[player.id]).filter(Boolean);
    const present = records.filter((status) => status === 'present').length;
    const reasonCounters = sessions.reduce((totals, training) => {
      if (training.attendance?.[player.id] !== 'absent') {
        return totals;
      }

      const reason = training.absenceReasons?.[player.id] || 'otros';
      const safeReason = ['lesion', 'estudios', 'medicos', 'otros'].includes(reason) ? reason : 'otros';

      return {
        ...totals,
        [safeReason]: totals[safeReason] + 1,
      };
    }, {
      lesion: 0,
      estudios: 0,
      medicos: 0,
      otros: 0,
    });

    const absenceReasonSummary = Object.entries(reasonCounters)
      .filter(([, count]) => count > 0)
      .map(([reason, count]) => `${formatAbsenceReason(reason)}: ${count}`)
      .join(' · ');

    return {
      ...player,
      present,
      absent: records.filter((status) => status === 'absent').length,
      percentage: records.length > 0 ? Math.round((present / records.length) * 100) : 0,
      absenceReasonSummary,
    };
  }), [players, sessions]);

  const openSession = (date) => {
    const session = sessions.find((training) => training.date === date);
    setShowTrainingHistory(true);
    setSelectedDate(date);
    setSelectedSessionId(session?.id || null);
    setTrainingNumber(session?.number || getNextTrainingNumber(sessions));
    setAttendance(session?.attendance || {});
    setAbsenceReasons(session?.absenceReasons || {});
  };

  const handleDateChange = (date) => {
    const safeDate = String(date || '').trim();

    if (!selectedSessionId) {
      setSelectedDate(safeDate);
      setTrainingNumber(getNextTrainingNumberForDate(sessions, safeDate));
      setAttendance({});
      setAbsenceReasons({});
      return;
    }

    openSession(safeDate);
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

    setAbsenceReasons((current) => {
      if (status === 'present') {
        if (!current[playerId]) {
          return current;
        }
        const next = { ...current };
        delete next[playerId];
        return next;
      }

      if (status === 'absent' && !current[playerId]) {
        return { ...current, [playerId]: 'otros' };
      }

      return current;
    });
  };

  const updateAbsenceReason = (playerId, reason) => {
    setAbsenceReasons((current) => ({
      ...current,
      [playerId]: reason,
    }));
  };

  const handleTrainingNumberChange = (number) => {
    const safeNumber = Math.max(1, Number(number) || 1);
    setTrainingNumber(safeNumber);
  };

  const startNewTraining = () => {
    const nextDate = today();
    setSelectedSessionId(null);
    setSelectedDate(nextDate);
    setTrainingNumber(getNextTrainingNumberForDate(sessions, nextDate));
    setAttendance({});
    setAbsenceReasons({});
    setShowTrainingHistory(false);

    window.requestAnimationFrame(() => {
      const dateInput = dateInputRef.current;
      if (!dateInput) {
        return;
      }

      if (typeof dateInput.showPicker === 'function') {
        try {
          dateInput.showPicker();
          return;
        } catch {
          // Fallback for browsers where showPicker is restricted.
        }
      }

      dateInput.focus();
      dateInput.click();
    });
  };

  const handleSave = (event) => {
    event.preventDefault();

    const safeCurrentNumber = Math.max(1, Number(trainingNumber) || 1);
    const maxNumberForDate = sessions
      .filter((training) => training.date === selectedDate)
      .reduce((highestNumber, training) => Math.max(highestNumber, Number(training.number) || 0), 0);

    onSaveTraining({
      id: selectedSession?.id,
      date: selectedDate,
      number: trainingNumber,
      attendance: Object.fromEntries(players
        .filter((player) => attendance[player.id] === 'present' || attendance[player.id] === 'absent')
        .map((player) => [player.id, attendance[player.id]])),
      absenceReasons: Object.fromEntries(players
        .filter((player) => attendance[player.id] === 'absent')
        .map((player) => [player.id, absenceReasons[player.id] || 'otros'])),
    });

    setSelectedSessionId(null);
    setTrainingNumber(Math.max(maxNumberForDate, safeCurrentNumber) + 1);
    setAttendance({});
    setAbsenceReasons({});
    setShowTrainingHistory(false);
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
            <input ref={dateInputRef} type="date" value={selectedDate} onChange={(event) => handleDateChange(event.target.value)} />
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
                  setAbsenceReasons(training.absenceReasons || {});
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
                    setAbsenceReasons(training.absenceReasons || {});
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
                {attendance[player.id] === 'absent' && (
                  <label className="absence-reason-select">
                    Motivo
                    <select
                      value={absenceReasons[player.id] || 'otros'}
                      onChange={(event) => updateAbsenceReason(player.id, event.target.value)}
                      aria-label={`Motivo de ausencia de ${getPlayerName(player)}`}
                    >
                      {ABSENCE_REASON_OPTIONS.map((reasonOption) => (
                        <option key={reasonOption.value} value={reasonOption.value}>{reasonOption.label}</option>
                      ))}
                    </select>
                  </label>
                )}
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
              <thead><tr><th>Jugadora</th><th>Asiste</th><th>Ausente</th><th>Motivo ausencias</th><th>Asistencia</th><th>Historial</th></tr></thead>
              <tbody>{stats.map((player) => <tr key={player.id}><td><strong>{player.number}</strong> {getPlayerName(player)}</td><td>{player.present}</td><td>{player.absent}</td><td>{player.absent > 0 ? player.absenceReasonSummary || 'Otros: 0' : '—'}</td><td><span className="attendance-progress"><i style={{ width: `${player.percentage}%` }} /></span><strong>{player.percentage}%</strong></td><td><button type="button" className={`player-history-button ${historyPlayerId === player.id ? 'active' : ''}`} onClick={() => setHistoryPlayerId((currentId) => currentId === player.id ? null : player.id)}>Historial</button></td></tr>)}</tbody>
            </table>

            {selectedHistoryPlayer && (
              <section className="player-timeline-panel" aria-label={`Historial de ${getPlayerName(selectedHistoryPlayer)}`}>
                <div className="player-timeline-header">
                  <h3>Historial: {selectedHistoryPlayer.number}. {getPlayerName(selectedHistoryPlayer)}</h3>
                  <button type="button" onClick={() => setHistoryPlayerId(null)}>Cerrar</button>
                </div>
                {selectedPlayerTimeline.length === 0 ? (
                  <p className="empty-state">No hay registros para esta jugadora.</p>
                ) : (
                  <div className="player-timeline-list">
                    {selectedPlayerTimeline.map((entry) => (
                      <article className="player-timeline-item" key={`${entry.id}-${entry.number}`}>
                        <strong>{entry.date} · Entreno {entry.number}</strong>
                        <span className={entry.status === 'present' ? 'timeline-status present' : 'timeline-status absent'}>
                          {entry.status === 'present' ? 'Asiste' : 'Ausente'}
                        </span>
                        <small>{entry.status === 'absent' ? `Motivo: ${entry.reason}` : 'Motivo: —'}</small>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </section>}
    </section>
  );
}
