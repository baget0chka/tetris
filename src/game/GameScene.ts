import Phaser from "phaser";

// --- Параметры игрового поля -----------------------------------------

const COLS = 10;
const ROWS = 20;
const CELL_SIZE = 32;
const BOARD_X = (960 - COLS * CELL_SIZE) / 2; // 320 — доска по центру экрана
const BOARD_Y = (640 - ROWS * CELL_SIZE) / 2; // 0

// --- Темп игры -------------------------------------------------------

const FALL_INTERVAL_MS = 600; // шаг свободного падения
const SOFT_DROP_INTERVAL_MS = 50; // шаг падения при зажатой стрелке вниз
const MOVE_REPEAT_MS = 90; // повтор движения влево/вправо при удержании
const LINE_SCORES = [0, 100, 300, 500, 800]; // очки за 1..4 линии за раз

// --- Тетромино -------------------------------------------------------

interface Tetromino {
  cells: number[][];
  color: number;
}

const TETROMINOES: Tetromino[] = [
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

interface ActivePiece {
  shape: number[][]; // текущая (возможно, повёрнутая) матрица
  x: number; // колонка верхнего левого угла фигуры
  y: number; // строка верхнего левого угла фигуры
  color: number;
}

/** Поворот матрицы на 90° по часовой стрелке. */
function rotateClockwise(matrix: number[][]): number[][] {
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

/**
 * Тетрис: сверху падают фигуры, из заполненных рядов линии исчезают,
 * при отсутствии места для новой фигуры игра заканчивается.
 *
 * Управление: ← → — движение, ↑ — поворот, ↓ — ускоренное падение,
 * Пробел — мгновенный сброс вниз, R / Enter — начать заново.
 */
export class GameScene extends Phaser.Scene {
  private grid: number[][] = [];
  private cellRects: Phaser.GameObjects.Rectangle[][] = [];
  private piece: ActivePiece | null = null;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private rKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;

  private scoreText!: Phaser.GameObjects.Text;
  private gameOverPanel!: Phaser.GameObjects.Rectangle;
  private gameOverTitle!: Phaser.GameObjects.Text;
  private gameOverScoreText!: Phaser.GameObjects.Text;
  private gameOverHint!: Phaser.GameObjects.Text;

  private score = 0;
  private isGameOver = false;
  private dropTimer = 0;
  private moveTimer = 0;
  private keyHeld = false;
  private wasUpDown = false;
  private wasSpaceDown = false;
  private wasRestartDown = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    if (!this.input.keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.initGrid();
    this.buildBoard();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.rKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );

    this.createUi();

    this.spawnPiece();
    this.draw();
  }

  update(_time: number, delta: number): void {
    this.handleRestart();

    if (this.isGameOver || !this.piece) return;

    this.handleMovement(delta);
    this.handleRotation();
    this.handleHardDrop();
    this.handleGravity(delta);
  }

  // --- Инициализация --------------------------------------------------

  private initGrid(): void {
    this.grid = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(0));
  }

  private buildBoard(): void {
    const width = COLS * CELL_SIZE;
    const height = ROWS * CELL_SIZE;

    // Фон доски.
    this.add.rectangle(
      BOARD_X + width / 2,
      BOARD_Y + height / 2,
      width,
      height,
      0x1e293b,
    );

    // Рамка доски из четырёх полос.
    this.add.rectangle(
      BOARD_X + width / 2,
      BOARD_Y - 2,
      width + 4,
      4,
      0x334155,
    );
    this.add.rectangle(
      BOARD_X + width / 2,
      BOARD_Y + height + 2,
      width + 4,
      4,
      0x334155,
    );
    this.add.rectangle(
      BOARD_X - 2,
      BOARD_Y + height / 2,
      4,
      height + 4,
      0x334155,
    );
    this.add.rectangle(
      BOARD_X + width + 2,
      BOARD_Y + height / 2,
      4,
      height + 4,
      0x334155,
    );

    // Клетки: создаём один раз, дальше только переключаем цвет и видимость.
    for (let row = 0; row < ROWS; row++) {
      const rectRow: Phaser.GameObjects.Rectangle[] = [];
      for (let col = 0; col < COLS; col++) {
        const rect = this.add.rectangle(
          BOARD_X + col * CELL_SIZE + CELL_SIZE / 2,
          BOARD_Y + row * CELL_SIZE + CELL_SIZE / 2,
          CELL_SIZE - 2,
          CELL_SIZE - 2,
          0x0f172a,
        );
        rect.setVisible(false);
        rectRow.push(rect);
      }
      this.cellRects.push(rectRow);
    }
  }

  private createUi(): void {
    const { width, height } = this.scale;
    const panelX = BOARD_X / 2; // центр левой панели

    this.add
      .text(panelX, 40, "ТЕТРИС", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        color: "#38bdf8",
      })
      .setOrigin(0.5, 0);

    this.scoreText = this.add
      .text(panelX, 120, "СЧЁТ: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5, 0);

    this.add
      .text(
        panelX,
        height - 16,
        "← → — движение\n↑ — поворот\n↓ — падение быстрее\nПробел — сброс вниз\nR / Enter — заново",
        {
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          color: "#94a3b8",
        },
      )
      .setOrigin(0.5, 1);

    // Панель «Игра окончена» (скрыта до конца игры).
    const cx = width / 2;
    const cy = height / 2;

    this.gameOverPanel = this.add.rectangle(cx, cy, 380, 200, 0x334155);
    this.gameOverTitle = this.add
      .text(cx, cy - 55, "ИГРА ОКОНЧЕНА", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#f87171",
      })
      .setOrigin(0.5);
    this.gameOverScoreText = this.add
      .text(cx, cy - 10, "Счёт: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.gameOverHint = this.add
      .text(cx, cy + 45, "R или Enter — начать заново", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: "#cbd5e1",
      })
      .setOrigin(0.5);

    this.gameOverPanel.setVisible(false);
    this.gameOverTitle.setVisible(false);
    this.gameOverScoreText.setVisible(false);
    this.gameOverHint.setVisible(false);
  }

  // --- Спавн и игровой цикл ------------------------------------------

  private spawnPiece(): void {
    const tetromino =
      TETROMINOES[Math.floor(Math.random() * TETROMINOES.length)];
    const shape = tetromino.cells.map((row) => [...row]);
    const x = Math.floor((COLS - shape[0].length) / 2);
    const y = 0;

    if (this.collides(shape, x, y)) {
      this.gameOver();
      return;
    }

    this.piece = { shape, x, y, color: tetromino.color };
    this.dropTimer = 0;
    this.draw();
  }

  private handleMovement(delta: number): void {
    let direction = 0;
    if (this.cursors.left.isDown) direction -= 1;
    if (this.cursors.right.isDown) direction += 1;

    if (direction === 0) {
      this.keyHeld = false;
      this.moveTimer = 0;
      return;
    }

    if (!this.keyHeld) {
      this.keyHeld = true;
      this.moveTimer = 0;
      this.movePiece(direction);
      return;
    }

    this.moveTimer += delta;
    if (this.moveTimer >= MOVE_REPEAT_MS) {
      this.movePiece(direction);
      this.moveTimer = 0;
    }
  }

  private handleRotation(): void {
    if (this.cursors.up.isDown && !this.wasUpDown) {
      this.rotatePiece();
    }
    this.wasUpDown = this.cursors.up.isDown;
  }

  private handleHardDrop(): void {
    if (this.spaceKey.isDown && !this.wasSpaceDown) {
      this.hardDrop();
    }
    this.wasSpaceDown = this.spaceKey.isDown;
  }

  private handleGravity(delta: number): void {
    const interval = this.cursors.down.isDown
      ? SOFT_DROP_INTERVAL_MS
      : FALL_INTERVAL_MS;
    this.dropTimer += delta;
    if (this.dropTimer >= interval) {
      this.dropTimer = 0;
      this.stepDown();
    }
  }

  private handleRestart(): void {
    const pressed = this.rKey.isDown || this.enterKey.isDown;
    if (pressed && !this.wasRestartDown) {
      this.restart();
    }
    this.wasRestartDown = pressed;
  }

  // --- Действия с фигурой ---------------------------------------------

  private movePiece(direction: number): void {
    if (this.isGameOver || !this.piece) return;
    if (this.collides(this.piece.shape, this.piece.x + direction, this.piece.y))
      return;

    this.piece.x += direction;
    this.draw();
  }

  private rotatePiece(): void {
    if (this.isGameOver || !this.piece) return;

    const rotated = rotateClockwise(this.piece.shape);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!this.collides(rotated, this.piece.x + kick, this.piece.y)) {
        this.piece.shape = rotated;
        this.piece.x += kick;
        this.draw();
        return;
      }
    }
  }

  private stepDown(): void {
    if (!this.piece) return;

    if (this.collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
      this.lockPiece();
      return;
    }

    this.piece.y += 1;
    this.draw();
  }

  private hardDrop(): void {
    if (this.isGameOver || !this.piece) return;

    while (!this.collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
      this.piece.y += 1;
    }
    this.lockPiece();
  }

  private lockPiece(): void {
    if (!this.piece) return;

    const { shape, x, y, color } = this.piece;
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

    this.piece = null;
    this.clearLines();
    this.spawnPiece();
    this.draw();
  }

  // --- Линии, очки, конец игры ----------------------------------------

  private clearLines(): void {
    const remaining = this.grid.filter((row) => row.some((cell) => cell === 0));
    const cleared = ROWS - remaining.length;
    if (cleared === 0) return;

    while (remaining.length < ROWS) {
      remaining.unshift(Array<number>(COLS).fill(0));
    }
    this.grid = remaining;

    this.score += LINE_SCORES[Math.min(cleared, LINE_SCORES.length - 1)];
    this.scoreText.setText(`СЧЁТ: ${this.score}`);
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.piece = null;

    this.gameOverScoreText.setText(`Счёт: ${this.score}`);
    this.gameOverPanel.setVisible(true);
    this.gameOverTitle.setVisible(true);
    this.gameOverScoreText.setVisible(true);
    this.gameOverHint.setVisible(true);

    this.draw();
  }

  private restart(): void {
    this.initGrid();
    this.score = 0;
    this.isGameOver = false;
    this.dropTimer = 0;
    this.moveTimer = 0;
    this.keyHeld = false;

    this.scoreText.setText("СЧЁТ: 0");
    this.gameOverPanel.setVisible(false);
    this.gameOverTitle.setVisible(false);
    this.gameOverScoreText.setVisible(false);
    this.gameOverHint.setVisible(false);

    this.spawnPiece();
  }

  // --- Коллизии и отрисовка -------------------------------------------

  private collides(shape: number[][], x: number, y: number): boolean {
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

  private draw(): void {
    // Уже зафиксированные на доске фигуры.
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const rect = this.cellRects[row][col];
        const color = this.grid[row][col];
        if (color !== 0) {
          rect.setFillStyle(color, 1);
          rect.setVisible(true);
        } else {
          rect.setVisible(false);
        }
      }
    }

    // Падающая фигура поверх сетки.
    if (this.piece) {
      const { shape, x, y, color } = this.piece;
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
