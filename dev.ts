import http, { type ServerResponse, type IncomingMessage } from 'node:http'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { marked } from 'marked'
import layout from './layout.ts'
import { refreshHandler } from './refresh.ts'
import fm from 'front-matter'
import seo from './seo.ts'

const mimeType = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.png': 'image/png',
  '.css': 'text/css',
  '.woff2': 'font/woff2',
}

async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = req.url

  if (!url) return res.end()

  if (url === '/refresh') return refreshHandler(req, res)

  const { ext } = path.parse(url || '')

  if (ext) {
    try {
      const isSupportedMimeType = Object.keys(mimeType).includes(ext)
      const contentType = mimeType[ext as keyof typeof mimeType]

      if (!isSupportedMimeType || !contentType) return res.end()

      return res
        .setHeader('Content-Type', mimeType[ext as keyof typeof mimeType])
        .end(await fsp.readFile(path.join('public', url)))
    } catch (error) {
      res.statusCode = 404
      res.end()
    }
  } else {
    try {
      const filename = url === '/' ? 'index' : url

      const buffer = await fsp.readFile(path.join('pages', `${filename}.md`), {
        encoding: 'utf-8',
      })

      // @ts-ignore
      const content = fm(buffer.toString())

      return res.setHeader('Content-Type', 'text/html').end(
        layout({
          metatags: seo(content.attributes),
          content: await marked.parse(content.body),
          devMode: process.env.NODE_ENV === 'dev',
        }),
        'utf-8'
      )
    } catch (error) {
      console.log(error)
      return res.end('404')
    }
  }
}

http.createServer(handler).listen(3013, () => console.log('http://localhost:3013'))
