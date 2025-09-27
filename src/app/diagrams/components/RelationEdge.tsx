import { BaseEdge, EdgeLabelRenderer, EdgeProps, getStraightPath } from 'reactflow';

interface RelationEdgeData {
  sourceColumn: string;
  targetColumn: string;
  onDelete?: string;
  onUpdate?: string;
}

export default function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<RelationEdgeData>) {
  const [edgePath, labelX, labelY] = getStraightPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge 
        id={id} 
        path={edgePath} 
        className={selected ? 'stroke-blue-500 stroke-2' : 'stroke-slate-400 dark:stroke-slate-500'}
      />
      
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-sm">
            <div className="text-xs font-medium text-slate-900 dark:text-white">
              {data?.sourceColumn} → {data?.targetColumn}
            </div>
            {(data?.onDelete || data?.onUpdate) && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {data.onDelete && `ON DELETE ${data.onDelete}`}
                {data.onUpdate && data.onDelete && ' • '}
                {data.onUpdate && `ON UPDATE ${data.onUpdate}`}
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}