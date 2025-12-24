export enum TreeMorphState {
  SCATTERED = 'SCATTERED',
  TREE_SHAPE = 'TREE_SHAPE',
}

export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface OrnamentData {
  id: number;
  scale: number;
  color: string;
  // Pre-calculated positions
  scatterPos: Coordinates;
  scatterRot: Coordinates;
  treePos: Coordinates;
  treeRot: Coordinates;
}