import { useState } from 'react';

export default function ControlPanel({
  isRunning,
  elapsedSeconds,
  lineupConfirmed,
  onStartMatch,
  onToggleRunning,
  onPause,
  onReset,
  onGoal,
  onAssist,
  onCard,
  onFinalize,
  onSubstitution,
  selectingInjured,
  onInitiateInjury,
  onInitiateYellowCard,
  onPlaceVisitorTeam,
  onRemoveVisitorTeam,
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
              {isRunning ? '▶️ En curso' : elapsedSeconds > 0 ? '▶️ Continuar' : '▶️ Iniciar'}
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
      </div>

      <button
        type="button"
        className="team-actions-toggle local-actions-toggle"
        onClick={() => setLocalActionsOpen((isOpen) => !isOpen)}
        aria-expanded={localActionsOpen}
      >
        <span>🟢 Acciones mi equipo</span>
        <span>{localActionsOpen ? '▴' : '▾'}</span>
      </button>

      <button
        type="button"
        className="team-actions-toggle visitor-actions-toggle"
        onClick={() => setVisitorActionsOpen((isOpen) => !isOpen)}
        aria-expanded={visitorActionsOpen}
      >
        <span>🔵 Acciones visitante</span>
        <span>{visitorActionsOpen ? '▴' : '▾'}</span>
      </button>

      {localActionsOpen && (
        <div className="team-actions-panel local-actions-panel">
          <button type="button" className={buttonBaseClass} onClick={() => onGoal('local')}>⚽ Gol</button>
          <button type="button" className={buttonBaseClass} onClick={() => onAssist('local')}>🅰️ Asistencia</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('local', 'yellow')}>🟨 Amarilla</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('local', 'red')}>🟥 Roja</button>
          <button type="button" className={buttonBaseClass} onClick={() => onSubstitution('local')}>🔄 Cambio</button>
          <button type="button" className={buttonBaseClass} onClick={onInitiateInjury}>🩹 Lesión</button>
        </div>
      )}

      {visitorActionsOpen && (
        <div className="team-actions-panel visitor-actions-panel">
          <button type="button" className={buttonBaseClass} onClick={() => onGoal('visitor')}>⚽ Gol visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onAssist('visitor')}>🅰️ Asistencia visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('visitor', 'yellow')}>🟨 Amarilla visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('visitor', 'red')}>🟥 Roja visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onSubstitution('visitor')}>🔄 Cambio visitante</button>
          <button type="button" className={buttonBaseClass} onClick={onPlaceVisitorTeam}>🧍 Colocar equipo visitante</button>
          <button type="button" className={buttonBaseClass} onClick={onRemoveVisitorTeam}>🚫 Retirar equipo visitante</button>
        </div>
      )}

    </section>
  );
}
