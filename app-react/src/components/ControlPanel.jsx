import { useState } from 'react';

export default function ControlPanel({
  isRunning,
  localScore,
  visitorScore,
  onToggleRunning,
  onReset,
  onGoal,
  onAssist,
  onCard,
  onToggleRoster,
  onOpenCalendar,
  onFinalize,
  onOpenHistory,
  onOpenTacticsBoard,
  onSubstitution,
  onManualScoreChange,
  selectingInjured,
  onInitiateInjury,
  onInitiateYellowCard,
  onPlaceVisitorTeam,
  onRemoveVisitorTeam,
}) {
  const buttonBaseClass = 'action-button';
  const [visitorActionsOpen, setVisitorActionsOpen] = useState(false);

  return (
    <section className="controls-panel" aria-label="Panel de control del partido">
      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={onToggleRunning}>
          {isRunning ? '⏸️ Pausa' : '▶️ Iniciar'}
        </button>
        <button type="button" className={buttonBaseClass} onClick={onReset}>
          ⟲ Reiniciar
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={onToggleRoster}>
          📋 Plantilla
        </button>
        <button type="button" className={buttonBaseClass} onClick={onOpenTacticsBoard}>
          🧠 Pizarra
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={onOpenCalendar}>
          📅 Calendario
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={onFinalize}>
          🏁 Finalizar partido
        </button>
        <button type="button" className={buttonBaseClass} onClick={onOpenHistory}>
          📚 Historial
        </button>
      </div>

      <button
        type="button"
        className="visitor-actions-toggle"
        onClick={() => setVisitorActionsOpen((isOpen) => !isOpen)}
        aria-expanded={visitorActionsOpen}
      >
        <span>⚽ Acciones visitante</span>
        <span>{visitorActionsOpen ? '▴' : '▾'}</span>
      </button>

      {visitorActionsOpen && (
        <div className="visitor-actions-panel">
          <button type="button" className={buttonBaseClass} onClick={() => onGoal('visitor')}>⚽ Gol visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onAssist('visitor')}>🅰️ Asistencia visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('visitor', 'yellow')}>🟨 Amarilla visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onCard('visitor', 'red')}>🟥 Roja visitante</button>
          <button type="button" className={buttonBaseClass} onClick={() => onSubstitution('visitor')}>🔄 Cambio visitante</button>
          <button type="button" className={buttonBaseClass} onClick={onPlaceVisitorTeam}>🧍 Colocar equipo visitante</button>
          <button type="button" className={buttonBaseClass} onClick={onRemoveVisitorTeam}>🚫 Retirar equipo visitante</button>
        </div>
      )}

      <div className="manual-scores">
        <label>
          Local
          <input
            type="number"
            min="0"
            value={localScore}
            onChange={(event) => onManualScoreChange('local', Number(event.target.value))}
            aria-label="Marcar goles del equipo local"
          />
        </label>
        <label>
          Visitante
          <input
            type="number"
            min="0"
            value={visitorScore}
            onChange={(event) => onManualScoreChange('visitor', Number(event.target.value))}
            aria-label="Marcar goles del equipo visitante"
          />
        </label>
      </div>
    </section>
  );
}
