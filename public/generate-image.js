const outputEL = document.createElement('output')

document.body.append(outputEL)

const CHAR_SIZE = { X: 9, Y: 18.75 }

const size = {
  x: Math.ceil(1024 / CHAR_SIZE.X),
  y: Math.ceil(720 / CHAR_SIZE.Y),
}

const mod = (n, by) => ((n % by) + by) % by

const CHARS =
  " .,-—–*:;'()/\\abcdeéfghijklmnopqrstuvwxyz&ABCDEFGHIJKLMNOPQRSTUVWXYZ23456789!?|10".split('')

const cols = (size, fill) => [...Array(size).keys()].map(fill)

const grid = cols(size.y, () => cols(size.x, () => 'O'))

let output = ''

for (const [row, content] of grid.entries()) {
  for (const [col] of content.entries()) {
    const out = (row * 1000) >> (col / 100)
    console.log(out)
    grid[row][col] = CHARS[mod(out, CHARS.length)] || ' '
  }
}

for (const row of grid) {
  output += row.join('') + '\n'
}

outputEL.innerHTML = output
