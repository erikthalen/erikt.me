import fsp from 'node:fs/promises'
import path from 'node:path'
import fm from 'front-matter'
import { marked } from './marked.ts'
import { defaultLayout } from './layouts/index.ts'
import seo from './seo.ts'

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

    // @ts-ignore
    const content = fm(buffer.toString())

    const output = defaultLayout({
      metatags: seo(content.attributes),
      content: await marked.parse(content.body),
      devMode: false,
    })

    const { name } = path.parse(page)

    await fsp.writeFile(path.join('dist', `${name}.html`), output)
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

process.exit(0)
