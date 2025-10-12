import { toJpeg } from 'html-to-image'

const outputEL = document.createElement('output')

document.body.append(outputEL)

const CHAR_SIZE = { X: 9, Y: 18.75 }

const size = {
  x: Math.ceil(1024 / CHAR_SIZE.X),
  y: Math.ceil(720 / CHAR_SIZE.Y),
}

const mod = (n, by) => ((n % by) + by) % by

const CHARS =
  " .,-—–()/\\!?|10".split('')
// const CHARS =
//   " .,-—–*:;'()/\\abcdeéfghijklmnopqrstuvwxyz&ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789!?|10".split('')

const cols = (size, fill) => [...Array(size).keys()].map(fill)

const grid = cols(size.y, () => cols(size.x, () => 'O'))

let output = ''

for (const [row, content] of grid.entries()) {
  for (const [col] of content.entries()) {
    const r = Math.floor(row / 5) * 5
    const c = Math.floor(col / 10) * 10
    const r2 = Math.floor(row / 8) * 8
    const c2 = Math.floor(col / 14) * 14

    let out = ((r + 1) * 10) >> (c + 1)
    out += ((r + 1) * 1) << (c + 1)

    out += (r2 + 1) % ((c2 + 1) / 10)
    out += ((r2 + 1) * 1) << (c2 + 1)

    out += (col + 1) / 100
    out += ((row + 1) * 1)

    grid[row][col] = CHARS[Math.round(mod(out, CHARS.length))] || ' '
  }
}

for (const row of grid) {
  output += row.join('') + '\n'
}

// outputEL.style.position = 'relative'
outputEL.innerHTML = output

const dataUrl = await toJpeg(outputEL, { quality: 1, backgroundColor: 'white' })

const img = new Image()

img.src = dataUrl

img.style.width = '1000px'

document.body.append(img)

outputEL.style.opacity = '0'
