import Phaser from "phaser";
import { MOVE_REPEAT_MS } from "./constants";

/** Семантические действия, которые сцена выполняет по нажатиям клавиш. */
export interface InputCallbacks {
  onMove: (direction: number) => void;
  onRotate: () => void;
  onHardDrop: () => void;
  onRestart: () => void;
  onTogglePause: () => void;
}

/**
 * Клавиатура: стрелки, пробел, R, Enter, P и Esc.
 * Отслеживает удержания (повтор движения влево/вправо)
 * и «передние фронты» нажатий (поворот, сброс, рестарт, пауза без автоповтора).
 * Во время паузы обрабатывается только переключение паузы.
 */
export class InputController {
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private rKey!: Phaser.Input.Keyboard.Key;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private pKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;

  private moveTimer = 0;
  private keyHeld = false;
  private wasUpDown = false;
  private wasSpaceDown = false;
  private wasRestartDown = false;
  private wasPauseDown = false;

  constructor(
    scene: Phaser.Scene,
    private readonly callbacks: InputCallbacks,
  ) {
    if (!scene.input.keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }

    this.cursors = scene.input.keyboard.createCursorKeys();
    this.spaceKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE,
    );
    this.rKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.R,
    );
    this.enterKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER,
    );
    this.pKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.P,
    );
    this.escKey = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ESC,
    );
  }

  update(delta: number, isPaused: boolean): void {
    this.handlePause();

    if (isPaused) {
      // Синхронизируем «фронты» нажатий, чтобы после снятия паузы
      // зажатые во время паузы клавиши не вызывали действий.
      this.wasUpDown = this.cursors.up.isDown;
      this.wasSpaceDown = this.spaceKey.isDown;
      this.wasRestartDown = this.rKey.isDown || this.enterKey.isDown;
      return;
    }

    this.handleRestart();
    this.handleMovement(delta);
    this.handleRotation();
    this.handleHardDrop();
  }

  /** Зажата ли стрелка вниз (ускоренное падение). */
  isSoftDropDown(): boolean {
    return this.cursors.down.isDown;
  }

  /** Сбрасывает состояние удержаний (при рестарте). */
  reset(): void {
    this.moveTimer = 0;
    this.keyHeld = false;
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
      this.callbacks.onMove(direction);
      return;
    }

    this.moveTimer += delta;
    if (this.moveTimer >= MOVE_REPEAT_MS) {
      this.callbacks.onMove(direction);
      this.moveTimer = 0;
    }
  }

  private handleRotation(): void {
    if (this.cursors.up.isDown && !this.wasUpDown) {
      this.callbacks.onRotate();
    }
    this.wasUpDown = this.cursors.up.isDown;
  }

  private handleHardDrop(): void {
    if (this.spaceKey.isDown && !this.wasSpaceDown) {
      this.callbacks.onHardDrop();
    }
    this.wasSpaceDown = this.spaceKey.isDown;
  }

  private handleRestart(): void {
    const pressed = this.rKey.isDown || this.enterKey.isDown;
    if (pressed && !this.wasRestartDown) {
      this.callbacks.onRestart();
    }
    this.wasRestartDown = pressed;
  }

  private handlePause(): void {
    const pressed = this.pKey.isDown || this.escKey.isDown;
    if (pressed && !this.wasPauseDown) {
      this.callbacks.onTogglePause();
    }
    this.wasPauseDown = pressed;
  }
}
