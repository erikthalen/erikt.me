/**
 * A piece of text inside a block, optionally linking somewhere
 * @typedef {{ text: string, href?: string }} Run
 *
 * One block level element of the page, with its text as runs
 * @typedef {{ type: string, runs: Run[] }} Block
 *
 * A range of columns on a line that is a link, end is exclusive
 * @typedef {{ start: number, end: number, href: string }} Link
 *
 * One row of text, as it should be shown in the grid
 * @typedef {{ text: string, links: Link[] }} Line
 */

const TEXT_NODE = 3
const ELEMENT_NODE = 1

/**
 * Collects the text below a node as runs, remembering which link each piece is inside of
 * @param {Node} node
 * @param {string | undefined} href
 * @param {Run[]} runs
 * @returns {Run[]}
 */
const collectRuns = (node, href, runs = []) => {
  for (const child of node.childNodes) {
    if (child.nodeType === TEXT_NODE) {
      runs.push(href ? { text: child.data, href } : { text: child.data })
    } else if (child.nodeType === ELEMENT_NODE) {
      collectRuns(child, child.nodeName === 'A' ? child.getAttribute('href') : href, runs)
    }
  }

  return runs
}

/**
 * Reads what the content of the page is, without deciding how it is laid out:
 * one block per element (list items are their own blocks), in document order
 * @param {HTMLElement} dom
 * @returns {Block[]}
 */
export const parse = (dom) => {
  /** @type {Block[]} */
  const blocks = []

  for (const el of dom.childNodes) {
    if (el.nodeType !== ELEMENT_NODE) continue

    if (el.nodeName === 'UL' || el.nodeName === 'OL') {
      for (const item of el.childNodes) {
        if (item.nodeName === 'LI') blocks.push({ type: 'li', runs: collectRuns(item) })
      }
    } else {
      blocks.push({ type: el.nodeName.toLowerCase(), runs: collectRuns(el) })
    }
  }

  return blocks
}

/**
 * Joins the runs of a block into one string, with whitespace collapsed like the browser does,
 * and the links as ranges of that string
 * @param {Run[]} runs
 * @returns {Line}
 */
const flatten = (runs) => {
  let text = ''
  /** @type {Link[]} */
  const links = []

  for (const run of runs) {
    let piece = run.text.replace(/\s+/g, ' ')

    if (text === '' || text.endsWith(' ')) piece = piece.trimStart()

    if (run.href && piece.trim()) {
      links.push({ start: text.length, end: text.length + piece.trimEnd().length, href: run.href })
    }

    text += piece
  }

  return { text: text.trimEnd(), links }
}

/**
 * Lays the blocks out as lines of text: word wrapped at `width` characters,
 * with an empty line between blocks (except between the items of a list)
 * @param {Block[]} blocks
 * @param {number} width max amount of characters on a line
 * @returns {Line[]}
 */
export const layout = (blocks, width) => {
  /** @type {Line[]} */
  const lines = []

  for (const [i, block] of blocks.entries()) {
    const previous = blocks[i - 1]

    if (previous && !(previous.type === 'li' && block.type === 'li')) {
      lines.push({ text: '', links: [] })
    }

    const { text, links } = flatten(block.runs)

    // [start, end) of each line within the text of the block
    const ranges = []
    let start = 0
    let end = 0

    for (const word of text.matchAll(/\S+/g)) {
      const wordEnd = word.index + word[0].length

      if (end > start && wordEnd - start > width) {
        // the word doesn't fit, it starts the next line
        ranges.push([start, end])
        start = word.index
      }

      end = wordEnd
    }

    ranges.push([start, end])

    for (const [from, to] of ranges) {
      lines.push({
        text: text.slice(from, to),
        // the part of each link that is on this line
        links: links
          .filter((link) => link.start < to && link.end > from)
          .map((link) => ({
            start: Math.max(link.start, from) - from,
            end: Math.min(link.end, to) - from,
            href: link.href,
          })),
      })
    }
  }

  return lines
}
