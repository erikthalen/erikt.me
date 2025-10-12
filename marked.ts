import { marked } from 'marked'

marked.use({
  renderer: {
    link(e) {
      return `<a href="${e.href}" target="_blank" rel="noopener noreferrer">${e.text}</a>`
    },
  },
})

export { marked }
