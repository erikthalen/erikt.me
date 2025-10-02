import { refreshClient } from './refresh.ts'

const html = String.raw

export default ({
  metatags,
  content,
  devMode = false,
}: {
  metatags: {
    head: string
    body: string
  }
  content: string
  devMode?: boolean
}) => html`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      <link rel="icon" type="image/png" href="favicon.png" />

      ${metatags.head}

      <script type="importmap">
        {
          "imports": {
            "simplex-noise": "https://esm.sh/simplex-noise"
          }
        }
      </script>

      <link href="main.css" rel="stylesheet" />
      <script src="app.js" type="module"></script>
      <!-- <script src="generate-image.js" type="module"></script> -->

      ${devMode ? refreshClient : ''}
    </head>

    <body>
      ${metatags.body}

      <main>${content}</main>
    </body>
  </html>`
