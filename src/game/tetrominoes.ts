// --- Типы ------------------------------------------------------------

export interface Tetromino {
  cells: number[][];
  color: number;
}

export interface ActivePiece {
  shape: number[][]; // текущая (возможно, повёрнутая) матрица
  x: number; // колонка верхнего левого угла фигуры
  y: number; // строка верхнего левого угла фигуры
  color: number;
}

// --- Тетромино -------------------------------------------------------

export const TETROMINOES: Tetromino[] = [
  { cells: [[1, 1, 1, 1]], color: 0x22d3ee }, // I
  {
    cells: [
      [1, 1],
      [1, 1],
    ],
    color: 0xfacc15,
  }, // O
  {
    cells: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: 0xa78bfa,
  }, // T
  {
    cells: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: 0x4ade80,
  }, // S
  {
    cells: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: 0xf87171,
  }, // Z
  {
    cells: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: 0x60a5fa,
  }, // J
  {
    cells: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: 0xfb923c,
  }, // L
];

/** Поворот матрицы на 90° по часовой стрелке. */
export function rotateClockwise(matrix: number[][]): number[][] {
  const rotated: number[][] = [];
  for (let col = 0; col < matrix[0].length; col++) {
    const row: number[] = [];
    for (let r = matrix.length - 1; r >= 0; r--) {
      row.push(matrix[r][col]);
    }
    rotated.push(row);
  }
  return rotated;
}
