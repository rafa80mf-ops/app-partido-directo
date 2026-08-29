import { useState } from 'react';
import FootballBall from './FootballBall';

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
}) {
  const buttonBaseClass = 'action-button';
  const [localActionsOpen, setLocalActionsOpen] = useState(false);
  const [visitorActionsOpen, setVisitorActionsOpen] = useState(false);

  const isSelected = (type) => enabledPlayerActions.includes(type);

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
        className="team-actions-toggle local-actions-toggle"
        onClick={() => setLocalActionsOpen((isOpen) => !isOpen)}
        aria-expanded={localActionsOpen}
        style={{ '--team-color': teamAppearance?.color || '#facc15' }}
      >
        <span><i className="team-actions-marker" aria-hidden="true" /> Acciones mi equipo</span>
        <span>{localActionsOpen ? '▴' : '▾'}</span>
      </button>

      <button
        type="button"
        className="team-actions-toggle visitor-actions-toggle"
        onClick={() => setVisitorActionsOpen((isOpen) => !isOpen)}
        aria-expanded={visitorActionsOpen}
      >
        <span><i className="team-actions-marker visitor" aria-hidden="true" /> Acciones visitante</span>
        <span>{visitorActionsOpen ? '▴' : '▾'}</span>
      </button>

      {localActionsOpen && (
        <div className="team-actions-panel local-actions-panel">
          {renderActionButton('local', 'goal', 'Gol', <FootballBall />)}
          {renderActionButton('local', 'assist', 'Asistencia', '🅰️')}
          {renderActionButton('local', 'yellow', 'Amarilla', '🟨')}
          {renderActionButton('local', 'red', 'Roja', '🟥')}
          {renderActionButton('local', 'substitution', 'Cambio', '🔄')}
          {renderActionButton('local', 'injury', 'Lesión', <span className="injury-cross">✚</span>)}
          {renderActionButton('local', 'foul', 'Falta', '⚠️')}
          {renderActionButton('local', 'penalty', 'Penalti', '🔫')}
          {renderActionButton('local', 'offside', 'Fuera de juego', '📍')}
          {renderActionButton('local', 'corner', 'Saque de esquina', '🚩')}
          {renderActionButton('local', 'edit-number', 'Dorsal', '🏷️')}
          {renderActionButton('local', 'shot-on-goal', 'Tiro a puerta', '🎯')}
          {renderActionButton('local', 'shot', 'Tiros', '🔫')}
          {renderActionButton('local', 'clear-chance-created', 'Ocasión clara creada', '⚡')}
          {renderActionButton('local', 'clear-chance-missed', 'Ocasión clara fallada', '❌')}
          {renderActionButton('local', 'ball-loss', 'Pérdida de balón', '💧')}
          {renderActionButton('local', 'crosses', 'Centros', '➡️')}
          {renderActionButton('local', 'ball-recovery', 'Balón recuperado', '🔄')}
          {renderActionButton('local', 'clearance', 'Despejes', '🛡️')}
          {renderActionButton('local', 'error-goal', 'Error provoca gol', '💔')}
          {renderActionButton('local', 'error-chance', 'Error provoca ocasión', '⚠️')}
          {renderActionButton('local', 'saves', 'Paradas', '🧤')}
          {renderActionButton('local', 'one-on-one-won', 'Uno contra uno ganado', '💪')}
        </div>
      )}

      {visitorActionsOpen && (
        <div className="team-actions-panel visitor-actions-panel">
          {renderActionButton('visitor', 'goal', 'Gol visitante', <FootballBall />)}
          {renderActionButton('visitor', 'assist', 'Asistencia visitante', '🅰️')}
          {renderActionButton('visitor', 'yellow', 'Amarilla visitante', '🟨')}
          {renderActionButton('visitor', 'red', 'Roja visitante', '🟥')}
          {renderActionButton('visitor', 'substitution', 'Cambio visitante', '🔄')}
          {renderActionButton('visitor', 'foul', 'Falta visitante', '⚠️')}
          {renderActionButton('visitor', 'penalty', 'Penalti visitante', '🔫')}
          {renderActionButton('visitor', 'offside', 'Fuera de juego visitante', '📍')}
          {renderActionButton('visitor', 'corner', 'Saque de esquina visitante', '🚩')}
          {renderActionButton('visitor', 'edit-number', 'Dorsal visitante', '🏷️')}
          {renderActionButton('visitor', 'shot-on-goal', 'Tiro a puerta visitante', '🎯')}
          {renderActionButton('visitor', 'shot', 'Tiros visitante', '🔫')}
          {renderActionButton('visitor', 'clear-chance-created', 'Ocasión clara creada visitante', '⚡')}
          {renderActionButton('visitor', 'clear-chance-missed', 'Ocasión clara fallada visitante', '❌')}
          {renderActionButton('visitor', 'ball-loss', 'Pérdida de balón visitante', '💧')}
          {renderActionButton('visitor', 'crosses', 'Centros visitante', '➡️')}
          {renderActionButton('visitor', 'ball-recovery', 'Balón recuperado visitante', '🔄')}
          {renderActionButton('visitor', 'clearance', 'Despejes visitante', '🛡️')}
          {renderActionButton('visitor', 'error-goal', 'Error provoca gol visitante', '💔')}
          {renderActionButton('visitor', 'error-chance', 'Error provoca ocasión visitante', '⚠️')}
          {renderActionButton('visitor', 'saves', 'Paradas visitante', '🧤')}
          {renderActionButton('visitor', 'one-on-one-won', 'Uno contra uno ganado visitante', '💪')}
        </div>
      )}
    </section>
  );
}
