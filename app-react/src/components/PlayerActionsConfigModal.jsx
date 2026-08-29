import { PLAYER_ACTIONS } from '../data/actionCatalog';

export default function PlayerActionsConfigModal({ enabledActions, onUpdateActions, onConfirm, onCancel }) {
  const handleToggleAction = (actionType) => {
    if (enabledActions.includes(actionType)) {
      onUpdateActions(enabledActions.filter((type) => type !== actionType));
    } else {
      onUpdateActions([...enabledActions, actionType]);
    }
  };

  // Separar acciones por grupo
  const basicActions = PLAYER_ACTIONS.filter((a) => ['goal', 'assist', 'yellow', 'red', 'injury', 'substitution'].includes(a.type));
  const offensiveActions = PLAYER_ACTIONS.filter((a) => ['shot-on-goal', 'shot', 'clear-chance-created', 'clear-chance-missed'].includes(a.type));
  const defensiveActions = PLAYER_ACTIONS.filter((a) => ['foul', 'penalty', 'offside', 'corner', 'edit-number', 'ball-loss', 'crosses', 'ball-recovery', 'clearance', 'error-goal', 'error-chance', 'saves', 'one-on-one-won'].includes(a.type));

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content player-actions-config" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading-row">
          <h2>Configurar acciones de jugadora</h2>
          <button type="button" className="icon-close-button" onClick={onCancel} aria-label="Cerrar">×</button>
        </div>

        <p className="modal-label">Selecciona las acciones disponibles durante el partido:</p>

        <div className="actions-config-scroll-container">
          <div className="actions-config-section">
            <h3>Acciones básicas</h3>
            <div className="actions-config-list">
              {basicActions.map((action) => (
                <label key={action.type} className="action-checkbox">
                  <input
                    type="checkbox"
                    checked={enabledActions.includes(action.type)}
                    onChange={() => handleToggleAction(action.type)}
                  />
                  <span>{action.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="actions-config-section">
            <h3>Acciones ofensivas</h3>
            <div className="actions-config-list">
              {offensiveActions.map((action) => (
                <label key={action.type} className="action-checkbox">
                  <input
                    type="checkbox"
                    checked={enabledActions.includes(action.type)}
                    onChange={() => handleToggleAction(action.type)}
                  />
                  <span>{action.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="actions-config-section">
            <h3>Acciones defensivas y de balón</h3>
            <div className="actions-config-list">
              {defensiveActions.map((action) => (
                <label key={action.type} className="action-checkbox">
                  <input
                    type="checkbox"
                    checked={enabledActions.includes(action.type)}
                    onChange={() => handleToggleAction(action.type)}
                  />
                  <span>{action.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button type="button" className="secondary-button" onClick={onCancel}>Cancelar</button>
          <button type="button" className="primary-button" onClick={onConfirm}>Guardar y continuar</button>
        </div>
      </div>
    </div>
  );
}
