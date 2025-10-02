import { createNoise3D } from 'simplex-noise'
import { parse } from './parse.js'

const noise3D = createNoise3D()

const container = document.querySelector('main')
const content = container.innerHTML
const { body } = new DOMParser().parseFromString(content, 'text/html')

const CHARS = ".,-—–*:;'()/\\01abcdeéfghijklmnopqrstuvwxyz&ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789!?| "
  .split('')
  .reverse()
const CHAR_SIZE = { X: 9, Y: 18.75 }
const ASPECT = CHAR_SIZE.X / CHAR_SIZE.Y

const data = parse(body)

/** @type number[][] */
let contentData = JSON.parse(JSON.stringify(data))

for (const [i, row] of contentData.entries()) {
  for (let [j, col] of row.entries()) {
    row[j] = CHARS.indexOf(col)
  }

  contentData[i] = row.filter((col) => col !== -1)
}

/**
 * @function
 * @template C
 * @param {() => C} fill
 * @returns {Array<C>}
 */
const cols = (fill) =>
  Array(Math.ceil(window.innerWidth / CHAR_SIZE.X))
    .fill(0)
    .map((_, x) => fill(x))

/**
 * @function
 * @template R
 * @param {() => R} fill
 * @returns {Array<R>}
 */
const rows = (fill) =>
  Array(Math.ceil(window.innerHeight / CHAR_SIZE.Y))
    .fill(0)
    .map((_, y) => fill(y))

let grid = rows((y) =>
  cols((x) => {
    const init = Math.floor(Math.max(0, noise3D(y / 10 / ASPECT, x / 10, 0)) * CHARS.length)

    console.log(init * -1000)

    return init * -1
  })
)

let gridHTML = rows((y) =>
  cols((x) => {
    const init = Math.floor(Math.max(0, noise3D(y / 10 / ASPECT, x / 10, 0)) * CHARS.length)
    return CHARS[init * -1000]
  })
)

function resizeGrid() {
  const newGrid = rows(() => cols(() => 0))
  const newGridHTML = rows(() => cols(() => ' '))

  for (const [i, row] of newGrid.entries()) {
    for (let [j, col] of row.entries()) {
      row[j] = grid[i]?.[j] || row[j]
      newGridHTML[i][j] = gridHTML[i]?.[j] || newGridHTML[i][j]
    }
  }

  grid = newGrid
  gridHTML = newGridHTML
}

const outputEl = document.createElement('output')
document.body.append(outputEl)

const pres = [
  [3, 13],
  [4, 8],
  [20, 2],
  [22, 2],
  [23, 2],
]
const posts = [
  [3, 24],
  [4, 22],
  [20, 7],
  [22, 11],
  [23, 11],
]

/**
 * @param {number} y
 * @param {number} x
 * @returns ("" | "\<b\>")
 */
const b0 = (y, x) => (pres.find((i) => i[0] === y && i[1] === x) ? '<b>' : '')

/**
 * @param {number} y
 * @param {number} x
 * @returns ("" | "\</b\>")
 */
const b1 = (y, x) => (posts.find((i) => i[0] === y && i[1] === x) ? '</b>' : '')

const initMouse = () => ({
  current: { x: undefined, y: undefined },
  last: { x: undefined, y: undefined },
  grid: { x: undefined, y: undefined },
  size: 0,
  sizeLerped: 0,
  setPosition(x, y) {
    this.current.x = x
    this.current.y = y
    this.grid.x = Math.floor(x / CHAR_SIZE.X)
    this.grid.y = Math.floor(y / CHAR_SIZE.Y)
  },
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
  reset() {
    this.current = { x: undefined, y: undefined }
    this.last = { x: undefined, y: undefined }
    this.grid = { x: undefined, y: undefined }
    this.size = 0
    this.sizeLerped = 0
  },
})

let mouse = initMouse()

window.addEventListener('pointermove', (e) => {
  mouse.setPosition(e.clientX, e.clientY)
})

document.documentElement.addEventListener('mouseleave', mouse.reset)
window.addEventListener('resize', resizeGrid)

const lerp = (start, end, amt = 0.2) => (1 - amt) * start + amt * end
const mod = (n, by) => ((n % by) + by) % by
const isOdd = (x, y) => x % 2 === (y % 2 === 0 ? 0 : 1)

let frame = 0

const update = () => {
  frame++

  let output = ''

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const c = contentData[row - 1]?.[col - 2]

      const mousePos = Math.hypot(mouse.grid.x - col, (mouse.grid.y - row) / ASPECT) + 1

      const current = grid[row][col]

      let res = 0

      if (current < 0) {
        res = current + 1
      } else if (isOdd(col, row) && mousePos < mouse.sizeLerped) {
        // is under mouse
        res = CHARS.indexOf('0')
      } else if (typeof c === 'number') {
        // is content
        const noise = noise3D(row / 5 / ASPECT, col / 5, frame / 500)

        if (noise > 0.9) {
          res = CHARS.indexOf('?')
        } else {
          res = current === c ? c : mod(current + 1, CHARS.length)
        }
      } else {
        res = current === 0 ? 0 : mod(current + 1, CHARS.length)
      }

      grid[row][col] = res
      gridHTML[row][col] = b0(row, col) + CHARS[Math.max(0, res)] + b1(row, col)
    }

    output = output.concat(...gridHTML[row], '\n')
  }

  outputEl.innerHTML = output
}

const tick = () => {
  requestAnimationFrame(tick)

  mouse.updateSize()

  update()
}

tick()
