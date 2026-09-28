import { ACTION_GROUPS, PLAYER_ACTIONS } from '../data/actionCatalog';

const GOAL_ACTION_TYPES = ACTION_GROUPS.find((group) => group.id === 'goal-actions')?.types
  .filter((type) => type !== 'goal') || [];

export default function GoalActionModal({ enabledActions, onSelectAction, onCancel }) {
  const enabledActionSet = new Set(enabledActions);
  const goalActions = GOAL_ACTION_TYPES
    .filter((type) => enabledActionSet.has(type))
    .map((type) => PLAYER_ACTIONS.find((action) => action.type === type))
    .filter(Boolean);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content goal-actions-modal" onClick={(event) => event.stopPropagation()}>
        <h2>⚽ Acción de gol</h2>
        <p className="modal-label">¿Cómo se ha producido el gol?</p>
        {goalActions.length > 0 ? (
          <div className="player-action-options">
            {goalActions.map((action) => (
              <button
                type="button"
                className="action-button"
                key={action.type}
                onClick={() => onSelectAction(action.type)}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="no-players">No hay acciones de gol activadas.</p>
        )}
        <button type="button" className="cancel-btn" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  );
}
