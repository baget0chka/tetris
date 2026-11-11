import Phaser from "phaser";
import { BOARD_X } from "./constants";

// --- Цвета и размеры интерфейса --------------------------------------

const TITLE_COLOR = "#38bdf8";
const TEXT_COLOR = "#ffffff";
const HINT_COLOR = "#94a3b8";
const GAME_OVER_PANEL_COLOR = 0x334155;
const GAME_OVER_TITLE_COLOR = "#f87171";
const GAME_OVER_HINT_COLOR = "#cbd5e1";
const PAUSE_PANEL_COLOR = 0x334155;
const PAUSE_TITLE_COLOR = "#fbbf24";
const PAUSE_HINT_COLOR = "#cbd5e1";

/**
 * Статичные элементы интерфейса: заголовок, счёт, подсказка
 * по управлению и панель «Игра окончена».
 */
export class UiRenderer {
  private scoreText!: Phaser.GameObjects.Text;
  private gameOverPanel!: Phaser.GameObjects.Rectangle;
  private gameOverTitle!: Phaser.GameObjects.Text;
  private gameOverScoreText!: Phaser.GameObjects.Text;
  private gameOverHint!: Phaser.GameObjects.Text;
  private pausePanel!: Phaser.GameObjects.Rectangle;
  private pauseTitle!: Phaser.GameObjects.Text;
  private pauseHint!: Phaser.GameObjects.Text;

  constructor(private readonly scene: Phaser.Scene) {
    this.createUi();
  }

  private createUi(): void {
    const { width, height } = this.scene.scale;
    const panelX = BOARD_X / 2; // центр левой панели

    this.scene.add
      .text(panelX, 40, "ТЕТРИС", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        color: TITLE_COLOR,
      })
      .setOrigin(0.5, 0);

    this.scoreText = this.scene.add
      .text(panelX, 120, "СЧЁТ: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: TEXT_COLOR,
      })
      .setOrigin(0.5, 0);

    this.scene.add
      .text(
        panelX,
        height - 16,
        "← → — движение\n↑ — поворот\n↓ — падение быстрее\nПробел — сброс вниз\nP / Esc — пауза\nR / Enter — заново",
        {
          fontFamily: "system-ui, sans-serif",
          fontSize: "16px",
          color: HINT_COLOR,
        },
      )
      .setOrigin(0.5, 1);

    // Панель «Игра окончена» (скрыта до конца игры).
    const cx = width / 2;
    const cy = height / 2;

    this.gameOverPanel = this.scene.add.rectangle(
      cx,
      cy,
      380,
      200,
      GAME_OVER_PANEL_COLOR,
    );
    this.gameOverTitle = this.scene.add
      .text(cx, cy - 55, "ИГРА ОКОНЧЕНА", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: GAME_OVER_TITLE_COLOR,
      })
      .setOrigin(0.5);
    this.gameOverScoreText = this.scene.add
      .text(cx, cy - 10, "Счёт: 0", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: TEXT_COLOR,
      })
      .setOrigin(0.5);
    this.gameOverHint = this.scene.add
      .text(cx, cy + 45, "R или Enter — начать заново", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: GAME_OVER_HINT_COLOR,
      })
      .setOrigin(0.5);

    this.setGameOverVisible(false);

    // Панель «Пауза» (скрыта до нажатия P / Esc).
    this.pausePanel = this.scene.add.rectangle(
      cx,
      cy,
      300,
      140,
      PAUSE_PANEL_COLOR,
    );
    this.pauseTitle = this.scene.add
      .text(cx, cy - 35, "ПАУЗА", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "32px",
        color: PAUSE_TITLE_COLOR,
      })
      .setOrigin(0.5);
    this.pauseHint = this.scene.add
      .text(cx, cy + 25, "P или Esc — продолжить", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "16px",
        color: PAUSE_HINT_COLOR,
      })
      .setOrigin(0.5);

    this.setPauseVisible(false);
  }

  setScore(score: number): void {
    this.scoreText.setText(`СЧЁТ: ${score}`);
  }

  showGameOver(score: number): void {
    this.gameOverScoreText.setText(`Счёт: ${score}`);
    this.setGameOverVisible(true);
    this.setPauseVisible(false);
  }

  hideGameOver(): void {
    this.setGameOverVisible(false);
  }

  private setGameOverVisible(visible: boolean): void {
    this.gameOverPanel.setVisible(visible);
    this.gameOverTitle.setVisible(visible);
    this.gameOverScoreText.setVisible(visible);
    this.gameOverHint.setVisible(visible);
  }

  showPause(): void {
    this.setPauseVisible(true);
  }

  hidePause(): void {
    this.setPauseVisible(false);
  }

  private setPauseVisible(visible: boolean): void {
    this.pausePanel.setVisible(visible);
    this.pauseTitle.setVisible(visible);
    this.pauseHint.setVisible(visible);
  }
}
