export const PLAYER_ACTIONS = [
  { type: 'goal', label: 'Gol' },
  { type: 'assist', label: 'Asistencia' },
  { type: 'yellow', label: 'Tarjeta amarilla' },
  { type: 'red', label: 'Tarjeta roja' },
  { type: 'injury', label: 'Lesión' },
  { type: 'substitution', label: 'Cambio' },
  { type: 'edit-number', label: 'Dorsal' },
  { type: 'foul', label: 'Falta' },
  { type: 'penalty', label: 'Penalti' },
  { type: 'offside', label: 'Fuera de juego' },
  { type: 'corner', label: 'Saque de esquina' },
];

export const DEFAULT_ENABLED_PLAYER_ACTIONS = PLAYER_ACTIONS.map((action) => action.type);

export function normalizeEnabledPlayerActions(rawValue) {
  const enabledActions = Array.isArray(rawValue)
    ? rawValue.filter((actionType) => PLAYER_ACTIONS.some((action) => action.type === actionType))
    : DEFAULT_ENABLED_PLAYER_ACTIONS;

  return [...new Set(enabledActions)];
}
