export const canvasVars = <const>['cx', 'cy'];
export type CanvasVar = typeof canvasVars[number];

export const nodeVars = <const>[...canvasVars, 'x', 'y'];
export type NodeVar = typeof nodeVars[number];

export const nodeLabelVars = <const>[...nodeVars, 'r'];
export type NodeLabelVar = typeof nodeLabelVars[number];
