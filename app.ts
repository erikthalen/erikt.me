import http, { type ServerResponse, type IncomingMessage } from 'node:http'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { marked } from 'marked'
import layout from './layout.ts'
import { refreshHandler } from './refresh.ts'

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

  if (url === '/refresh') {
    return refreshHandler(req, res)
  }

  if (ext) {
    const contentType = mimeType[ext]

    if (!contentType) return res.end()

    return res
      .setHeader('Content-Type', mimeType[ext])
      .end(await fsp.readFile(path.join('public', url)))
  } else {
    try {
      const filename = url === '/' ? 'index' : url

      const buffer = await fsp.readFile(path.join('pages', `${filename}.md`), {
        encoding: 'utf-8',
      })

      return res
        .setHeader('Content-Type', 'text/html')
        .end(
          layout(
            marked.parse(buffer.toString()),
            process.env.NODE_ENV === 'dev'
          ),
          'utf-8'
        )
    } catch (error) {
      return res.end('404')
    }
  }
}

const server = http.createServer(handler)

server.listen(3000, () => console.log('http://localhost:3000'))
