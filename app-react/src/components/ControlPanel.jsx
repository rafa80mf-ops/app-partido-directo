import FootballBall from './FootballBall';

import { useState } from 'react';

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
  onGoal,
  onAssist,
  onCard,
  onFinalize,
  onSubstitution,
  onFoul,
  onPenalty,
  onOffside,
  onCorner,
  onEditNumber,
  onShotOnGoal,
  onShot,
  onClearChanceCreated,
  onClearChanceMissed,
  onBallLoss,
  onCrosses,
  onBallRecovery,
  onClearance,
  onErrorGoal,
  onErrorChance,
  onSaves,
  onOneOnOneWon,
  selectingInjured,
  onInitiateInjury,
  onInitiateYellowCard,
  teamAppearance,
}) {
  const buttonBaseClass = 'action-button';
  const [localActionsOpen, setLocalActionsOpen] = useState(false);
  const [visitorActionsOpen, setVisitorActionsOpen] = useState(false);

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
          <button type="button" className={buttonBaseClass} onClick={() => onGoal('local')}><FootballBall /> Gol</button>
          <button type="button" className={buttonBaseClass} onClick={() => onAssist('local')}>🅰️ Asistencia</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('local', 'yellow')}>🟨 Amarilla</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('local', 'red')}>🟥 Roja</button>
          <button type="button" className={buttonBaseClass} onClick={() => onSubstitution('local')}>🔄 Cambio</button>
          <button type="button" className={buttonBaseClass} onClick={onInitiateInjury}><span className="injury-cross">✚</span> Lesión</button>
          <button type="button" className={buttonBaseClass} onClick={() => onFoul('local')}>⚠️ Falta</button>
          <button type="button" className={buttonBaseClass} onClick={() => onPenalty('local')}>🔫 Penalti</button>
          <button type="button" className={buttonBaseClass} onClick={() => onOffside('local')}>📍 Fuera de juego</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCorner('local')}>🚩 Saque de esquina</button>
          <button type="button" className={buttonBaseClass} onClick={() => onEditNumber('local')}>🏷️ Dorsal</button>
          <button type="button" className={buttonBaseClass} onClick={() => onShotOnGoal('local')}>🎯 Tiro a puerta</button>
          <button type="button" className={buttonBaseClass} onClick={() => onShot('local')}>🔫 Tiros</button>
          <button type="button" className={buttonBaseClass} onClick={() => onClearChanceCreated('local')}>⚡ Ocasión clara creada</button>
          <button type="button" className={buttonBaseClass} onClick={() => onClearChanceMissed('local')}>❌ Ocasión clara fallada</button>
          <button type="button" className={buttonBaseClass} onClick={() => onBallLoss('local')}>💧 Pérdida de balón</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCrosses('local')}>➡️ Centros</button>
          <button type="button" className={buttonBaseClass} onClick={() => onBallRecovery('local')}>🔄 Balón recuperado</button>
          <button type="button" className={buttonBaseClass} onClick={() => onClearance('local')}>🛡️ Despejes</button>
          <button type="button" className={buttonBaseClass} onClick={() => onErrorGoal('local')}>💔 Error provoca gol</button>
          <button type="button" className={buttonBaseClass} onClick={() => onErrorChance('local')}>⚠️ Error provoca ocasión</button>
          <button type="button" className={buttonBaseClass} onClick={() => onSaves('local')}>🧤 Paradas</button>
          <button type="button" className={buttonBaseClass} onClick={() => onOneOnOneWon('local')}>💪 Uno contra uno ganado</button>
        </div>
      )}

      {visitorActionsOpen && (
        <div className="team-actions-panel visitor-actions-panel">
          <button type="button" className={buttonBaseClass} onClick={() => onGoal('visitor')}><FootballBall /> Gol visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onAssist('visitor')}>🅰️ Asistencia visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('visitor', 'yellow')}>🟨 Amarilla visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('visitor', 'red')}>🟥 Roja visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onSubstitution('visitor')}>🔄 Cambio visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onFoul('visitor')}>⚠️ Falta visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onPenalty('visitor')}>🔫 Penalti visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onOffside('visitor')}>📍 Fuera de juego visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCorner('visitor')}>🚩 Saque de esquina visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onEditNumber('visitor')}>🏷️ Dorsal visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onShotOnGoal('visitor')}>🎯 Tiro a puerta visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onShot('visitor')}>🔫 Tiros visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onClearChanceCreated('visitor')}>⚡ Ocasión clara creada visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onClearChanceMissed('visitor')}>❌ Ocasión clara fallada visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onBallLoss('visitor')}>💧 Pérdida de balón visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCrosses('visitor')}>➡️ Centros visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onBallRecovery('visitor')}>🔄 Balón recuperado visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onClearance('visitor')}>🛡️ Despejes visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onErrorGoal('visitor')}>💔 Error provoca gol visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onErrorChance('visitor')}>⚠️ Error provoca ocasión visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onSaves('visitor')}>🧤 Paradas visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onOneOnOneWon('visitor')}>💪 Uno contra uno ganado visitante</button>
        </div>
      )}

    </section>
  );
}
