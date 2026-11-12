import { createNoise3D, createNoise2D } from 'simplex-noise'
import { parse, layout } from './parse.js'
import mouse from './mouse.js'
import debug from './debug.js'
import { ASPECT, pxToGrid, gridToPx } from './grid.js'

debug.label = 'new'

const CHARS =
  ".,-—–*:;'()/\\abcdeéfghijklmnopqrstuvwxyz&ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789!?|10\\/)(';:*–—-,. "
    .split('')
    .reverse()

// cell value (-CHARS.length .. CHARS.length * 2 - 1) -> char code of the character it shows, offset by CHARS.length.
// negative values show a space
const CODES = Uint16Array.from({ length: CHARS.length * 3 }, (_, i) =>
  (i < CHARS.length ? ' ' : CHARS[i % CHARS.length]).charCodeAt(0),
)

// the text of the page as lines, word wrapped like the (invisible) text in <main>,
// and where in the grid its first character goes
const lines = layout(parse(document.querySelector('main')), 36)
const ORIGIN = { row: 1, col: 2 }

const noise3D = createNoise3D()
const initNoise2D = createNoise2D()
const initSize = 40

const outputEl = document.createElement('output')
document.body.append(outputEl)

// the random "?" in the text are colored with the CSS Custom Highlight API: one highlight per hue,
// holding the ranges of text that currently have that hue. a "?" starts out red,
// and moves on to the next hue each frame, looping through all of them.
// disabled since it makes safari lag, add ?rainbow to the url to enable it
const RAINBOW = new URLSearchParams(location.search).has('rainbow') && !!CSS.highlights
const HUES = 90
const rainbowSheet = new CSSStyleSheet()
const highlights = Array.from({ length: RAINBOW ? HUES : 0 }, (_, i) => {
  const highlight = new Highlight()

  CSS.highlights.set(`rainbow-${i}`, highlight)
  rainbowSheet.insertRule(`::highlight(rainbow-${i}) { color: hsl(${(i / HUES) * 360} 100% 50%) }`)

  return highlight
})

document.adoptedStyleSheets.push(rainbowSheet)

// the grid, as flat arrays where index = row * colCount + col
let colCount = 0
let rowCount = 0
let grid = new Int16Array(0) // cell values
let chars = new Uint16Array(0) // char code each cell shows
let contentAt = new Int16Array(0) // char the cell should end up as, -1 = none, + CHARS.length = debug ui
let bornAt = new Int32Array(0) // the frame the cell turned into a random "?", 0 = it has no color
let rowIdle = new Uint8Array(0) // 1 = the row is blank and can be skipped
let hadRainbow = false
/** @type {{ node: Text, start: number, end: number }[][]} the text nodes of each row */
let rowSegments = []

const renderRow = (row) => {
  for (const { node, start, end } of rowSegments[row]) {
    node.data = String.fromCharCode.apply(null, chars.subarray(start, end))
  }
}

// where in the DOM the cell at index i starts (or ends, if it's the end of a range)
const boundary = (row, i, isEnd = false) => {
  const { node, start } = rowSegments[row].find(({ end }) => (isEnd ? i <= end : i < end))

  return [node, i - start]
}

// puts each run of cells with the same age in the highlight of that age
const paintRainbow = () => {
  for (const highlight of highlights) if (highlight.size) highlight.clear()

  for (let row = 0; row < rowCount; row++) {
    for (let from = row * colCount, to, last = from + colCount; from < last; from = to) {
      const born = bornAt[from]
      to = from + 1

      if (!born) continue

      while (to < last && bornAt[to] === born) to++

      const [startContainer, startOffset] = boundary(row, from)
      const [endContainer, endOffset] = boundary(row, to, true)

      // static, since writing to a text node collapses the live ranges inside of it
      const hue = (frame - born) % HUES

      highlights[hue].add(
        new StaticRange({ startContainer, startOffset, endContainer, endOffset }),
      )
    }
  }
}

// makes `text` the content of the cells starting at row, col
const stamp = (text, row, col, shift = 0) => {
  if (row >= rowCount) return

  for (let i = 0; i < text.length && col + i < colCount; i++) {
    // characters that can't be shown become spaces
    contentAt[row * colCount + col + i] = Math.max(0, CHARS.indexOf(text[i])) + shift
  }

  rowIdle[row] = 0
}

