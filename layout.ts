const html = String.raw

export default (content, refresher) => html`<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Erik Thalén</title>
      <link rel="icon" type="image/png" href="favicon.png" />

      <link href="main.css" rel="stylesheet" />
      <script src="app.js" type="module"></script>

      ${refresher
        ? html`<script>
            const eventSource = new EventSource('http://localhost:3000/refresh')
            eventSource.onmessage = e => {
              setTimeout(
                () => window.location.reload(),
                e.data === 'true' ? 1000 : 0
              )
            }

            console.log(
              '%c REFRESHER ACTIVE ',
              'color: green; background: lightgreen; border-radius: 2px'
            )
          </script>`
        : ''}
    </head>

    <body>
      <main>${content}</main>
    </body>
  </html>`
