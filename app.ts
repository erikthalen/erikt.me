import http, { type ServerResponse, type IncomingMessage } from 'node:http'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { marked } from 'marked'
import layout from './layout.ts'

const mimeType = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.ttf': 'application/x-font-ttf',
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = req.url
  const { ext } = path.parse(url || '')

  if (!url) return res.end()

  if (ext) {
    const contentType = mimeType[ext]

    if (!contentType) return res.end()

    return res
      .setHeader('Content-Type', mimeType[ext])
      .end(await fsp.readFile(path.join('public', url)))
  } else {
    if (url === '/') {
      const buffer = await fsp.readFile(path.join('pages', `${'index'}.md`), {
        encoding: 'utf-8',
      })
      const content = buffer.toString()
      const html = marked.parse(content)
      const page = layout(html)

      return res.setHeader('Content-Type', 'text/html').end(page, 'utf-8')
    }
  }
}

const server = http.createServer(handler)

server.listen(3000, () => console.log('http://localhost:3000'))
