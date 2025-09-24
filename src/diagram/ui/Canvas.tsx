import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  ReactFlowInstance,
  ConnectionMode,
  useReactFlow
} from 'reactflow';
import { useDiagramStore } from '../store';
import TableNode from './TableNode';

const nodeTypes = {
  tableNode: TableNode,
};

export default function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  
  const { 
    project, 
    selectedTable,
    setTablePosition,
    createForeignKey,
    selectTable
  } = useDiagramStore();

  // Convert project data to React Flow nodes
  useEffect(() => {
    if (!project || !project.schemas[0]) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const schema = project.schemas[0];
    const newNodes: Node[] = schema.tables.map((table) => ({
      id: table.id,
      type: 'tableNode',
      position: table.position || { x: 100, y: 100 },
      data: { table },
      selected: selectedTable === table.id
    }));

    const newEdges: Edge[] = [];
    
    // Create edges for foreign keys
    schema.tables.forEach((table) => {
      table.columns.forEach((column) => {
        if (column.references) {
          const targetTable = schema.tables.find(t => t.name === column.references!.table);
          if (targetTable) {
            newEdges.push({
              id: `${table.id}-${column.name}-${targetTable.id}`,
              source: table.id,
              target: targetTable.id,
              label: `${column.name} → ${column.references.column}`,
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#94a3b8', strokeWidth: 2 }
            });
          }
        }
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [project, selectedTable, setNodes, setEdges]);

  // Handle node position changes
  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      setTablePosition(node.id, node.position);
    },
    [setTablePosition]
  );

  // Handle connections between tables (create FK)
  const onConnect = useCallback(
    (connection: Edge | Connection) => {
      if (connection.source && connection.target) {
        createForeignKey(connection.source, connection.target);
      }
    },
    [createForeignKey]
  );

  // Handle node selection
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      selectTable(node.id);
    },
    [selectTable]
  );

  // Handle pane click (deselect)
  const onPaneClick = useCallback(() => {
    selectTable(null);
  }, [selectTable]);

  // Handle drop for adding new tables
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const type = event.dataTransfer.getData('application/reactflow');
      
      if (type === 'table') {
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        useDiagramStore.getState().addTable(undefined, position);
      }
    },
    [reactFlowInstance]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return (
    <div className="h-full w-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        snapToGrid={true}
        snapGrid={[16, 16]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 2 }
        }}
        className="!h-full !w-full"
        fitView
      >
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case 'tableNode':
                return node.selected ? '#3b82f6' : '#64748b';
              default:
                return '#64748b';
            }
          }}
          pannable
          zoomable
        />
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={16} 
          size={1} 
          color="#404040"
          className="dark:opacity-100 opacity-30"
        />
      </ReactFlow>
    </div>
  );
}