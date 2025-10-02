import fsp from 'node:fs/promises'
import path from 'node:path'
import { marked } from 'marked'
import layout from './layout.ts'

// clear out old built files
await fsp.rm('dist', { recursive: true }).catch(() => {})
await fsp.mkdir('dist').catch(() => {})

// copy static files to dist
await fsp.cp('public', 'dist', { recursive: true })

const pages = await fsp.readdir('pages')

// generate static html of all pages
for (const page of pages) {
  try {
    const buffer = await fsp.readFile(path.join('pages', page), { encoding: 'utf-8' })
    const html = await marked.parse(buffer.toString())
    const output = layout({ content: html, devMode: false })
    const { name } = path.parse(page)

    await fsp.writeFile(path.join('dist', `${name}.html`), output)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

process.exit(0)
