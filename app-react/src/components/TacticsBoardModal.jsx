import { useEffect, useMemo, useRef, useState } from 'react';
import { FORMATION_POSITIONS } from './PitchField';
import FootballBall from './FootballBall';

const DEFAULT_POSITIONS = [
  { x: 10, y: 50 },
  { x: 22, y: 20 },
  { x: 22, y: 35 },
  { x: 22, y: 65 },
  { x: 22, y: 80 },
  { x: 45, y: 22 },
  { x: 45, y: 42 },
  { x: 45, y: 58 },
  { x: 45, y: 78 },
  { x: 68, y: 35 },
  { x: 68, y: 65 },
];

const SEVEN_A_SIDE_POSITIONS = [
  { x: 10, y: 50 },
  { x: 28, y: 25 },
  { x: 28, y: 50 },
  { x: 28, y: 75 },
  { x: 55, y: 25 },
  { x: 55, y: 50 },
  { x: 55, y: 75 },
];

function sortSquadPlayers(firstPlayer, secondPlayer) {
  const firstHasName = Boolean(firstPlayer.name?.trim()) && !/^Suplente\s+\d+$/i.test(firstPlayer.name.trim());
  const secondHasName = Boolean(secondPlayer.name?.trim()) && !/^Suplente\s+\d+$/i.test(secondPlayer.name.trim());

  if (firstHasName !== secondHasName) {
    return firstHasName ? -1 : 1;
  }

  return firstPlayer.number - secondPlayer.number;
}

function prioritizeGoalkeeper(players) {
  return [...players].sort((firstPlayer, secondPlayer) => Number(secondPlayer.role === 'POR') - Number(firstPlayer.role === 'POR'));
}

function getSquareBounds(start, end) {
  const side = Math.max(Math.abs(end.x - start.x), Math.abs(end.y - start.y));
  return {
    x: end.x < start.x ? start.x - side : start.x,
    y: end.y < start.y ? start.y - side : start.y,
    side,
  };
}

const DRAWING_TOOLS = [
  { id: 'arrow-solid', label: 'Flecha continua', kind: 'arrow', dashed: false },
  { id: 'arrow-dashed', label: 'Flecha discontinua', kind: 'arrow', dashed: true },
  { id: 'arrow-dotted', label: 'Flecha punteada', kind: 'arrow', dotted: true },
  { id: 'curve-solid', label: 'Flecha curva continua', kind: 'curve', dashed: false },
  { id: 'curve-dashed', label: 'Flecha curva discontinua', kind: 'curve', dashed: true },
  { id: 'curve-dotted', label: 'Flecha curva punteada', kind: 'curve', dotted: true },
  { id: 'line-solid', label: 'Línea continua', kind: 'line', dashed: false },
  { id: 'line-dashed', label: 'Línea discontinua', kind: 'line', dashed: true },
  { id: 'line-dotted', label: 'Línea punteada', kind: 'line', dotted: true },
  { id: 'square-solid', label: 'Cuadrado', kind: 'square', dashed: false, fill: 'none' },
  { id: 'square-dashed', label: 'Cuadrado discontinuo', kind: 'square', dashed: true, fill: 'none' },
  { id: 'square-dotted', label: 'Cuadrado punteado', kind: 'square', dotted: true, fill: 'none' },
  { id: 'square-hatched', label: 'Cuadrado rayado', kind: 'square', dashed: false, fill: 'hatched' },
  { id: 'circle-solid', label: 'Círculo', kind: 'circle', dashed: false, fill: 'none' },
  { id: 'circle-dashed', label: 'Círculo discontinuo', kind: 'circle', dashed: true, fill: 'none' },
  { id: 'circle-dotted', label: 'Círculo punteado', kind: 'circle', dotted: true, fill: 'none' },
  { id: 'circle-hatched', label: 'Círculo rayado', kind: 'circle', dashed: false, fill: 'hatched' },
  { id: 'marker-yellow', label: 'Ficha amarilla', kind: 'marker', marker: 'player', color: '#facc15', stroke: '#fde047' },
  { id: 'marker-blue', label: 'Ficha azul', kind: 'marker', marker: 'player', color: '#2563eb', stroke: '#93c5fd' },
  { id: 'marker-red', label: 'Ficha roja', kind: 'marker', marker: 'player', color: '#dc2626', stroke: '#fca5a5' },
  { id: 'marker-black', label: 'Ficha negra', kind: 'marker', marker: 'player', color: '#111827', stroke: '#9ca3af' },
  { id: 'marker-cyan', label: 'Ficha cian', kind: 'marker', marker: 'player', color: '#06b6d4', stroke: '#67e8f9' },
  { id: 'marker-white', label: 'Ficha blanca', kind: 'marker', marker: 'player', color: '#f8fafc', stroke: '#cbd5e1' },
  { id: 'marker-gold', label: 'Ficha oro', kind: 'marker', marker: 'player', color: '#fcd34d', stroke: '#f59e0b' },
  { id: 'marker-ball', label: 'Balón', kind: 'marker', marker: 'ball', color: '#ffffff', stroke: '#111827' },
];

