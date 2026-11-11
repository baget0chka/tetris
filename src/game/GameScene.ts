import Phaser from "phaser";
import { Board } from "./Board";
import { BoardRenderer } from "./BoardRenderer";
import { UiRenderer } from "./UiRenderer";
import { InputController } from "./InputController";
import { createPiece } from "./PieceFactory";
import { ActivePiece, rotateClockwise } from "./tetrominoes";
import {
  FALL_INTERVAL_MS,
  PHASE_2_AUTO_DROP_ROW,
  PHASE_2_SCORE,
  PHASE_2_SPEEDUP,
  ROTATION_KICKS,
  SOFT_DROP_INTERVAL_MS,
} from "./constants";

/**
 * Тетрис: сверху падают фигуры, из заполненных рядов линии исчезают,
 * при отсутствии места для новой фигуры игра заканчивается.
 *
 * Управление: ← → — движение, ↑ — поворот, ↓ — ускоренное падение,
 * Пробел — мгновенный сброс вниз, R / Enter — начать заново,
 * P / Esc — пауза и продолжение.
 *
 * Сцена-координатор: связывает модель (Board), ввод (InputController),
 * отрисовку (BoardRenderer) и интерфейс (UiRenderer).
 */
export class GameScene extends Phaser.Scene {
  private board = new Board();
  private boardRenderer!: BoardRenderer;
  private uiRenderer!: UiRenderer;
  private inputController!: InputController;

  private piece: ActivePiece | null = null;

  private isGameOver = false;
  private isPaused = false;
  private isPhase2 = false;
  private dropTimer = 0;

  constructor() {
    super("GameScene");
  }

  create(): void {
    if (!this.input.keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.boardRenderer = new BoardRenderer(this);
    this.uiRenderer = new UiRenderer(this);

    this.inputController = new InputController(this, {
      onMove: (direction) => this.movePiece(direction),
      onRotate: () => this.rotatePiece(),
      onHardDrop: () => this.hardDrop(),
      onRestart: () => this.restart(),
      onTogglePause: () => this.togglePause(),
    });

    this.spawnPiece();
  }

  update(_time: number, delta: number): void {
    this.inputController.update(delta, this.isPaused);

    // Во время паузы и game over игровое состояние не меняется:
    // таймер падения не тикает, движения и спавн не выполняются.
    if (this.isPaused || this.isGameOver || !this.piece) return;

    this.handleGravity(delta);

    // Вторая фаза: фигура мгновенно сбрасывается, достигнув 6-й строки сверху.
    if (this.piece && this.isPhase2 && this.piece.y >= PHASE_2_AUTO_DROP_ROW) {
      this.hardDrop();
    }
  }

  // --- Спавн и гравитация ---------------------------------------------

  private spawnPiece(): void {
    const piece = createPiece();

    if (this.board.collides(piece.shape, piece.x, piece.y)) {
      this.gameOver();
      return;
    }

    this.piece = piece;
    this.dropTimer = 0;
    this.boardRenderer.draw(this.board, this.piece);
  }

  private handleGravity(delta: number): void {
    const speedup = this.isPhase2 ? PHASE_2_SPEEDUP : 1;
    const interval =
      (this.inputController.isSoftDropDown()
        ? SOFT_DROP_INTERVAL_MS
        : FALL_INTERVAL_MS) / speedup;
    this.dropTimer += delta;
    if (this.dropTimer >= interval) {
      this.dropTimer = 0;
      this.stepDown();
    }
  }

  // --- Пауза ------------------------------------------------------------

  private togglePause(): void {
    if (this.isGameOver) return;

    this.isPaused = !this.isPaused;
    this.inputController.reset();

    if (this.isPaused) {
      this.uiRenderer.showPause();
    } else {
      this.uiRenderer.hidePause();
    }
  }

  // --- Действия с фигурой ---------------------------------------------

  private movePiece(direction: number): void {
    if (this.isGameOver || !this.piece) return;
    if (this.board.collides(this.piece.shape, this.piece.x + direction, this.piece.y))
      return;

    this.piece.x += direction;
    this.boardRenderer.draw(this.board, this.piece);
  }

  private rotatePiece(): void {
    if (this.isGameOver || !this.piece) return;

    const rotated = rotateClockwise(this.piece.shape);
    for (const kick of ROTATION_KICKS) {
      if (!this.board.collides(rotated, this.piece.x + kick, this.piece.y)) {
        this.piece.shape = rotated;
        this.piece.x += kick;
        this.boardRenderer.draw(this.board, this.piece);
        return;
      }
    }
  }

  private stepDown(): void {
    if (!this.piece) return;

    if (this.board.collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
      this.lockPiece();
      return;
    }

    this.piece.y += 1;
    this.boardRenderer.draw(this.board, this.piece);
  }

  private hardDrop(): void {
    if (this.isGameOver || !this.piece) return;

    while (!this.board.collides(this.piece.shape, this.piece.x, this.piece.y + 1)) {
      this.piece.y += 1;
    }
    this.lockPiece();
  }

  private lockPiece(): void {
    if (!this.piece) return;

    const { shape, x, y, color } = this.piece;
    const cleared = this.board.lockPiece(shape, x, y, color);
    if (cleared > 0) {
      this.uiRenderer.setScore(this.board.score);

      // Переход во вторую фазу по достижении порога очков.
      if (!this.isPhase2 && this.board.score >= PHASE_2_SCORE) {
        this.isPhase2 = true;
        this.uiRenderer.showPhase2();
      }
    }

    this.piece = null;
    this.spawnPiece();
  }

  // --- Конец игры и рестарт -------------------------------------------

  private gameOver(): void {
    this.isGameOver = true;
    this.piece = null;

    this.uiRenderer.showGameOver(this.board.score);
    this.boardRenderer.draw(this.board, null);
  }

  private restart(): void {
    this.board.reset();
    this.isGameOver = false;
    this.isPaused = false;
    this.isPhase2 = false;
    this.piece = null;
    this.dropTimer = 0;
    this.inputController.reset();

    this.uiRenderer.setScore(0);
    this.uiRenderer.hideGameOver();
    this.uiRenderer.hidePause();
    this.uiRenderer.hidePhase2();

    this.spawnPiece();
  }
}
