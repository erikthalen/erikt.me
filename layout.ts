import { refreshClient } from './refresh.ts'

const html = String.raw

export default ({
  content,
  devMode = false,
}: {
  content: string
  devMode?: boolean
}) => html`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>erik thalén</title>
      <link rel="icon" type="image/png" href="favicon.png" />

      <script type="importmap">
        {
          "imports": {
            "simplex-noise": "https://esm.sh/simplex-noise"
          }
        }
      </script>

      <link href="main.css" rel="stylesheet" />
      <script src="app.js" type="module"></script>

      ${devMode ? refreshClient : ''}
    </head>

    <body>
      <main>${content}</main>
    </body>
  </html>`