const DRAWING_COLOR_OPTIONS = [
  '#facc15',
  '#2563eb',
  '#dc2626',
  '#111827',
  '#06b6d4',
  '#f8fafc',
  '#fcd34d',
];

function withAlpha(hexColor, alphaHex = '2e') {
  if (typeof hexColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(hexColor)) {
    return '#facc152e';
  }

  return `${hexColor}${alphaHex}`;
}

function getCurvePath(start, end) {
  const controlX = (start.x + end.x) / 2;
  const controlY = ((start.y + end.y) / 2) - Math.max(4, Math.abs(end.x - start.x) * 0.18);
  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;
}

function DrawingToolIcon({ tool }) {
  if (!tool) {
    return null;
  }

  const strokePattern = tool.dotted ? '1.2 3.4' : tool.dashed ? '6 4' : undefined;

  if (tool.kind === 'arrow') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line className="tool-icon-stroke" x1="5" y1="18" x2="19" y2="6" strokeDasharray={strokePattern} />
        <path className="tool-icon-stroke" d="M 15 6 L 19 6 L 19 10" />
      </svg>
    );
  }

  if (tool.kind === 'curve') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path className="tool-icon-stroke" d="M 5 16 Q 12 4 19 9" strokeDasharray={strokePattern} />
        <path className="tool-icon-stroke" d="M 17 6 L 19 9 L 15 10" />
      </svg>
    );
  }

  if (tool.kind === 'line') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line className="tool-icon-stroke" x1="5" y1="18" x2="19" y2="6" strokeDasharray={strokePattern} />
      </svg>
    );
  }

  if (tool.kind === 'square') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="5" width="14" height="14" strokeDasharray={strokePattern} className={`tool-icon-stroke ${tool.fill === 'hatched' ? 'icon-shape-hatched' : ''}`} />
      </svg>
    );
  }

  if (tool.kind === 'marker') {
    return tool.marker === 'ball' ? (
      <FootballBall className="tool-football-ball" />
    ) : (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="8" r="3" className="tool-marker-fill" style={{ '--tool-fill': tool.color, '--tool-stroke': tool.stroke }} />
        <rect x="7" y="12" width="10" height="6" rx="3" className="tool-marker-fill" style={{ '--tool-fill': tool.color, '--tool-stroke': tool.stroke }} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="7" strokeDasharray={strokePattern} className={`tool-icon-stroke ${tool.fill === 'hatched' ? 'icon-shape-hatched' : ''}`} />
    </svg>
  );
}

