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

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
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

export default function TrainingDashboard({ roster, trainingSessions = [], teamAppearance, onSaveTraining, onDeleteTraining, appLanguage = 'es' }) {
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
  const [statsMessage, setStatsMessage] = useState('');

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
    const nextDate = today();

    setSelectedSessionId(null);
    setSelectedDate(nextDate);
    setTrainingNumber(Math.max(maxNumberForDate, safeCurrentNumber) + 1);
    setAttendance({});
    setAbsenceReasons({});
    setShowTrainingHistory(false);

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
  };

  const buildTrainingStatsText = () => [
    'Estadística de asistencia',
    `${sessions.length} sesiones guardadas`,
    '',
    ...stats.map((player) => (
      `${player.number}. ${getPlayerName(player)} | Asiste: ${player.present} | Ausente: ${player.absent} | Asistencia: ${player.percentage}%${player.absent > 0 ? ` | Motivos: ${player.absenceReasonSummary || 'Otros'}` : ''}`
    )),
  ].join('\n');

  const handleShareStats = async () => {
    const text = buildTrainingStatsText();

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Estadística de asistencia', text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setStatsMessage('Estadística enviada o copiada.');
    } catch {
      setStatsMessage('No se pudo enviar la estadística.');
    }
  };

  const handleDownloadStats = () => {
    const blob = new Blob([buildTrainingStatsText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estadistica-entrenos.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatsMessage('Estadística guardada en tu ordenador.');
  };

  const handlePrintStats = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      setStatsMessage('No se pudo abrir la ventana de impresión.');
      return;
    }

    const rows = stats.map((player) => `<tr><td>${escapeHtml(`${player.number}. ${getPlayerName(player)}`)}</td><td>${player.present}</td><td>${player.absent}</td><td>${escapeHtml(player.absent > 0 ? player.absenceReasonSummary || 'Otros' : '—')}</td><td>${player.percentage}%</td></tr>`).join('');
    printWindow.document.write(`<!doctype html><html><head><title>Estadística de asistencia</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:24px}h1{font-size:22px;margin:0 0 4px}p{color:#475569;margin:0 0 20px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #cbd5e1;text-align:left}th{background:#10231a;color:#fff}</style></head><body><h1>Estadística de asistencia</h1><p>${sessions.length} sesiones guardadas</p><table><thead><tr><th>Jugadora</th><th>Asiste</th><th>Ausente</th><th>Motivo ausencias</th><th>Asistencia</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const buildPlayerHistoryText = () => {
    if (!selectedHistoryPlayer) {
      return '';
    }

    const playerStats = stats.find((player) => player.id === selectedHistoryPlayer.id);
    return [
      `Historial de entrenos: ${selectedHistoryPlayer.number}. ${getPlayerName(selectedHistoryPlayer)}`,
      `Asistencia: ${playerStats?.percentage || 0}% | Asiste: ${playerStats?.present || 0} | Ausente: ${playerStats?.absent || 0}`,
      '',
      ...selectedPlayerTimeline.map((entry) => `${entry.date} | Entreno ${entry.number} | ${entry.status === 'present' ? 'Asiste' : `Ausente (${entry.reason})`}`),
    ].join('\n');
  };

  const handleSharePlayerHistory = async () => {
    try {
      const text = buildPlayerHistoryText();
      if (navigator.share) {
        await navigator.share({ title: `Historial de ${getPlayerName(selectedHistoryPlayer)}`, text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setStatsMessage('Historial enviado o copiado.');
    } catch {
      setStatsMessage('No se pudo enviar el historial.');
    }
  };

  const handleDownloadPlayerHistory = () => {
    const blob = new Blob([buildPlayerHistoryText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial-entrenos-${getPlayerName(selectedHistoryPlayer).replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatsMessage('Historial guardado en tu ordenador.');
  };

  const handlePrintPlayerHistory = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow || !selectedHistoryPlayer) {
      setStatsMessage('No se pudo abrir la ventana de impresión.');
      return;
    }

    const rows = selectedPlayerTimeline.map((entry) => `<tr><td>${escapeHtml(entry.date)}</td><td>${entry.number}</td><td>${entry.status === 'present' ? 'Asiste' : 'Ausente'}</td><td>${escapeHtml(entry.status === 'absent' ? entry.reason : '—')}</td></tr>`).join('');
    const playerStats = stats.find((player) => player.id === selectedHistoryPlayer.id);
    printWindow.document.write(`<!doctype html><html><head><title>Historial de entrenos</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:24px}h1{font-size:22px;margin:0 0 4px}p{color:#475569;margin:0 0 20px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #cbd5e1;text-align:left}th{background:#10231a;color:#fff}</style></head><body><h1>Historial de ${escapeHtml(`${selectedHistoryPlayer.number}. ${getPlayerName(selectedHistoryPlayer)}`)}</h1><p>Asistencia: ${playerStats?.percentage || 0}%</p><table><thead><tr><th>Día</th><th>Entreno</th><th>Estado</th><th>Motivo</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="training-dashboard" aria-label="Entrenos" style={{ '--club-color': teamAppearance?.color || '#facc15', '--club-contrast': teamAppearance?.secondaryColor || '#111827' }}>
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
          <div className="training-stats-actions">
            <strong>{sessions.length} sesiones</strong>
            {sessions.length > 0 && <div>
              <button type="button" onClick={handlePrintStats} title="Imprimir estadística" aria-label="Imprimir estadística">🖨</button>
              <button type="button" onClick={handleShareStats} title="Enviar estadística" aria-label="Enviar estadística">↗</button>
              <button type="button" onClick={handleDownloadStats} title="Guardar estadística" aria-label="Guardar estadística">⬇</button>
            </div>}
          </div>
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
                  <div className="training-stats-actions">
                    <div>
                      <button type="button" onClick={handlePrintPlayerHistory} title="Imprimir historial" aria-label="Imprimir historial">🖨</button>
                      <button type="button" onClick={handleSharePlayerHistory} title="Enviar historial" aria-label="Enviar historial">↗</button>
                      <button type="button" onClick={handleDownloadPlayerHistory} title="Guardar historial" aria-label="Guardar historial">⬇</button>
                    </div>
                    <button type="button" className="player-history-close" onClick={() => setHistoryPlayerId(null)} title="Cerrar historial" aria-label="Cerrar historial">×</button>
                  </div>
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
        {statsMessage && <p className="selection-count" role="status">{statsMessage}</p>}
      </section>}
    </section>
  );
}
