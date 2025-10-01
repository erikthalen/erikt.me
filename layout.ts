import { refreshClient } from './refresh.ts'

const html = String.raw

export default (content, refresher) => html`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>erik thalén</title>
      <link rel="icon" type="image/png" href="favicon.png" />

      <link href="main.css" rel="stylesheet" />
      <script src="app.js" type="module"></script>

      ${refresher ? refreshClient : ''}
    </head>

    <body>
      <main>${content}</main>
    </body>
  </html>`
