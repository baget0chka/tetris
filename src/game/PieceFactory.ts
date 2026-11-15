import { COLS } from "./constants";
import { ActivePiece, TETROMINOES } from "./tetrominoes";

/**
 * Система «мешок» (7-Bag System): фигуры выдаются из перемешанного набора,
 * в котором каждая из 7 фигур встречается ровно один раз. Когда мешок
 * заканчивается, он перемешивается заново. Так исключаются длинные серии
 * повторов и «засухи» одной фигуры.
 */

/** Очередь индексов фигур текущего мешка (последний элемент — следующая фигура). */
let bag: number[] = [];

/** Перемешивание Фишера — Йетса (равномерное случайное перемешивание). */
function shuffledIndices(count: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < count; i++) indices.push(i);

  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = indices[i];
    indices[i] = indices[j];
    indices[j] = tmp;
  }
  return indices;
}

/** Берёт следующий индекс фигуры из мешка, при необходимости перемешивая новый. */
function takeTetrominoIndex(): number {
  if (bag.length === 0) {
    bag = shuffledIndices(TETROMINOES.length);
  }
  return bag.pop() as number;
}

/** Начинает новую последовательность мешков (вызывается при рестарте игры). */
export function resetPieceBag(): void {
  bag = [];
}

/** Создаёт фигуру по центру верхней строки согласно системе 7-Bag. */
export function createPiece(): ActivePiece {
  const tetromino = TETROMINOES[takeTetrominoIndex()];
  const shape = tetromino.cells.map((row) => [...row]);
  return {
    shape,
    x: Math.floor((COLS - shape[0].length) / 2),
    y: 0,
    color: tetromino.color,
  };
}