function resizeGrid() {
  const viewport = pxToGrid(window.innerWidth, window.innerHeight)
  const cols = Math.ceil(viewport.x)
  const rows = Math.ceil(viewport.y)

  // keep the state of the cells that are still visible, new cells start blank
  const kept = new Int16Array(cols * rows)

  for (let row = 0; row < Math.min(rows, rowCount); row++) {
    kept.set(grid.subarray(row * colCount, row * colCount + Math.min(cols, colCount)), row * cols)
  }

  colCount = cols
  rowCount = rows
  grid = kept
  chars = Uint16Array.from(grid, (value) => CODES[value + CHARS.length])
  contentAt = new Int16Array(grid.length).fill(-1)
  bornAt = new Int32Array(grid.length)
  hadRainbow = true
  rowIdle = new Uint8Array(rowCount)
  rowSegments = []

  lines.forEach((line, i) => stamp(line.text, ORIGIN.row + i, ORIGIN.col))

  // one <div> per row, with one text node per run of plain or link characters,
  // so a frame only has to touch the text of the rows that changed
  const rowEls = Array.from({ length: rowCount }, (_, row) => {
    const rowEl = document.createElement('div')
    const links = lines[row - ORIGIN.row]?.links ?? []

    // the columns where a run starts and ends, every other run is a link
    const cuts = [
      0,
      ...links.flatMap((link) => [ORIGIN.col + link.start, ORIGIN.col + link.end]),
      colCount,
    ].map((col) => row * colCount + Math.min(col, colCount))

    rowSegments[row] = []

    for (let i = 0; i < cuts.length - 1; i++) {
      if (cuts[i] === cuts[i + 1]) continue

      const node = document.createTextNode('')
      const parent = i % 2 ? rowEl.appendChild(document.createElement('b')) : rowEl

      parent.append(node)
      rowSegments[row].push({ node, start: cuts[i], end: cuts[i + 1] })
    }

    renderRow(row)

    return rowEl
  })

  outputEl.replaceChildren(...rowEls)
}

resizeGrid()

// intro: cells start below zero and count up to blank
for (let i = 0; i < grid.length; i++) {
  const row = Math.floor(i / colCount)
  const col = i % colCount
  const value = (initNoise2D(row / initSize / ASPECT, col / initSize) + 1) * 0.5

  grid[i] = -Math.floor(value * CHARS.length)
}

window.addEventListener('pointermove', (e) => mouse.setPosition(e.clientX, e.clientY))
window.addEventListener('resize', resizeGrid)
document.documentElement.addEventListener('mouseleave', () => mouse.reset())

let frame = 0

const update = () => {
  frame++

  // the mouse is a circle in px, with a radius of this many columns
  const radius = gridToPx(Math.max(0, mouse.sizeLerped - 1)).x

  let hasRainbow = false

  for (let row = 0; row < rowCount; row++) {
    // the columns of the row that are inside that circle: as far to each side of the mouse
    // as the circle is wide at this row. not a number if the circle doesn't reach the row,
    // which makes the comparisons below false
    const dy = gridToPx(0, mouse.grid.y - row).y
    const reach = pxToGrid(Math.sqrt(radius * radius - dy * dy)).x
    const mouseFrom = Math.floor(mouse.grid.x - reach) + 1
    const mouseTo = Math.ceil(mouse.grid.x + reach) - 1

    // nothing can change in a blank row that the mouse isn't touching
    if (rowIdle[row] && !(mouseFrom <= mouseTo)) continue

    let dirty = false
    let live = 0

    for (let col = 0; col < colCount; col++) {
      const i = row * colCount + col
      const current = grid[i]
      const c = contentAt[i]
      const underMouse = current >= 0 && col >= mouseFrom && col <= mouseTo

      let res
      let isRandom = false

      if (current < 0) {
        res = current + 1
      } else if (underMouse) {
        res = CHARS.indexOf('0')
      } else if (c >= CHARS.length) {
        // debug ui, shown as is
        res = c - CHARS.length
      } else if (c < 0) {
        // no content, cycle until blank
        res = current === 0 ? 0 : (current + 1) % CHARS.length
      } else if (noise3D(row / 5 / ASPECT, col / 5, frame / 500) > 0.9) {
        res = CHARS.indexOf('?')
        isRandom = true
      } else {
        // content, cycle until its character
        res = current === c + CHARS.length ? current : (current + 1) % (CHARS.length * 2)
      }

      // cells get a color when the mouse is over them, or when they turn into a random "?",
      // and keep it until they stop changing
      live |= res

      if (RAINBOW) {
        let born = bornAt[i]

        // a "?" keeps its color until it is back to its character, or the mouse takes over
        if (isRandom) born ||= frame
        else if (underMouse || res === current) born = 0

        bornAt[i] = born
        live |= born
        hasRainbow ||= born !== 0
      }

      if (res !== current) {
        grid[i] = res

        // only redraw the row if a visible character changed
        if (chars[i] !== CODES[res + CHARS.length]) {
          chars[i] = CODES[res + CHARS.length]
          dirty = true
        }
      }
    }

    rowIdle[row] = live === 0 ? 1 : 0

    if (dirty) {
      renderRow(row)
      debug.rowsDrawn++
    }
  }

  // the colors follow the age of the cells, so they move every frame as long as there are any
  if (RAINBOW && (hasRainbow || hadRainbow)) paintRainbow()

  hadRainbow = hasRainbow
}

const tick = () => {
  requestAnimationFrame(tick)

  mouse.updateSize()

  if (debug.enabled) {
    // the debug ui is content that is shown as is, instead of being cycled towards
    const ui = debug.layout(rowCount)
    ui.lines.forEach((line, i) => stamp(line, ui.top + i, ORIGIN.col, CHARS.length))

    debug.measure(update)
  } else {
    update()
  }
}

tick()
