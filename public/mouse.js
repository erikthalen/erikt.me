const CHAR_SIZE = { X: 9, Y: 18.75 }

const lerp = (start, end, amt = 0.2) => (1 - amt) * start + amt * end

const initMouse = () => ({
  current: { x: undefined, y: undefined },
  last: { x: undefined, y: undefined },
  grid: { x: undefined, y: undefined },
  size: 0,
  sizeLerped: 0,
  /**
   * Sets the current position of the mouse. Call this on mousemove
   * @param {number} x
   * @param {number} y
   */
  setPosition(x, y) {
    this.current.x = x
    this.current.y = y
    this.grid.x = Math.floor(x / CHAR_SIZE.X)
    this.grid.y = Math.floor(y / CHAR_SIZE.Y)
  },
  /**
   * Updated the size and lerped size of the cursor. Call this on each rAF
   */
  updateSize() {
    if (!this.last.x) {
      this.size = 0
    } else {
      this.size = Math.hypot(this.current.x - this.last.x, this.current.y - this.last.y) ** 0.9
      this.sizeLerped = lerp(this.sizeLerped || 0, this.size, 0.1)
    }

    this.last.x = this.current.x
    this.last.y = this.current.y
  },
  /**
   * Sets all mouse values to undefined. Call this when cursor leaves the viewport
   */
  reset() {
    this.current = { x: undefined, y: undefined }
    this.last = { x: undefined, y: undefined }
    this.grid = { x: undefined, y: undefined }
    this.size = 0
    this.sizeLerped = 0
  },
})

export default initMouse()
