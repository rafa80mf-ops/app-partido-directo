import { useState } from 'react';
import FootballBall from './FootballBall';
import { ACTION_GROUPS, PLAYER_ACTIONS } from '../data/actionCatalog';

export default function ControlPanel({
  isRunning,
  elapsedSeconds,
  lineupConfirmed,
  onStartMatch,
  onToggleRunning,
  onPause,
  onEndFirstHalf,
  onStartSecondHalf,
  onAdvanceFiveMinutes,
  onReset,
  enabledPlayerActions = [],
  onTogglePlayerAction = () => {},
  onFinalize,
  selectingInjured,
  onInitiateInjury,
  teamAppearance,
  eventsOpen,
  onToggleEvents,
}) {
  const buttonBaseClass = 'action-button';
  const [localActionsOpen, setLocalActionsOpen] = useState(false);
  const [visitorActionsOpen, setVisitorActionsOpen] = useState(false);

  const orderedActions = [...PLAYER_ACTIONS];
  const isSelected = (type) => enabledPlayerActions.includes(type);

  const renderActionGroup = (team, groupTypes, groupTitle, isVisitor = false) => {
    const groupActions = orderedActions.filter((action) => groupTypes.includes(action.type));
    if (groupActions.length === 0) {
      return null;
    }

    const icons = {
      goal: '⚽',
      assist: '🅰️',
      'shot-on-goal': '🎯',
      shot: '🔫',
      'clear-chance-created': '⚡',
      'clear-chance-missed': '❌',
      'key-pass': '🟢',
      dribble: '🏃',
      crosses: '➡️',
      'completed-passes': '✅',
      'ball-loss': '💧',
      offside: '📍',
      interception: '🛡️',
      tackle: '🥊',
      'defensive-duel-won': '✅',
      'defensive-duel-lost': '❌',
      'ball-recovery': '🔄',
      clearance: '🧱',
      block: '🚧',
      'recovery-opposition': '📈',
      'error-goal': '💔',
      'error-chance': '⚠️',
      saves: '🧤',
      'shots-faced': '🎯',
      'goals-conceded': '🧨',
      'save-rate': '📊',
      'clean-sheet': '🧤',
      'one-on-one-won': '💪',
      yellow: '🟨',
      'second-yellow': '🟨',
      red: '🟥',
      foul: '⚠️',
      'fouls-received': '🤝',
      penalty: '🔫',
      'penalty-awarded': '📣',
      injury: <span className="injury-cross">✚</span>,
      substitution: '🔄',
      'edit-number': '🏷️',
    };

    const labels = {
      goal: 'Gol',
      assist: 'Asistencia',
      'shot-on-goal': 'Tiro a puerta',
      shot: 'Tiros',
      'clear-chance-created': 'Ocasión clara creada',
      'clear-chance-missed': 'Ocasión clara fallada',
      'key-pass': 'Pases clave',
      dribble: 'Regates',
      crosses: 'Centros',
      'completed-passes': 'Pases completados',
      'ball-loss': 'Pérdidas de balón',
      offside: 'Fuera de juego',
      interception: 'Intercepciones',
      tackle: 'Entradas',
      'defensive-duel-won': 'Duelos defensivos ganados',
      'defensive-duel-lost': 'Duelos defensivos perdidos',
      'ball-recovery': 'Balones recuperados',
      clearance: 'Despejes',
      block: 'Bloqueos',
      'recovery-opposition': 'Recuperaciones en campo rival',
      'error-goal': 'Error provoca gol',
      'error-chance': 'Error provoca ocasión',
      saves: 'Paradas',
      'shots-faced': 'Tiros recibidos',
      'goals-conceded': 'Goles encajados',
      'save-rate': '% de paradas',
      'clean-sheet': 'Portería a cero',
      'one-on-one-won': '1 contra 1 ganados',
      yellow: isVisitor ? 'Amarilla visitante' : 'Amarilla',
      'second-yellow': isVisitor ? 'Segunda amarilla visitante' : 'Segunda amarilla',
      red: isVisitor ? 'Roja visitante' : 'Roja',
      foul: isVisitor ? 'Faltas cometidas visitante' : 'Faltas cometidas',
      'fouls-received': isVisitor ? 'Faltas recibidas visitante' : 'Faltas recibidas',
      penalty: isVisitor ? 'Penaltis cometidos visitante' : 'Penaltis cometidos',
      'penalty-awarded': isVisitor ? 'Penaltis recibidos visitante' : 'Penaltis recibidos',
      injury: isVisitor ? 'Lesión visitante' : 'Lesión',
      substitution: isVisitor ? 'Cambio visitante' : 'Cambio',
      'edit-number': isVisitor ? 'Dorsal visitante' : 'Dorsal',
    };

    return (
      <div key={groupTitle} className="team-actions-group">
        <h4>{groupTitle}</h4>
        <div className="team-actions-panel-group">
          {groupActions.map((action) => renderActionButton(team, action.type, labels[action.type], icons[action.type] ?? '•'))}
        </div>
      </div>
    );
  };

  const renderActionButton = (team, type, label, icon) => {
    const active = isSelected(type);
    return (
      <button
        type="button"
        className={`${buttonBaseClass} ${active ? 'selected-action-btn' : ''}`}
        onClick={() => onTogglePlayerAction(type)}
        aria-pressed={active}
      >
        <span>
          {icon} {label} {active && <span className="check-badge">✓</span>}
        </span>
      </button>
    );
  };

  return (
    <section className="controls-panel" aria-label="Panel de control del partido">
      <div className="control-row match-start-controls">
        {!lineupConfirmed ? (
          <button type="button" className={`${buttonBaseClass} start-match-button`} onClick={onStartMatch}>
            ▶️ Iniciar nuevo partido
          </button>
        ) : (
          <>
            <button type="button" className={buttonBaseClass} onClick={onToggleRunning}>
              {isRunning ? '▶️ En curso' : elapsedSeconds > 0 ? '▶️ Continuar' : '▶️ Iniciar partido'}
            </button>
            <button type="button" className={`${buttonBaseClass} pause-button`} onClick={onPause} disabled={!isRunning}>
              ⏸️ Pausar
            </button>
          </>
        )}
        <button type="button" className={buttonBaseClass} onClick={onReset}>
          ⟲ Reiniciar
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={onFinalize}>
          🏁 Finalizar partido
        </button>
        <button type="button" className={`${buttonBaseClass} first-half-button`} onClick={onEndFirstHalf} disabled={!lineupConfirmed}>
          ⏱️ Fin 1ª parte
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={`${buttonBaseClass} second-half-button`} onClick={onStartSecondHalf} disabled={!lineupConfirmed}>
          ▶️ Iniciar 2ª parte (45:00)
        </button>
        <button type="button" className={`${buttonBaseClass} test-time-button`} onClick={onAdvanceFiveMinutes} disabled={!lineupConfirmed}>
          ⏩ +5 min (prueba)
        </button>
      </div>

      <button
        type="button"
        className="events-toggle-button"
        onClick={onToggleEvents}
        aria-expanded={eventsOpen}
      >
        <span>📋 Acta</span>
        <span aria-hidden="true">{eventsOpen ? '▴' : '▾'}</span>
      </button>

      <button
        type="button"
        className="team-actions-toggle local-actions-toggle"
        onClick={() => setLocalActionsOpen((isOpen) => !isOpen)}
        aria-expanded={localActionsOpen}
        style={{ '--team-color': teamAppearance?.color || '#facc15' }}
      >
        <span><i className="team-actions-marker" aria-hidden="true" /> Seleccionar acciones mi equipo</span>
        <span>{localActionsOpen ? '▴' : '▾'}</span>
      </button>

      <button
        type="button"
        className="team-actions-toggle visitor-actions-toggle"
        onClick={() => setVisitorActionsOpen((isOpen) => !isOpen)}
        aria-expanded={visitorActionsOpen}
      >
        <span><i className="team-actions-marker visitor" aria-hidden="true" /> Seleccionar acciones visitante</span>
        <span>{visitorActionsOpen ? '▴' : '▾'}</span>
      </button>

      {localActionsOpen && (
        <div className="team-actions-panel local-actions-panel">
          {ACTION_GROUPS.map((group) => renderActionGroup('local', group.types, group.title, false))}
        </div>
      )}

      {visitorActionsOpen && (
        <div className="team-actions-panel visitor-actions-panel">
          {ACTION_GROUPS.map((group) => renderActionGroup('visitor', group.types, group.title, true))}
        </div>
      )}

    </section>
  );
}
