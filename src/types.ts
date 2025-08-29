export type OldAttrRef = { tableId: number; attributeId: number; fkSubIndex?: number };
export type OldAttr = {
  id: number; names: string[]; order: number;
  pkMember?: boolean; optional?: boolean; soloUnique?: boolean; fk?: boolean;
  dataType?: string; dataTypeSize?: string | null;
  references?: OldAttrRef[];
};
export type OldTable = {
  type: "Table"; details: {
    id: number; name: string; x: number; y: number; sort: string;
    attributes: OldAttr[]; uniqueGroups: any[];
  };
};
export type OldConnector = { type: "TableConnector"; source: number; destination: number; details: { fkAttributeId: number; id: number } };
export type OldDoc = { version: 2; www: "erdplus.com"; shapes: OldTable[]; connectors: OldConnector[]; width: number; height: number };

export type NewCol = { id: string; name: string; type: string; position: number; isPrimaryKey?: boolean; isOptional?: boolean; isUnique?: boolean };
export type NewNode = {
  id: string; type: "Table"; position: {x:number;y:number};
  data: { label: string; isConnectable: true; columns: NewCol[]; numberOfGroups: 0; isSelected: false };
  measured: { width: number; height: number }; selected: false; dragging: false;
};
export type NewEdge = {
  id: string; type: "Relational"; source: string; target: string; targetHandle: string;
  markerStart: { type: "arrow" };
  data: { foreignKeyProps: { foreignKeyGroupId: string; sourceTableId: string; columns: { id: string; name: string; type: string }[] } };
};
export type NewDoc = {
  diagramType: 2;
  data: { nodes: NewNode[]; edges: NewEdge[]; viewport: {x:number;y:number;zoom:number} };
  name: string; folder: any; id: number; updatedAtTimestamp: number;
};
