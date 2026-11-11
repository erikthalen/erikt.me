/** Size of one cell (character) of the grid, in px */
export const CHAR_SIZE = { X: 9, Y: 18.75 }

/** Width of a cell relative to its height */
export const ASPECT = CHAR_SIZE.X / CHAR_SIZE.Y

/**
 * Converts a position or size in px to columns (x) and rows (y).
 * The result is not rounded, floor it to get the cell a position is in
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
export const pxToGrid = (x, y = 0) => ({ x: x / CHAR_SIZE.X, y: y / CHAR_SIZE.Y })

/**
 * Converts a position or size in columns (x) and rows (y) to px
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
export const gridToPx = (x, y = 0) => ({ x: x * CHAR_SIZE.X, y: y * CHAR_SIZE.Y })
