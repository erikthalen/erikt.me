import { parse } from "./parse.js"

const content = document.querySelector('main').innerHTML
const dom = new DOMParser().parseFromString(content, 'text/html').body

const data = parse(dom)

console.log(data)