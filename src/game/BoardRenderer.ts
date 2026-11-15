import Phaser from "phaser";
import { Board } from "./Board";
import { ActivePiece } from "./tetrominoes";
import { BOARD_X, BOARD_Y, CELL_SIZE, COLS, ROWS } from "./constants";

// --- Цвета оформления доски ------------------------------------------

const BOARD_BACKGROUND_COLOR = 0x1e293b;
const BOARD_FRAME_COLOR = 0x334155;
const EMPTY_CELL_COLOR = 0x0f172a;

// --- Сетка поля -------------------------------------------------------

const GRID_LINE_COLOR = 0x334155;
const GRID_LINE_ALPHA = 0.6;
const GRID_LINE_WIDTH = 1;

/**
 * Отрисовка доски: фон, рамка и клетки.
 * Клетки создаются один раз, дальше только переключается цвет и видимость.
 */
export class BoardRenderer {
  private cellRects: Phaser.GameObjects.Rectangle[][] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.buildBoard();
  }

  private buildBoard(): void {
    const width = COLS * CELL_SIZE;
    const height = ROWS * CELL_SIZE;

    // Фон доски.
    this.scene.add.rectangle(
      BOARD_X + width / 2,
      BOARD_Y + height / 2,
      width,
      height,
      BOARD_BACKGROUND_COLOR,
    );

    // Рамка доски из четырёх полос.
    this.scene.add.rectangle(
      BOARD_X + width / 2,
      BOARD_Y - 2,
      width + 4,
      4,
      BOARD_FRAME_COLOR,
    );
    this.scene.add.rectangle(
      BOARD_X + width / 2,
      BOARD_Y + height + 2,
      width + 4,
      4,
      BOARD_FRAME_COLOR,
    );
    this.scene.add.rectangle(
      BOARD_X - 2,
      BOARD_Y + height / 2,
      4,
      height + 4,
      BOARD_FRAME_COLOR,
    );
    this.scene.add.rectangle(
      BOARD_X + width + 2,
      BOARD_Y + height / 2,
      4,
      height + 4,
      BOARD_FRAME_COLOR,
    );

    // Сетка: тонкие линии между клетками. Рисуется поверх фона,
    // но под клетками — заполненные клетки её перекрывают.
    this.drawGrid(width, height);

    // Клетки: создаём один раз, дальше только переключаем цвет и видимость.
    for (let row = 0; row < ROWS; row++) {
      const rectRow: Phaser.GameObjects.Rectangle[] = [];
      for (let col = 0; col < COLS; col++) {
        const rect = this.scene.add.rectangle(
          BOARD_X + col * CELL_SIZE + CELL_SIZE / 2,
          BOARD_Y + row * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE - 2,
          CELL_SIZE - 2,
          EMPTY_CELL_COLOR,
        );
        rect.setVisible(false);
        rectRow.push(rect);
      }
      this.cellRects.push(rectRow);
    }
  }

  /** Рисует линии сетки по границам клеток игрового поля. */
  private drawGrid(width: number, height: number): void {
    const grid = this.scene.add.graphics();
    grid.lineStyle(GRID_LINE_WIDTH, GRID_LINE_COLOR, GRID_LINE_ALPHA);

    for (let col = 1; col < COLS; col++) {
      const x = BOARD_X + col * CELL_SIZE;
      grid.lineBetween(x, BOARD_Y, x, BOARD_Y + height);
    }

    for (let row = 1; row < ROWS; row++) {
      const y = BOARD_Y + row * CELL_SIZE;
      grid.lineBetween(BOARD_X, y, BOARD_X + width, y);
    }
  }

  /** Синхронизирует клетки с состоянием доски и падающей фигуры. */
  draw(board: Board, piece: ActivePiece | null): void {
    // Уже зафиксированные на доске фигуры.
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const rect = this.cellRects[row][col];
        const color = board.getCell(row, col);
        if (color !== 0) {
          rect.setFillStyle(color, 1);
          rect.setVisible(true);
        } else {
          rect.setVisible(false);
        }
      }
    }

    // Падающая фигура поверх сетки.
    if (piece) {
      const { shape, x, y, color } = piece;
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] === 0) continue;
          const row = y + r;
          const col = x + c;
          if (row < 0 || row >= ROWS || col < 0 || col >= COLS) continue;
          this.cellRects[row][col].setFillStyle(color, 1);
          this.cellRects[row][col].setVisible(true);
        }
      }
    }
  }
}
