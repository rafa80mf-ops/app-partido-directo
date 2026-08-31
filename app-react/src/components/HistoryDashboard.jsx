import { useEffect, useMemo, useState } from 'react';
import { translateUiText } from '../i18n/uiTranslator';
import FootballBall from './FootballBall';

function formatMinutes(seconds) {
  return Math.floor((Number(seconds) || 0) / 60);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}

function buildPlayerStats(matches) {
  const stats = new Map();

  matches.forEach((match) => {
    const players = [...(match.roster?.local || []), ...(match.roster?.bench || [])];
    const clubTeam = match.clubSide === 'visitor' ? 'visitor' : 'local';
    const fieldIds = new Set((match.roster?.local || []).map((player) => player.id));

    players.forEach((player) => {
      const key = `${player.number}-${player.name}`;
      const current = stats.get(key) || { key, number: player.number, name: player.name, minutes: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
      if (fieldIds.has(player.id)) current.minutes += formatMinutes(match.elapsedSeconds);
      stats.set(key, current);
    });

    (match.events || []).filter((event) => event.team === clubTeam).forEach((event) => {
      (event.players || []).forEach((eventPlayer) => {
        const key = `${eventPlayer.number}-${eventPlayer.name}`;
        const current = stats.get(key) || { key, number: eventPlayer.number, name: eventPlayer.name, minutes: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
        if (event.type === 'goal') current.goals += 1;
        if (event.type === 'assist') current.assists += 1;
        if (event.type === 'yellow') current.yellowCards += 1;
        if (event.type === 'red') current.redCards += 1;
        stats.set(key, current);
      });
    });
  });

  return [...stats.values()].sort((firstPlayer, secondPlayer) => (
    secondPlayer.goals - firstPlayer.goals
    || secondPlayer.assists - firstPlayer.assists
    || secondPlayer.minutes - firstPlayer.minutes
    || firstPlayer.number - secondPlayer.number
  ));
}

function getEventIcon(eventType) {
  return {
    goal: null,
    assist: '🅰️',
    yellow: '🟨',
    red: '🟥',
    substitution: '🔄',
    injury: '✚',
  }[eventType] || '•';
}

function normalizeMatchType(type) {
  const normalizedType = String(type || '').trim().toLowerCase();
  if (normalizedType === 'amistoso' || normalizedType === 'friendly') {
    return 'Amistoso';
  }
  return 'Liga';
}

function formatReportEventLabel(event) {
  return event.team === 'visitor' ? event.label.replace(/^#(\d+)/, '$1') : event.label;
}

function getEventMinuteLabel(event) {
  if (Number.isFinite(event?.elapsedSeconds)) {
    return `${Math.floor(event.elapsedSeconds / 60)}'`;
  }

  if (Number.isFinite(event?.minute)) {
    return `${Math.floor(event.minute)}'`;
  }

  return null;
}

function sortEventsByMatchTime(events) {
  return [...events].sort((firstEvent, secondEvent) => {
    const firstElapsed = Number(firstEvent?.elapsedSeconds);
    const secondElapsed = Number(secondEvent?.elapsedSeconds);

    if (Number.isFinite(firstElapsed) && Number.isFinite(secondElapsed)) {
      return firstElapsed - secondElapsed;
    }

    const firstCreatedAt = Date.parse(firstEvent?.createdAt || '') || 0;
    const secondCreatedAt = Date.parse(secondEvent?.createdAt || '') || 0;
    return firstCreatedAt - secondCreatedAt;
  });
}

function buildMatchReportText(match) {
  const lines = [];
  lines.push('ACTA DEL PARTIDO');
  lines.push('');
  lines.push(`${match.teams.local} ${match.scores.local} - ${match.scores.visitor} ${match.teams.visitor}`);
  lines.push(`Finalizado: ${match.finishedAt}`);

  const technicalStaff = Array.isArray(match.technicalStaff)
    ? match.technicalStaff.filter((member) => member?.name)
    : [];

  if (technicalStaff.length > 0) {
    lines.push('');
    lines.push('CUERPO TECNICO');
    technicalStaff.forEach((member) => {
      lines.push(`- ${formatTechnicalStaffRole(member.role)}: ${member.name}`);
    });
  }

  lines.push('');
  lines.push('EVENTOS');
  const sortedEvents = sortEventsByMatchTime(match.events || []);
  if (sortedEvents.length === 0) {
    lines.push('- Sin eventos registrados');
  } else {
    sortedEvents.forEach((event) => {
      const minuteLabel = getEventMinuteLabel(event) || "--'";
      lines.push(`- ${minuteLabel} ${formatReportEventLabel(event)}`);
    });
  }

  return lines.join('\n');
}

function formatTechnicalStaffRole(role) {
  return {
    ENTRENADOR: 'Entrenador/a',
    SEGUNDO_ENTRENADOR: 'Segundo entrenador/a',
    DELEGADO: 'Delegado/a',
    FISIO: 'Fisio',
    AUXILIAR: 'Auxiliar',
  }[String(role || '').toUpperCase()] || 'Auxiliar';
}

function normalizeTechnicalStaffForReport(rawTechnicalStaff) {
  if (Array.isArray(rawTechnicalStaff)) {
    return rawTechnicalStaff
      .map((member) => {
        if (!member || typeof member !== 'object') {
          return null;
        }

        const name = typeof member.name === 'string' ? member.name.trim() : '';
        if (!name) {
          return null;
        }

        return {
          id: member.id || `${member.role || 'AUXILIAR'}-${name}`,
          role: formatTechnicalStaffRole(member.role),
          name,
        };
      })
      .filter(Boolean);
  }

  if (typeof rawTechnicalStaff === 'string') {
    return rawTechnicalStaff
      .split('\n')
      .map((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          return null;
        }

        const [rawRole, ...rawName] = trimmedLine.split(':');
        const maybeName = rawName.join(':').trim();

        if (maybeName) {
          return {
            id: `staff-${index}`,
            role: rawRole.trim(),
            name: maybeName,
          };
        }

        return {
          id: `staff-${index}`,
          role: 'Auxiliar',
          name: trimmedLine,
        };
      })
      .filter(Boolean);
  }

  return [];
}

export default function HistoryDashboard({ matches, onEditMatch, onDeleteMatch, teamAppearance, clubCrest, appLanguage = 'es' }) {
  const [view, setView] = useState('reports');
  const [selectedMatchId, setSelectedMatchId] = useState(matches.at(-1)?.id || null);
  const [shareMessage, setShareMessage] = useState('');
  const [openCompetition, setOpenCompetition] = useState(() => (
    matches.some((match) => normalizeMatchType(match.type) === 'Liga') ? 'Liga' : 'Amistoso'
  ));
  const playerStats = useMemo(() => buildPlayerStats(matches), [matches]);
  const selectedMatch = matches.find((match) => match.id === selectedMatchId) || null;
  const selectedAppearance = selectedMatch?.teamAppearance || teamAppearance;
  const selectedEvents = selectedMatch?.events || [];
  const selectedTechnicalStaff = normalizeTechnicalStaffForReport(selectedMatch?.technicalStaff);
  const matchesByType = useMemo(() => ({
    Liga: [...matches].filter((match) => normalizeMatchType(match.type) === 'Liga').reverse(),
    Amistoso: [...matches].filter((match) => normalizeMatchType(match.type) === 'Amistoso').reverse(),
  }), [matches]);

  useEffect(() => {
    if (selectedMatchId && !matches.some((match) => match.id === selectedMatchId)) {
      setSelectedMatchId(matches.at(-1)?.id || null);
    }
  }, [matches, selectedMatchId]);

  const toggleCompetition = (type) => {
    setOpenCompetition((current) => {
      const isClosing = current === type;
      if (isClosing) {
        setSelectedMatchId(null);
      }
      return isClosing ? null : type;
    });
  };

  const handleShareReport = async (match) => {
    const text = buildMatchReportText(match);

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Acta ${match.teams.local} vs ${match.teams.visitor}`,
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setShareMessage('Acta compartida o copiada.');
    } catch {
      setShareMessage('No se pudo compartir el acta.');
    }
  };

  const handleDownloadReport = (match) => {
    const text = buildMatchReportText(match);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const fileName = `acta-${(match.teams.local || 'local').replace(/\s+/g, '-').toLowerCase()}-vs-${(match.teams.visitor || 'visitante').replace(/\s+/g, '-').toLowerCase()}.txt`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setShareMessage('Acta guardada en tu ordenador.');
  };

  const buildPlayerStatsText = () => [
    'ESTADÍSTICAS DEL EQUIPO',
    `${matches.length} partidos finalizados`,
    '',
    ...playerStats.map((player) => `${player.number}. ${player.name} | Minutos: ${player.minutes} | Goles: ${player.goals} | Asistencias: ${player.assists} | Amarillas: ${player.yellowCards} | Rojas: ${player.redCards}`),
  ].join('\n');

  const handleSharePlayerStats = async () => {
    try {
      const text = buildPlayerStatsText();
      if (navigator.share) {
        await navigator.share({ title: 'Estadísticas del equipo', text });
      } else {
        await navigator.clipboard.writeText(text);
      }
      setShareMessage('Estadísticas enviadas o copiadas.');
    } catch {
      setShareMessage('No se pudieron enviar las estadísticas.');
    }
  };

  const handleDownloadPlayerStats = () => {
    const blob = new Blob([buildPlayerStatsText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'estadisticas-equipo.txt';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setShareMessage('Estadísticas guardadas en tu ordenador.');
  };

  const handlePrintPlayerStats = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) {
      setShareMessage('No se pudo abrir la ventana de impresión.');
      return;
    }

    const rows = playerStats.map((player) => `<tr><td>${escapeHtml(`${player.number}. ${player.name}`)}</td><td>${player.minutes}</td><td>${player.goals}</td><td>${player.assists}</td><td>${player.yellowCards}</td><td>${player.redCards}</td></tr>`).join('');
    printWindow.document.write(`<!doctype html><html><head><title>Estadísticas del equipo</title><style>body{font-family:Arial,sans-serif;color:#172033;padding:24px}h1{font-size:22px;margin:0 0 4px}p{color:#475569;margin:0 0 20px}table{width:100%;border-collapse:collapse}th,td{padding:10px;border:1px solid #cbd5e1;text-align:left}th{background:#10231a;color:#fff}</style></head><body><h1>Estadísticas del equipo</h1><p>${matches.length} partidos finalizados</p><table><thead><tr><th>Jugadora</th><th>Min.</th><th>Goles</th><th>Asist.</th><th>Amar.</th><th>Rojas</th></tr></thead><tbody>${rows}</tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <section className="history-dashboard" aria-label="Historial" style={{ '--club-color': teamAppearance?.color || '#facc15', '--club-contrast': teamAppearance?.secondaryColor || '#111827' }}>
      <header className="section-heading">
        <div><h1>Historial</h1><p>Consulta las actas y el rendimiento de tu equipo.</p></div>
      </header>
      <div className="history-tabs" role="tablist" aria-label="Historial">
        <button type="button" className={view === 'reports' ? 'active' : ''} onClick={() => setView('reports')} role="tab" aria-selected={view === 'reports'}>Actas</button>
        <button type="button" className={view === 'stats' ? 'active' : ''} onClick={() => setView('stats')} role="tab" aria-selected={view === 'stats'}>Estadísticas</button>
      </div>
      {matches.length === 0 ? <p className="empty-state history-empty-state">Todavía no hay partidos finalizados.</p> : view === 'reports' ? (
        <div className="reports-layout">
          <aside className="report-match-list" aria-label="Partidos finalizados">
            {Object.entries(matchesByType).map(([type, typeMatches]) => (
              <section className="report-competition-group" key={type}>
                <button type="button" className="report-competition-toggle" onClick={() => toggleCompetition(type)} aria-expanded={openCompetition === type}>
                  <span><span className="competition-icon" aria-hidden="true">{type === 'Liga' ? <img src="/fcf-logo.svg" alt="" /> : <img src="/club-crest.svg" alt="" />}</span>{type === 'Liga' ? 'Liga' : 'Amistosos'} ({typeMatches.length})</span><span aria-hidden="true">{openCompetition === type ? '⌃' : '⌄'}</span>
                </button>
                {openCompetition === type && typeMatches.length === 0 && <p className="empty-state report-empty-competition">Sin actas en esta competición.</p>}
                {openCompetition === type && typeMatches.map((match) => <button key={match.id} type="button" className={selectedMatch?.id === match.id ? 'active' : ''} onClick={() => setSelectedMatchId(match.id)}><strong>{match.teams.local} {match.scores.local} - {match.scores.visitor} {match.teams.visitor}</strong><span>🗓️ {match.finishedAt}</span></button>)}
              </section>
            ))}
          </aside>
          {selectedMatch ? <article className="match-report">
            <div className="match-report-heading"><div><span className="report-competition-badge">{normalizeMatchType(selectedMatch.type) === 'Amistoso' ? <><img src="/club-crest.svg" alt="" /> Amistoso</> : <><img src="/fcf-logo.svg" alt="" /> Liga</>}</span><h2>{selectedMatch.teams.local} {selectedMatch.scores.local} - {selectedMatch.scores.visitor} {selectedMatch.teams.visitor}</h2><p>🗓️ {selectedMatch.finishedAt}</p></div><div className="match-report-actions"><button type="button" className="icon-report-button edit-report-button" onClick={() => onEditMatch(selectedMatch)} title="Modificar acta" aria-label="Modificar acta">✎</button><button type="button" className="icon-report-button share-report-button" onClick={() => handleShareReport(selectedMatch)} title="Enviar acta" aria-label="Enviar acta">↗</button><button type="button" className="icon-report-button download-report-button" onClick={() => handleDownloadReport(selectedMatch)} title="Guardar acta" aria-label="Guardar acta">⬇</button><button type="button" className="icon-report-button delete-report-button" onClick={() => { if (window.confirm(translateUiText('¿Borrar esta acta?', appLanguage))) onDeleteMatch(selectedMatch.id); }} title="Borrar acta" aria-label="Borrar acta">⌫</button></div></div>
            {selectedTechnicalStaff.length > 0 && <>
              <h3 className="report-title">Cuerpo técnico</h3>
              <ul className="report-staff-list">
                {selectedTechnicalStaff.map((member) => <li key={member.id}><strong>{member.role}:</strong> <span>{member.name}</span></li>)}
              </ul>
            </>}
            <h3 className="report-title">Acta</h3>
            {selectedEvents.length === 0 ? <p className="empty-state">No hay acciones registradas.</p> : <ol className="report-event-list">{sortEventsByMatchTime(selectedEvents).map((event) => <li key={event.id} className={`${event.team === 'visitor' ? 'visitor-event' : 'local-event'} ${event.type === 'yellow' ? 'yellow-card-event' : ''}`}><span className="report-event-minute">{getEventMinuteLabel(event) || "--'"}</span><span className={`report-event-icon ${event.type === 'yellow' ? 'yellow-card-icon' : ''} ${event.type === 'injury' ? 'injury-event-icon' : ''} ${event.team === 'visitor' ? 'visitor-action-icon' : 'local-action-icon'} ${event.team === 'local' && selectedAppearance?.shape === 'shirt' ? 'appearance-shirt' : ''}`} style={event.team === 'local' ? { '--team-color': selectedAppearance?.color || '#facc15' } : undefined} aria-hidden="true">{event.type === 'goal' ? <FootballBall className="event-ball" /> : getEventIcon(event.type)}</span><span>{formatReportEventLabel(event)}</span></li>)}</ol>}
          </article> : <div className="empty-match-report" aria-label="Ninguna acta seleccionada"><img src={clubCrest?.trim() || '/club-crest.svg'} alt="Escudo del club" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/club-crest.svg'; }} /></div>}
        </div>
      ) : (
        <section className="player-stats-panel">
          <div className="match-report-heading">
            <div><h2>Estadísticas del equipo</h2><p>{matches.length} partidos finalizados</p></div>
            <div className="match-report-actions">
              <button type="button" className="icon-report-button" onClick={handlePrintPlayerStats} title="Imprimir estadísticas" aria-label="Imprimir estadísticas">🖨</button>
              <button type="button" className="icon-report-button share-report-button" onClick={handleSharePlayerStats} title="Enviar estadísticas" aria-label="Enviar estadísticas">↗</button>
              <button type="button" className="icon-report-button download-report-button" onClick={handleDownloadPlayerStats} title="Guardar estadísticas" aria-label="Guardar estadísticas">⬇</button>
            </div>
          </div>
          <div className="stats-table-wrap"><table className="stats-table"><thead><tr><th>Jugadora</th><th>Min.</th><th>Goles</th><th>Asist.</th><th>Amar.</th><th>Rojas</th></tr></thead><tbody>{playerStats.map((player) => <tr key={player.key}><td><strong>{player.number}</strong> {player.name}</td><td>{player.minutes}</td><td>{player.goals}</td><td>{player.assists}</td><td>{player.yellowCards}</td><td>{player.redCards}</td></tr>)}</tbody></table></div>
        </section>
      )}
      {shareMessage && <p className="selection-count" role="status">{shareMessage}</p>}
    </section>       
     );
}