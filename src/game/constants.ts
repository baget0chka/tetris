// --- Экран -----------------------------------------------------------

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

// --- Параметры игрового поля -----------------------------------------

export const COLS = 10;
export const ROWS = 20;
export const CELL_SIZE = 32;
export const BOARD_X = (GAME_WIDTH - COLS * CELL_SIZE) / 2; // 320 — доска по центру экрана
export const BOARD_Y = (GAME_HEIGHT - ROWS * CELL_SIZE) / 2; // 0

// --- Темп игры -------------------------------------------------------

export const FALL_INTERVAL_MS = 600; // шаг свободного падения
export const SOFT_DROP_INTERVAL_MS = 50; // шаг падения при зажатой стрелке вниз
export const MOVE_REPEAT_MS = 90; // повтор движения влево/вправо при удержании
export const LINE_SCORES = [0, 100, 300, 500, 800]; // очки за 1..4 линии за раз

// --- Поворот фигуры --------------------------------------------------

/** Допустимые сдвиги по X при повороте у стены (wall kicks). */
export const ROTATION_KICKS = [0, -1, 1, -2, 2];
