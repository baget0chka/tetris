import { COLS } from "./constants";
import { ActivePiece, TETROMINOES } from "./tetrominoes";

/** Создаёт случайную фигуру по центру верхней строки. */
export function createPiece(): ActivePiece {
  const tetromino = TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
  const shape = tetromino.cells.map((row) => [...row]);
  return {
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
    color: tetromino.color,
  };
}
