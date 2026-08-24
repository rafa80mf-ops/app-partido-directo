import FootballBall from './FootballBall';

const actions = [
  { type: 'goal', label: 'Gol' },
  { type: 'assist', label: '🅰️ Asistencia' },
  { type: 'yellow', label: '🟨 Tarjeta amarilla' },
  { type: 'red', label: '🟥 Tarjeta roja' },
  { type: 'injury', label: 'Lesión' },
  { type: 'substitution', label: '🔄 Cambio' },
  { type: 'edit-number', label: '✏️ Dorsal' },
];

export default function PlayerActionMenuModal({ player, team, onSelectAction, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content player-action-menu" onClick={(event) => event.stopPropagation()}>
        <h2>{player.name}</h2>
        <p className="modal-label">{team === 'visitor' ? 'Equipo visitante' : 'Equipo local'} · Selecciona una acción:</p>
        <div className="player-action-options">
          {actions.map((action) => (
            <button
              type="button"
              className="action-button"
              key={action.type}
              onClick={() => onSelectAction(action.type)}
            >
              {action.type === 'goal' ? <><FootballBall /> {action.label}</> : action.type === 'injury' ? <><span className="injury-cross">✚</span> {action.label}</> : action.label}
            </button>
          ))}
        </div>
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