export default function TacticsBoardModal({
  roster,
  ball,
  onClose,
  onMovePlayer,
  onMoveBall,
  onApplyFormation,
  teamAppearance,
}) {
  const dragRef = useRef(null);
  const drawingRef = useRef(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [tacticalPlayerIds, setTacticalPlayerIds] = useState([]);
  const [tacticalPositions, setTacticalPositions] = useState({});
  const [visitorTacticalPlayerIds, setVisitorTacticalPlayerIds] = useState([]);
  const [visitorTacticalPositions, setVisitorTacticalPositions] = useState({});
  const [tacticalBallPosition, setTacticalBallPosition] = useState(ball || { x: 50, y: 50 });
  const [formationOpen, setFormationOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [activeToolId, setActiveToolId] = useState(null);
  const [drawingColor, setDrawingColor] = useState(DRAWING_COLOR_OPTIONS[0]);
  const [tacticalLines, setTacticalLines] = useState([]);
  const [tacticalMarkers, setTacticalMarkers] = useState([]);
  const [drawingPreview, setDrawingPreview] = useState(null);

  const activeTool = DRAWING_TOOLS.find((tool) => tool.id === activeToolId) || null;
  const markerTools = DRAWING_TOOLS.filter((tool) => tool.kind === 'marker');
  const drawingTools = DRAWING_TOOLS.filter((tool) => tool.kind !== 'marker');
  const markerToolActive = activeTool?.kind === 'marker';
  const drawingMode = Boolean(activeTool && !markerToolActive);

  const squadPlayers = useMemo(() => {
    const players = [...(roster?.local || []), ...(roster?.bench || [])];
    return players
      .filter((player, index) => players.findIndex((candidate) => candidate.id === player.id) === index)
      .sort(sortSquadPlayers);
  }, [roster]);

  const visitorSquadPlayers = useMemo(() => {
    const configuredPlayers = [...(roster?.visitor || []), ...(roster?.visitorBench || [])];
    const players = configuredPlayers.length > 0
      ? configuredPlayers
      : squadPlayers.map((player) => ({
          ...player,
          id: `tactics-visitor-${player.id}`,
          name: '',
          x: 0,
          y: 0,
        }));
    return players
      .filter((player, index) => players.findIndex((candidate) => candidate.id === player.id) === index)
      .sort(sortSquadPlayers);
  }, [roster, squadPlayers]);

  useEffect(() => {
    setTacticalPlayerIds((currentIds) => {
      const availableIds = new Set(squadPlayers.map((player) => player.id));
      const remainingIds = currentIds.filter((id) => availableIds.has(id));

      return remainingIds.length > 0
        ? remainingIds.slice(0, 11)
        : (roster?.local || []).slice(0, 11).map((player) => player.id);
    });
  }, [roster, squadPlayers]);

  useEffect(() => {
    setVisitorTacticalPlayerIds((currentIds) => {
      const availableIds = new Set(visitorSquadPlayers.map((player) => player.id));
      const remainingIds = currentIds.filter((id) => availableIds.has(id));

      return remainingIds.length > 0
        ? remainingIds.slice(0, 11)
        : (roster?.visitor || []).slice(0, 11).map((player) => player.id);
    });
  }, [roster, visitorSquadPlayers]);

  const boardPlayers = useMemo(() => {
    const getDefaultPosition = (index, playerCount) => (
      (playerCount <= 7 ? SEVEN_A_SIDE_POSITIONS : DEFAULT_POSITIONS)[index] || { x: 50, y: 50 }
    );
    const localPlayers = prioritizeGoalkeeper(tacticalPlayerIds
      .map((id) => squadPlayers.find((candidate) => candidate.id === id))
      .filter(Boolean)).map((player, index) => {

      return {
        ...player,
        ...(tacticalPositions[player.id] || getDefaultPosition(index, tacticalPlayerIds.length)),
        side: 'local',
      };
    });
    const visitorPlayers = prioritizeGoalkeeper(visitorTacticalPlayerIds
      .map((id) => visitorSquadPlayers.find((candidate) => candidate.id === id))
      .filter(Boolean)).map((player, index) => {

      const defaultPosition = getDefaultPosition(index, visitorTacticalPlayerIds.length);
      return {
        ...player,
        ...(visitorTacticalPositions[player.id] || { x: 100 - defaultPosition.x, y: defaultPosition.y }),
        side: 'visitor',
      };
    });
    return [...localPlayers, ...visitorPlayers];
  }, [squadPlayers, tacticalPlayerIds, tacticalPositions, visitorSquadPlayers, visitorTacticalPlayerIds, visitorTacticalPositions]);

  const selectedPlayer = boardPlayers.find((player) => player.id === selectedPlayerId) || null;

  const getBoardPosition = (event, board) => {
    const rect = board.getBoundingClientRect();

    return {
      x: Math.max(2, Math.min(98, ((event.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(4, Math.min(96, ((event.clientY - rect.top) / rect.height) * 100)),
    };
  };

  const handlePointerDown = (event, player) => {
    if (!player) return;

    const board = event.currentTarget.closest('.tactics-board-surface');
    if (!board) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { player, board };
    setSelectedPlayerId(player.id);
  };

  const handlePointerMove = (event) => {
    if (!dragRef.current) return;

    const { player, board } = dragRef.current;
    const position = getBoardPosition(event, board);

    if (player === 'ball') {
      setTacticalBallPosition(position);
      onMoveBall?.(position);
      return;
    }

    if (player?.kind === 'marker') {
      setTacticalMarkers((currentMarkers) => currentMarkers.map((marker) => (
        marker.id === player.id ? { ...marker, ...position } : marker
      )));
      return;
    }

    const setPositions = player.side === 'visitor' ? setVisitorTacticalPositions : setTacticalPositions;
    setPositions((current) => ({ ...current, [player.id]: position }));
  };

  const handlePointerUp = (event) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleDrawingPointerDown = (event) => {
    if (!activeTool || activeTool.kind === 'marker') return;

    const board = event.currentTarget.closest('.tactics-board-surface');
    if (!board) return;

    event.preventDefault();
    event.stopPropagation();
    const start = getBoardPosition(event, board);
    const selectedDrawingTool = { ...activeTool, color: drawingColor };
    drawingRef.current = { board, start };
    setDrawingPreview({ start, end: start, tool: selectedDrawingTool });
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleBoardSurfacePointerDown = (event) => {
    if (!activeTool || activeTool.kind !== 'marker') {
      return;
    }

    const eventTarget = event.target;
    if (eventTarget instanceof HTMLElement && eventTarget.closest('.tactics-player, .tactics-ball, .tactics-marker')) {
      return;
    }

    const board = event.currentTarget;
    if (!(board instanceof HTMLElement)) {
      return;
    }

    const position = getBoardPosition(event, board);
    setTacticalMarkers((currentMarkers) => [
      ...currentMarkers,
      {
        id: crypto.randomUUID(),
        x: position.x,
        y: position.y,
        marker: activeTool.marker || 'player',
        color: activeTool.color || '#fde047',
        stroke: activeTool.stroke || '#facc15',
      },
    ]);
  };

  const handleDrawingPointerMove = (event) => {
    if (!drawingRef.current) return;

    const end = getBoardPosition(event, drawingRef.current.board);
    if (!activeTool || activeTool.kind === 'marker') {
      return;
    }

    const selectedDrawingTool = { ...activeTool, color: drawingColor };
    setDrawingPreview({ start: drawingRef.current.start, end, tool: selectedDrawingTool });
  };

  const handleDrawingPointerUp = (event) => {
    if (!drawingRef.current) return;

    const end = getBoardPosition(event, drawingRef.current.board);
    const start = drawingRef.current.start;
    if (!activeTool) {
      drawingRef.current = null;
      setDrawingPreview(null);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      return;
    }

    setTacticalLines((currentLines) => [
      ...currentLines,
      { id: crypto.randomUUID(), start, end, tool: { ...activeTool, color: drawingColor } },
    ]);
    drawingRef.current = null;
    setDrawingPreview(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const handleDrawingPointerCancel = (event) => {
    drawingRef.current = null;
    setDrawingPreview(null);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  };

  const toggleTacticalPlayer = (player) => {
    const isSelected = tacticalPlayerIds.includes(player.id);

    if (!isSelected && tacticalPlayerIds.length >= 11) return;

    setTacticalPlayerIds((currentIds) => (
      isSelected
        ? currentIds.filter((id) => id !== player.id)
        : player.role === 'POR' ? [player.id, ...currentIds] : [...currentIds, player.id]
    ));
  };

  const toggleVisitorTacticalPlayer = (player) => {
    const isSelected = visitorTacticalPlayerIds.includes(player.id);
    if (!isSelected && visitorTacticalPlayerIds.length >= 11) return;

    setVisitorTacticalPlayerIds((currentIds) => (
      isSelected
        ? currentIds.filter((id) => id !== player.id)
        : player.role === 'POR' ? [player.id, ...currentIds] : [...currentIds, player.id]
    ));
  };

  const applyFormation = (side, formation) => {
    const players = side === 'visitor' ? visitorSquadPlayers : squadPlayers;
    const setIds = side === 'visitor' ? setVisitorTacticalPlayerIds : setTacticalPlayerIds;
    const setPositions = side === 'visitor' ? setVisitorTacticalPositions : setTacticalPositions;
    const formationPositions = FORMATION_POSITIONS[formation];
    if (!formationPositions) return;
    const goalkeeper = players.find((player) => player.role === 'POR');
    const selectedPlayers = goalkeeper
      ? [goalkeeper, ...players.filter((player) => player.id !== goalkeeper.id)].slice(0, formationPositions.length)
      : players.slice(0, formationPositions.length);

    setIds(selectedPlayers.map((player) => player.id));
    setPositions(Object.fromEntries(selectedPlayers.map((player, index) => [
      player.id,
      side === 'visitor'
        ? { x: 100 - formationPositions[index].x, y: formationPositions[index].y }
        : formationPositions[index],
    ])));
      onApplyFormation?.(formation, side);
  };

    const applyPlayerCount = (side, playerCount) => {
      const players = side === 'visitor' ? visitorSquadPlayers : squadPlayers;
      const setIds = side === 'visitor' ? setVisitorTacticalPlayerIds : setTacticalPlayerIds;
      const setPositions = side === 'visitor' ? setVisitorTacticalPositions : setTacticalPositions;
      const goalkeeper = players.find((player) => player.role === 'POR');
      const selectedPlayers = goalkeeper
        ? [goalkeeper, ...players.filter((player) => player.id !== goalkeeper.id)].slice(0, playerCount)
        : players.slice(0, playerCount);

      setIds(selectedPlayers.map((player) => player.id));
      setPositions({});
    };

  return (
    <div className="modal-overlay tactics-board-overlay" onClick={onClose}>
      <div className="modal-content tactics-board-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-heading-row">
          <h2>Pizarra táctica</h2>
          <div className="tactics-drawing-controls" aria-label="Controles de dibujo">
            <button
              type="button"
              className={`${toolsOpen ? 'active' : ''} ${drawingMode ? 'tool-enabled' : ''}`}
              onClick={() => setToolsOpen((isOpen) => !isOpen)}
              aria-expanded={toolsOpen}
              title="Seleccionar herramienta de dibujo"
            >
              Herramienta
            </button>
            {toolsOpen && (
              <div className="tactics-tool-popover" role="menu" aria-label="Herramientas de dibujo">
                <div className="tactics-tool-grid">
                  {drawingTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      className={`tactics-tool-button ${activeToolId === tool.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveToolId(tool.id);
                      }}
                      title={tool.label}
                      aria-label={tool.label}
                      aria-pressed={activeToolId === tool.id}
                    >
                      <DrawingToolIcon tool={tool} />
                    </button>
                  ))}
                </div>
                <div className="tactics-tool-separator" aria-hidden="true" />
                <div className="tactics-tool-grid tactics-marker-tool-grid">
                  {markerTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      className={`tactics-tool-button marker ${activeToolId === tool.id ? 'active' : ''}`}
                      onClick={() => {
                        setActiveToolId(tool.id);
                      }}
                      title={tool.label}
                      aria-label={tool.label}
                      aria-pressed={activeToolId === tool.id}
                    >
                      <DrawingToolIcon tool={tool} />
                    </button>
                  ))}
                </div>
                <div className="tactics-color-picker" aria-label="Colores de dibujo">
                  {DRAWING_COLOR_OPTIONS.map((colorOption) => (
                    <button
                      key={colorOption}
                      type="button"
                      className={`tactics-color-swatch ${drawingColor === colorOption ? 'active' : ''}`}
                      style={{ backgroundColor: colorOption }}
                      onClick={() => setDrawingColor(colorOption)}
                      aria-label={`Color ${colorOption}`}
                      aria-pressed={drawingColor === colorOption}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="tactics-tool-clear-selection"
                  onClick={() => {
                    setActiveToolId(null);
                    setDrawingPreview(null);
                  }}
                >
                  Desactivar dibujo
                </button>
              </div>
            )}
            <button type="button" onClick={() => { setTacticalLines([]); setTacticalMarkers([]); }} disabled={tacticalLines.length === 0 && tacticalMarkers.length === 0}>
              Limpiar
            </button>
          </div>
          <button type="button" className="icon-close-button" onClick={onClose} aria-label="Cerrar pizarra">×</button>
        </div>

        <div className="tactics-board-layout">
          <div className="tactics-board-surface pitch-canvas" aria-label="Tablero táctico" onPointerDown={handleBoardSurfacePointerDown}>
            <div className="area-large-left" />
            <div className="area-small-left" />
            <div className="area-large-right" />
            <div className="area-small-right" />
            <div className="goal-left" />
            <div className="goal-right" />
            <div className="penalty-spot-left" />
            <div className="penalty-spot-right" />
            <div className="corner-mark corner-top-left" />
            <div className="corner-mark corner-bottom-left" />
            <div className="corner-mark corner-top-right" />
            <div className="corner-mark corner-bottom-right" />
            <div className="corner-flag flag-top-left" aria-hidden="true" />
            <div className="corner-flag flag-bottom-left" aria-hidden="true" />
            <div className="corner-flag flag-top-right" aria-hidden="true" />
            <div className="corner-flag flag-bottom-right" aria-hidden="true" />
            <svg
              className={`tactics-drawing-layer ${drawingMode ? 'active' : ''}`}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label="Anotaciones tácticas"
              onPointerDown={handleDrawingPointerDown}
              onPointerMove={handleDrawingPointerMove}
              onPointerUp={handleDrawingPointerUp}
              onPointerCancel={handleDrawingPointerCancel}
            >
              <defs>
                <marker id="tactics-arrowhead" markerWidth="4" markerHeight="4" refX="3.2" refY="2" orient="auto" markerUnits="userSpaceOnUse">
                  <path d="M 0 0 L 4 2 L 0 4 z" />
                </marker>
                <pattern id="tactics-hatch" patternUnits="userSpaceOnUse" width="3" height="3" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="3" stroke="rgba(251, 146, 60, 0.6)" strokeWidth="1" />
                </pattern>
              </defs>
              {[...tacticalLines, ...(drawingPreview ? [{ ...drawingPreview, id: 'preview' }] : [])].map((line) => (
                <g key={line.id}>
                  {line.id !== 'preview' && line.tool?.kind !== 'circle' && line.tool?.kind !== 'square' && line.tool?.kind !== 'curve' && (
                    <line
                      x1={line.start.x}
                      y1={line.start.y}
                      x2={line.end.x}
                      y2={line.end.y}
                      className="tactics-drawing-hit-area"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setTacticalLines((currentLines) => currentLines.filter((currentLine) => currentLine.id !== line.id));
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Borrar anotación táctica"
                    />
                  )}
                  {line.id !== 'preview' && line.tool?.kind === 'curve' && (
                    <path
                      d={getCurvePath(line.start, line.end)}
                      className="tactics-drawing-hit-area"
                      onPointerDown={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setTacticalLines((currentLines) => currentLines.filter((currentLine) => currentLine.id !== line.id));
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Borrar anotación táctica"
                    />
                  )}
                  {line.tool?.kind === 'circle' && (
                    <circle
                      cx={(line.start.x + line.end.x) / 2}
                      cy={(line.start.y + line.end.y) / 2}
                      r={Math.min(Math.abs(line.end.x - line.start.x), Math.abs(line.end.y - line.start.y)) / 2}
                      className={`tactics-drawing-shape ${line.tool?.dashed ? 'dashed' : ''} ${line.tool?.dotted ? 'dotted' : ''}`}
                      style={{
                        stroke: line.tool?.color || '#fb923c',
                        fill: line.tool?.fill === 'hatched' ? withAlpha(line.tool?.color || '#fb923c', '33') : 'transparent',
                      }}
                      onPointerDown={line.id !== 'preview' ? (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setTacticalLines((currentLines) => currentLines.filter((currentLine) => currentLine.id !== line.id));
                      } : undefined}
                      role={line.id !== 'preview' ? 'button' : undefined}
                      aria-label={line.id !== 'preview' ? 'Borrar círculo' : undefined}
                    />
                  )}
                  {line.tool?.kind === 'square' && (
                    <rect
                      {...(() => {
                        const square = getSquareBounds(line.start, line.end);
                        return { x: square.x, y: square.y, width: square.side, height: square.side };
                      })()}
                      className={`tactics-drawing-shape ${line.tool?.dashed ? 'dashed' : ''} ${line.tool?.dotted ? 'dotted' : ''}`}
                      style={{
                        stroke: line.tool?.color || '#fb923c',
                        fill: line.tool?.fill === 'hatched' ? withAlpha(line.tool?.color || '#fb923c', '33') : 'transparent',
                      }}
                      onPointerDown={line.id !== 'preview' ? (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setTacticalLines((currentLines) => currentLines.filter((currentLine) => currentLine.id !== line.id));
                      } : undefined}
                      role={line.id !== 'preview' ? 'button' : undefined}
                      aria-label={line.id !== 'preview' ? 'Borrar cuadrado' : undefined}
                    />
                  )}
                  {line.tool?.kind === 'curve' && (
                    <path
                      d={getCurvePath(line.start, line.end)}
                      className={`tactics-drawing-line ${line.tool?.dashed ? 'dashed' : ''} ${line.tool?.dotted ? 'dotted' : ''} arrow`}
                      style={{ stroke: line.tool?.color || '#fb923c' }}
                    />
                  )}
                  {line.tool?.kind !== 'circle' && line.tool?.kind !== 'square' && line.tool?.kind !== 'curve' && (
                    <line
                      x1={line.start.x}
                      y1={line.start.y}
                      x2={line.end.x}
                      y2={line.end.y}
                      className={`tactics-drawing-line ${line.tool?.kind === 'arrow' ? 'arrow' : ''} ${line.tool?.dashed ? 'dashed' : ''} ${line.tool?.dotted ? 'dotted' : ''}`}
                      style={{ stroke: line.tool?.color || '#fb923c' }}
                    />
                  )}
                </g>
              ))}
            </svg>
            {tacticalMarkers.map((marker) => (
              <button
                key={marker.id}
                type="button"
                className={`tactics-marker ${marker.marker === 'ball' ? 'ball' : 'player'}`}
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  '--marker-color': marker.color,
                  '--marker-stroke': marker.stroke,
                }}
                onPointerDown={(event) => {
                  event.stopPropagation();
                  handlePointerDown(event, { kind: 'marker', id: marker.id });
                }}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onDoubleClick={() => setTacticalMarkers((currentMarkers) => currentMarkers.filter((currentMarker) => currentMarker.id !== marker.id))}
                title={marker.marker === 'ball' ? 'Balón auxiliar' : 'Ficha auxiliar (doble click para borrar)'}
              >
                {marker.marker === 'ball' ? <FootballBall className="marker-ball-glyph" /> : <span className="marker-player-glyph" aria-hidden="true" />}
              </button>
            ))}
            <FootballBall
              className="pitch-ball tactics-ball"
              style={{ left: `${tacticalBallPosition.x}%`, top: `${tacticalBallPosition.y}%` }}
              onPointerDown={(event) => handlePointerDown(event, 'ball')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              role="button"
              tabIndex={0}
              aria-label="Balón táctico"
              title="Arrastrar balón"
            />
            {boardPlayers.map((player) => (
              <button
                key={`${player.side}-${player.id}`}
                type="button"
                className={`tactics-player ${selectedPlayerId === player.id ? 'selected' : ''} ${player.side === 'visitor' ? 'visitor' : `appearance-${teamAppearance?.shape || 'ball'}`} ${player.role === 'POR' ? 'goalkeeper' : ''}`}
                onClick={() => setSelectedPlayerId(player.id)}
                onPointerDown={(event) => handlePointerDown(event, player)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{
                  left: `${player.x ?? 50}%`,
                  top: `${player.y ?? 50}%`,
                  ...(player.side === 'local' ? { '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' } : {}),
                }}
                title={player.side === 'visitor' ? `Dorsal ${player.number}` : `${player.name} #${player.number}`}
              >
                <span className="tactics-player-number">{player.number}</span>
                {player.side === 'local' && <span className="tactics-player-name">{player.name}</span>}
              </button>
            ))}
          </div>

          <div className="tactics-squads" aria-label="Plantillas tácticas">
            <aside className="tactics-squad-picker" aria-label="Once táctico local">
              <span className="tactics-squad-count">Mi once: {tacticalPlayerIds.length}/11</span>
              <div className="tactics-squad-list">
              {squadPlayers.map((player) => {
                const isSelected = tacticalPlayerIds.includes(player.id);
                const isUnavailable = !isSelected && tacticalPlayerIds.length >= 11;

                return (
                  <button
                    key={player.id}
                    type="button"
                    className={`tactics-squad-player ${isSelected ? 'selected' : ''} ${player.role === 'POR' ? 'goalkeeper' : ''}`}
                    style={{ '--team-color': teamAppearance?.color || '#facc15', '--team-color-secondary': teamAppearance?.secondaryColor || '#111827' }}
                    onClick={() => toggleTacticalPlayer(player)}
                    aria-pressed={isSelected}
                    disabled={isUnavailable}
                    title={`${player.name} #${player.number}`}
                  >
                    <strong>{player.number}</strong>
                    <span>{player.name}</span>
                  </button>
                );
              })}
              </div>
              <div className="tactics-formation-actions">
                <button type="button" onClick={() => applyPlayerCount('local', 7)}>F7</button>
                <button type="button" onClick={() => applyPlayerCount('local', 11)}>F11</button>
                <button type="button" onClick={() => setFormationOpen((isOpen) => !isOpen)} aria-expanded={formationOpen}>
                  Formación {formationOpen ? '▴' : '▾'}
                </button>
                {formationOpen && Object.keys(FORMATION_POSITIONS).map((formation) => (
                  <button type="button" key={formation} onClick={() => applyFormation('local', formation)}>{formation}</button>
                ))}
              </div>
            </aside>
            <aside className="tactics-squad-picker visitor-picker" aria-label="Once táctico visitante">
              <span className="tactics-squad-count">Visitante: {visitorTacticalPlayerIds.length}/11</span>
              <div className="tactics-squad-list">
                {visitorSquadPlayers.map((player) => {
                  const isSelected = visitorTacticalPlayerIds.includes(player.id);
                  const isUnavailable = !isSelected && visitorTacticalPlayerIds.length >= 11;

                  return (
                    <button
                      key={player.id}
                      type="button"
                      className={`tactics-squad-player visitor ${isSelected ? 'selected' : ''} ${player.role === 'POR' ? 'goalkeeper' : ''}`}
                      onClick={() => toggleVisitorTacticalPlayer(player)}
                      aria-pressed={isSelected}
                      disabled={isUnavailable}
                      title={`Dorsal ${player.number}`}
                    >
                      <strong>{player.number}</strong>
                    </button>
                  );
                })}
              </div>
              <div className="tactics-formation-actions">
                <button type="button" onClick={() => applyPlayerCount('visitor', 7)}>F7</button>
                <button type="button" onClick={() => applyPlayerCount('visitor', 11)}>F11</button>
                <button type="button" onClick={() => setFormationOpen((isOpen) => !isOpen)} aria-expanded={formationOpen}>
                  Formación {formationOpen ? '▴' : '▾'}
                </button>
                {formationOpen && Object.keys(FORMATION_POSITIONS).map((formation) => (
                  <button type="button" key={formation} onClick={() => applyFormation('visitor', formation)}>{formation}</button>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
