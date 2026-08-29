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
  { type: 'shot-on-goal', label: 'Tiro a puerta' },
  { type: 'shot', label: 'Tiros' },
  { type: 'clear-chance-created', label: 'Ocasión clara creada' },
  { type: 'clear-chance-missed', label: 'Ocasión clara fallada' },
  { type: 'ball-loss', label: 'Pérdida de balón' },
  { type: 'crosses', label: 'Centros' },
  { type: 'ball-recovery', label: 'Balón recuperado' },
  { type: 'clearance', label: 'Despejes' },
  { type: 'error-goal', label: 'Error provoca gol' },
  { type: 'error-chance', label: 'Error provoca ocasión de gol' },
  { type: 'saves', label: 'Paradas' },
  { type: 'one-on-one-won', label: 'Uno contra uno ganado' },
];

export const DEFAULT_ENABLED_PLAYER_ACTIONS = PLAYER_ACTIONS.map((action) => action.type);

export function normalizeEnabledPlayerActions(rawValue) {
  const enabledActions = Array.isArray(rawValue)
    ? rawValue.filter((actionType) => PLAYER_ACTIONS.some((action) => action.type === actionType))
    : DEFAULT_ENABLED_PLAYER_ACTIONS;

  return [...new Set(enabledActions)];
}
