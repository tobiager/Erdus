import { useCallback, useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Panel,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useDiagram, addTable } from '../store/diagrams';
import { useT } from '../services/i18n';
import { useTheme } from '../services/theme';
import Toolbar from '../components/Toolbar';
import TableNode from '../components/TableNode';
import RelationEdge from '../components/RelationEdge';
import SidePanels from '../components/SidePanels';

const nodeTypes = {
  table: TableNode,
};

const edgeTypes = {
  relation: RelationEdge,
};

function DiagramEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useT();
  const { isDark } = useTheme();
  const { diagram, loading, updateIR, updateLayout, refreshDiagram } = useDiagram(id!);
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const reactFlowInstance = useReactFlow();

  // Convert IR to React Flow nodes and edges
  const convertIRToFlow = useCallback(() => {
    if (!diagram) return;

    const flowNodes: Node[] = diagram.ir.tables.map((table, index) => {
      const nodeLayout = diagram.layout.nodes[table.name] || {
        x: 100 + (index % 4) * 300,
        y: 100 + Math.floor(index / 4) * 200
      };

      return {
        id: table.name,
        type: 'table',
        position: { x: nodeLayout.x, y: nodeLayout.y },
        data: {
          table,
          color: nodeLayout.color || diagram.meta.color,
          collapsed: nodeLayout.collapsed || false,
          onEdit: setIsEditing,
        },
      };
    });

    const flowEdges: Edge[] = [];
    let edgeId = 0;

    diagram.ir.tables.forEach((table) => {
      table.columns.forEach((column) => {
        if (column.references) {
          flowEdges.push({
            id: `edge-${edgeId++}`,
            type: 'relation',
            source: table.name,
            target: column.references.table,
            data: {
              sourceColumn: column.name,
              targetColumn: column.references.column,
              onDelete: column.references.onDelete,
              onUpdate: column.references.onUpdate,
            },
            markerEnd: { type: 'arrow' },
          });
        }
      });
    });

    setNodes(flowNodes);
    setEdges(flowEdges);

    // Restore viewport
    if (diagram.layout.viewport) {
      requestAnimationFrame(() => {
        reactFlowInstance.setViewport(diagram.layout.viewport);
      });
    }
  }, [diagram, setNodes, setEdges, reactFlowInstance]);

  // Load diagram data
  useEffect(() => {
    if (loading) return;
    
    if (!diagram) {
      navigate('/diagrams');
      return;
    }

    convertIRToFlow();
    setIsLoading(false);
  }, [diagram, loading, navigate, convertIRToFlow]);

  // Save layout changes
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    
    if (!diagram) return;

    // Update layout for position changes
    const positionChanges = changes.filter((change: any) => change.type === 'position' && change.position);
    if (positionChanges.length > 0) {
      const nodePositions: Record<string, any> = { ...diagram.layout.nodes };
      
      positionChanges.forEach((change: any) => {
        nodePositions[change.id] = {
          ...nodePositions[change.id],
          x: change.position.x,
          y: change.position.y,
        };
      });

      updateLayout({
        ...diagram.layout,
        nodes: nodePositions,
      });
    }
  }, [onNodesChange, diagram, updateLayout]);

  // Handle viewport changes (zoom, pan)
  const handleMoveEnd = useCallback((_, viewport) => {
    if (!diagram) return;
    
    updateLayout({
      ...diagram.layout,
      viewport,
    });
  }, [diagram, updateLayout]);

  // Add table function
  const handleAddTable = useCallback(async () => {
    if (!id || !reactFlowInstance) return;

    try {
      // Get center of current viewport
      const viewport = reactFlowInstance.getViewport();
      const center = reactFlowInstance.project({
        x: window.innerWidth / 2,
        y: (window.innerHeight - 64) / 2, // Account for navbar height
      });

      await addTable(id, { x: center.x, y: center.y });
      await refreshDiagram();
    } catch (error) {
      console.error('Failed to add table:', error);
    }
  }, [id, reactFlowInstance, refreshDiagram]);

  // Check if user is typing
  const isTyping = useCallback(() => {
    const activeElement = document.activeElement;
    return ['INPUT', 'TEXTAREA'].includes(activeElement?.tagName ?? '') ||
           activeElement?.getAttribute('contenteditable') === 'true';
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing
      if (isTyping()) return;

      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault();
          handleAddTable();
          break;
        case 'r':
          event.preventDefault();
          // TODO: Add new relation
          break;
        case 'delete':
          if (selectedElement) {
            event.preventDefault();
            // TODO: Delete selected element
          }
          break;
        case 'f':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // TODO: Open search
          }
          break;
        case 'z':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              // TODO: Redo
            } else {
              // TODO: Undo
            }
          }
          break;
        case 'y':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // TODO: Redo
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTyping, selectedElement, handleAddTable]);

  if (loading || isLoading) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-[64px] bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-[64px] bg-black">
      {/* Toolbar */}
      <Toolbar
        diagram={diagram!}
        onEngineChange={(engine) => {
          // TODO: Handle engine change
        }}
        leftPanelCollapsed={leftPanelCollapsed}
        onToggleLeftPanel={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
        rightPanelCollapsed={rightPanelCollapsed}
        onToggleRightPanel={() => setRightPanelCollapsed(!rightPanelCollapsed)}
        onAddTable={handleAddTable}
      />

      <div className="flex h-[calc(100%-56px)] overflow-hidden">
        {/* Left Panel */}
        <SidePanels
          side="left"
          collapsed={leftPanelCollapsed}
          diagram={diagram!}
          selectedElement={selectedElement}
        />

        {/* Main Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            onMoveEnd={handleMoveEnd}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView={false}
            attributionPosition="top-right"
            colorMode="dark"
            className="h-full w-full !bg-black"
            onSelectionChange={({ nodes, edges }) => {
              const selected = nodes[0]?.id || edges[0]?.id || null;
              setSelectedElement(selected);
            }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="#374151"
            />
            <Controls position="bottom-right" />
          </ReactFlow>
        </div>

        {/* Right Panel */}
        <SidePanels
          side="right"
          collapsed={rightPanelCollapsed}
          diagram={diagram!}
          selectedElement={selectedElement}
        />
      </div>
    </div>
  );
}

export default function DiagramEditorWrapper() {
  return (
    <ReactFlowProvider>
      <DiagramEditor />
    </ReactFlowProvider>
  );
}