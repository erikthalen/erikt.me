export const parse = dom => {
  const els = [...dom.childNodes]

  let data = []
  let currentLine = []

  for (const el of els) {
    let words = el.textContent.split(' ')

    const isUL = el.nodeName === 'UL'

    if (el.nodeName === 'UL') {
      words = el.textContent.split('\n').filter(Boolean)
    }

    for (const [j, word] of words.entries()) {
      const letters = word.split('')

      for (const letter of letters) {
        if (letter === '\n') {
          currentLine.push('')
        } else {
          currentLine.push(letter)
        }
      }

      currentLine.push(' ')

      const MAX_LENGTH = 40
      const nextWord = words[j + 1]

      if (
        isUL ||
        !nextWord ||
        currentLine.length + (nextWord.length + 1) > MAX_LENGTH
      ) {
        // next word can't fit in line, need line break
        data.push(currentLine.slice(0, currentLine.length - 1))
        currentLine = []
      }
    }
  }

  return data
}
