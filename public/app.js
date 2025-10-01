import { parse } from './parse.js'

const container = document.querySelector('main')
const content = container.innerHTML
const { body } = new DOMParser().parseFromString(content, 'text/html')

const CHARS =
  " .,-—–*:;'()/\\01abcdeéfghijklmnopqrstuvwxyz?&ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789!|".split('')
const CHAR_SIZE = { X: 9, Y: 18.75 }

const data = parse(body)

/** @type number[][] */
let intData = JSON.parse(JSON.stringify(data))

for (const row of intData) {
  for (let [i, col] of row.entries()) {
    row[i] = CHARS.indexOf(col)
  }
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
    .map(() => fill())

/**
 * @function
 * @template R
 * @param {() => R} fill
 * @returns {Array<R>}
 */
const rows = (fill) =>
  Array(Math.ceil(window.innerHeight / CHAR_SIZE.Y))
    .fill(0)
    .map(() => fill())

const grid = rows(() => cols(() => '|'))

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

const b0 = (y, x) => (pres.find((i) => i[0] === y && i[1] === x) ? '<b>' : '')
const b1 = (y, x) => (posts.find((i) => i[0] === y && i[1] === x) ? '</b>' : '')

// mouse
let oldMouse = { x: undefined, y: undefined }
let mouse = { x: undefined, y: undefined }
let mouseCol = { x: undefined, y: undefined }
let circleLerped = 0

window.addEventListener('pointermove', (e) => {
  mouse.x = e.clientX
  mouse.y = e.clientY
  mouseCol.x = Math.floor(e.clientX / CHAR_SIZE.X)
  mouseCol.y = Math.floor(e.clientY / CHAR_SIZE.Y)
})

window.addEventListener('pointerleave', (e) => {
  mouse.x = undefined
  mouse.y = undefined
  mouseCol.x = undefined
  mouseCol.y = undefined
})

const update = () => {
  let output = ''

  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      const c = intData[i - 1]?.[j - 2]

      const circle = Math.hypot(mouseCol.x - j, (mouseCol.y - i) / (CHAR_SIZE.X / CHAR_SIZE.Y))

      let output = ' '
      const clean = grid[i][j].replace('<b>', '').replace('</b>', '')

      if (circle < circleLerped) {
        output = '|'
      } else if (typeof c === 'number' && c !== -1 && clean === CHARS[c]) {
        output = CHARS[c]
      } else {
        output = CHARS[Math.max(0, CHARS.indexOf(clean) - 1)]
      }

      grid[i][j] = b0(i, j) + output + b1(i, j)
    }

    output = output.concat(...grid[i], '\n')
  }

  outputEl.innerHTML = output
}

function lerp(start, end, amt = 0.2) {
  return (1 - amt) * start + amt * end
}

const tick = () => {
  requestAnimationFrame(tick)

  const circleSize = Math.hypot(mouse.x - oldMouse.x, mouse.y - oldMouse.y)

  circleLerped = lerp(circleLerped, circleSize, 0.1)

  update()

  oldMouse.x = mouse.x || 0
  oldMouse.y = mouse.y || 0
}

tick()

// console.log(output, intData)
