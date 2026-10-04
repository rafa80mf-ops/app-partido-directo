import FootballBall from './FootballBall';
import { ACTION_GROUPS, PLAYER_ACTIONS } from '../data/actionCatalog';

export const ACTION_ICONS = {
  goal: '⚽',
  assist: '🅰️',
  yellow: '🟨',
  red: '🟥',
  injury: <span className="injury-cross">✚</span>,
  substitution: '🔄',
  'edit-number': '🏷️',
  foul: '⚠️',
  penalty: '🔫',
  offside: '📍',
  corner: '🚩',
  counterattack: '⚡',
  'wide-cross': '↗️',
  cutback: '↙️',
  'combination-play': '🔗',
  'ball-behind-defense': '➡️',
  'individual-action': '🏃',
  'long-shot': '🎯',
  'second-ball': '🔄',
  'direct-play': '⬆️',
  'pressure-build-up': '🔥',
  'own-goal': '🥅',
  'shot-on-goal': '🎯',
  shot: '🔫',
  'clear-chance-created': '⚡',
  'clear-chance-missed': '❌',
  'ball-loss': '💧',
  crosses: '➡️',
  'ball-recovery': '🔄',
  clearance: '🛡️',
  'error-goal': '💔',
  'error-chance': '⚠️',
  saves: '🧤',
  'one-on-one-won': '💪',
};

export default function PlayerActionMenuModal({ player, team, onSelectAction, onCancel, enabledPlayerActions = [], selectedAction = null }) {
  const enabledActionSet = new Set(enabledPlayerActions);
  const goalActionTypes = new Set(
    ACTION_GROUPS.find((group) => group.id === 'goal-actions')?.types.filter((type) => type !== 'goal') || [],
  );
  const actions = PLAYER_ACTIONS.filter((action) => (
    enabledActionSet.has(action.type) && !goalActionTypes.has(action.type)
  ));

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content player-action-menu" onClick={(event) => event.stopPropagation()}>
        <h2>{player.name}</h2>
        <p className="modal-label">{team === 'visitor' ? 'Equipo visitante' : 'Equipo local'} · Selecciona o quita una acción:</p>
        {actions.length === 0 ? (
          <p className="no-players">No hay acciones seleccionadas en el panel.</p>
        ) : (
          <div className="player-action-options">
            {actions.map((action) => {
              const isActive = selectedAction === action.type;
              return (
                <button
                  type="button"
                  className={`action-button ${isActive ? 'active' : ''}`}
                  key={action.type}
                  onClick={() => onSelectAction(action.type)}
                  aria-pressed={isActive}
                >
                  <span aria-hidden="true">{ACTION_ICONS[action.type] ?? '•'}</span>
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
