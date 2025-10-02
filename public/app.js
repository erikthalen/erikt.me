import { createNoise3D, createNoise2D } from 'simplex-noise'
import { parse } from './parse.js'
import mouse from './mouse.js'

const noise3D = createNoise3D()

const container = document.querySelector('main')
const content = container.innerHTML
const { body } = new DOMParser().parseFromString(content, 'text/html')

const CHARS =
  ".,-—–*:;'()/\\abcdeéfghijklmnopqrstuvwxyz&ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789!?|10\\/)(';:*–—-,. "
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

const initSize = 4
const initNoise2D = createNoise2D()

let grid = rows((y) =>
  cols((x) => {
    const value = (initNoise2D(y / initSize / ASPECT, x / initSize) + 1) * 0.5
    const init = Math.floor(value * CHARS.length)
    return init * -1
  })
)

let gridHTML = rows((y) =>
  cols((x) => {
    const value = (initNoise2D(y / initSize / ASPECT, x / initSize) + 1) * 0.5
    const init = Math.floor(value * CHARS.length)
    return CHARS[init * -1]
  })
)

function resizeGrid() {
  const newGrid = rows(() => cols(() => 0))
  const newGridHTML = rows(() => cols(() => ' '))

  for (const [i, row] of newGrid.entries()) {
    for (let [j] of row.entries()) {
      row[j] = grid[i]?.[j] || row[j]
      newGridHTML[i][j] = gridHTML[i]?.[j] || newGridHTML[i][j]
    }
  }

  grid = newGrid
  gridHTML = newGridHTML
}

const outputEl = document.createElement('output')
document.body.append(outputEl)

const linkStarts = [
  [3, 13],
  [4, 8],
  [20, 2],
  [22, 2],
  [23, 2],
]

const linkEnds = [
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
const b0 = (y, x) => (linkStarts.find((i) => i[0] === y && i[1] === x) ? '<b>' : '')

/**
 * @param {number} y
 * @param {number} x
 * @returns ("" | "\</b\>")
 */
const b1 = (y, x) => (linkEnds.find((i) => i[0] === y && i[1] === x) ? '</b>' : '')

window.addEventListener('pointermove', (e) => {
  mouse.setPosition(e.clientX, e.clientY)
})

document.documentElement.addEventListener('mouseleave', mouse.reset)
window.addEventListener('resize', resizeGrid)

const mod = (n, by) => ((n % by) + by) % by
const isOdd = (x, y) => x % 2 === (y % 2 === 0 ? 0 : 1)

let frame = 0

export const isInsideTriangle = (s, a, b, c) => {
  let as_x = s[0] - a[0]
  let as_y = s[1] - a[1]

  let s_ab = (b[0] - a[0]) * as_y - (b[1] - a[1]) * as_x > 0

  if ((c[0] - a[0]) * as_y - (c[1] - a[1]) * as_x > 0 == s_ab) return false
  if ((c[0] - b[0]) * (s[1] - b[1]) - (c[1] - b[1]) * (s[0] - b[0]) > 0 != s_ab) return false
  return true
}

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
