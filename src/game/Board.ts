import { COLS, LINE_SCORES, ROWS } from "./constants";

/**
 * Чистая модель игрового поля: сетка занятости, коллизии,
 * фиксация фигур, удаление линий и счёт.
 *
 * Не зависит от Phaser — логику можно тестировать отдельно.
 */
export class Board {
  private grid: number[][] = [];

  score = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.grid = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
    this.score = 0;
  }

  /** Цвет клетки доски (0 — пусто). */
  getCell(row: number, col: number): number {
    return this.grid[row][col];
  }

  /** Может ли фигура с матрицей shape стоять в позиции (x, y)? */
  collides(shape: number[][], x: number, y: number): boolean {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 0) continue;
        const col = x + c;
        const row = y + r;
        if (col < 0 || col >= COLS) return true;
        if (row >= ROWS) return true;
        if (row >= 0 && this.grid[row][col] !== 0) return true;
      }
    }
    return false;
  }

  /**
   * Записывает фигуру в сетку, удаляет заполненные линии и начисляет очки.
   * Возвращает число удалённых линий.
   */
  lockPiece(shape: number[][], x: number, y: number, color: number): number {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] === 0) continue;
        const row = y + r;
        const col = x + c;
        if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
          this.grid[row][col] = color;
        }
      }
    }
    return this.clearLines();
  }

  private clearLines(): number {
    const remaining = this.grid.filter((row) => row.some((cell) => cell === 0));
    const cleared = ROWS - remaining.length;
    if (cleared === 0) return 0;

    while (remaining.length < ROWS) {
      remaining.unshift(Array<number>(COLS).fill(0));
    }
    this.grid = remaining;

    this.score += LINE_SCORES[Math.min(cleared, LINE_SCORES.length - 1)];
    return cleared;
  }
}
