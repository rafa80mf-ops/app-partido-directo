export default function ControlPanel({
  isRunning,
  localScore,
  visitorScore,
  onToggleRunning,
  onReset,
  onGoal,
  onAssist,
  onCard,
  onSubstitution,
  onManualScoreChange,
  selectingInjured,
  onInitiateInjury,
  onInitiateYellowCard,
}) {
  const buttonBaseClass = 'action-button';

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
        <button type="button" className={buttonBaseClass} onClick={() => onGoal('local')}>
          ⚽ Gol local
        </button>
        <button type="button" className={buttonBaseClass} onClick={() => onGoal('visitor')}>
          ⚽ Gol visitante
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={() => onAssist('local')}>
          🅰️ Asistencia local
        </button>
        <button type="button" className={buttonBaseClass} onClick={() => onAssist('visitor')}>
          🅰️ Asistencia visitante
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={() => onCard('local', 'yellow')}>
          🟨 Amarilla local
        </button>
        <button type="button" className={buttonBaseClass} onClick={() => onCard('visitor', 'yellow')}>
          🟨 Amarilla visitante
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={() => onCard('local', 'red')}>
          🟥 Roja local
        </button>
        <button type="button" className={buttonBaseClass} onClick={() => onCard('visitor', 'red')}>
          🟥 Roja visitante
        </button>
      </div>

      <div className="control-row">
        <button type="button" className={buttonBaseClass} onClick={() => onSubstitution('local')}>
          🔄 Cambio local
        </button>
        <button type="button" className={buttonBaseClass} onClick={() => onSubstitution('visitor')}>
          🔄 Cambio visitante
        </button>
      </div>

      <div className="control-row">
        <button
          type="button"
          className={`${buttonBaseClass} ${selectingInjured ? 'active-mode' : ''}`}
          onClick={onInitiateInjury}
        >
          {selectingInjured ? '🩹 Selecciona lesionada...' : '🩹 Marcar lesión'}
        </button>
      </div>

      <div className="control-row">
        <button
          type="button"
          className={buttonBaseClass}
          onClick={onInitiateYellowCard}
        >
          🟨 Tarjeta amarilla
        </button>
      </div>

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
