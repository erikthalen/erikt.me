import { type IncomingMessage, type ServerResponse } from 'node:http'
import fs from 'node:fs'
import path from 'node:path'

let responses = new Set<ServerResponse>()

export function refreshHandler(req: IncomingMessage, res: ServerResponse) {
  const headers = {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*',
  }

  responses.add(res)

  res.writeHead(200, headers)

  responses.forEach((res) => res.write(`data: open\n\n`))

  req.on('close', () => responses.delete(res))
}

function requestRefresh(delay: boolean) {
  if (!responses.size) return

  responses.forEach((res) => res.write(`data: ${delay}\n\n`))
}

const watcher = fs.watch(path.resolve('public'), { recursive: true })

watcher.on('change', () => requestRefresh(false))

process.on('exit', () => requestRefresh(true))
process.on('SIGHUP', () => process.exit(128 + 1))
process.on('SIGINT', () => process.exit(128 + 2))
process.on('SIGTERM', () => process.exit(128 + 15))

const html = String.raw

export const refreshClient = html`<script>
  function reload() {
    const retry = async () => {
      if (await fetch('http://localhost:3000').catch(() => false)) window.location.reload()
      else requestAnimationFrame(retry)
    }

    retry()
  }

  const eventSource = new EventSource('http://localhost:3000/refresh')

  eventSource.onmessage = (e) => e.data !== 'open' && reload()
  eventSource.onerror = () => reload()
  eventSource.onopen = () => {
    console.log('%c REFRESHER ACTIVE ', 'color: green; background: lightgreen; border-radius: 2px')
  }
</script>`
