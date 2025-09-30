import { type IncomingMessage, type ServerResponse } from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

let response: ServerResponse | undefined

export function refreshHandler(req: IncomingMessage, res: ServerResponse) {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  }

  response = res

  res.writeHead(200, headers)
  req.on('close', () => (response = undefined))
}

function requestRefresh(delay: boolean) {
  if (!response) return

  response.write(
    `data: ${delay}\n\n`
  )
}

const watcher = fs.watch(path.resolve('.'), { recursive: true })

watcher.on('change', (_, filename) => {
  if (!response) return

  requestRefresh(false)
})

process.on('exit', () => {
  requestRefresh(true)
})

process.on('SIGHUP', () => process.exit(128 + 1))
process.on('SIGINT', () => process.exit(128 + 2))
process.on('SIGTERM', () => process.exit(128 + 15))
