import fsp from 'node:fs/promises'
import path from 'node:path'
import layout from './layout.ts'
import { marked } from 'marked'

await fsp.rm('dist', { recursive: true }).catch(() => {})
await fsp.mkdir('dist').catch(() => {})

const pages = await fsp.readdir('pages')

for (const page of pages) {
  try {
    const content = await getContent(page)
    const html = marked.parse(content)
    const result = layout(html)
    const { name } = path.parse(page)

    await fsp.writeFile(path.join('dist', `${name}.html`), result)
    console.log()
  } catch (error) {
    console.log(error)
  }
}

await fsp.cp('public', 'dist', { recursive: true })

async function getContent(filename: string) {
  const buffer = await fsp.readFile(path.join('pages', filename), {
    encoding: 'utf-8',
  })

  return buffer.toString()
}
