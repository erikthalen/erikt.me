/**
 * Frame timings, to be printed into the grid. Enable with ?debug in the url.
 * "update" is the time spent in update() (grid + DOM writes),
 * "frame" is the time between two frames (16.67ms = 60fps), which also
 * includes the layout and paint the browser does afterwards.
 */

const SAMPLES = 120 // avg and max are over this many frames

const updateTimes = new Float64Array(SAMPLES)
const frameTimes = new Float64Array(SAMPLES)
let sampleCount = 0
let lastFrameAt = 0
let lastRowsDrawn = 0

const ms = (n) => n.toFixed(2).padStart(6)

const stats = (label, samples) => {
  const count = Math.min(sampleCount, SAMPLES)
  let sum = 0
  let max = 0

  for (let i = 0; i < count; i++) {
    sum += samples[i]
    if (samples[i] > max) max = samples[i]
  }

  const last = samples[(sampleCount - 1) % SAMPLES]
  const avg = sum / count

  return { avg, text: `${label} ${ms(last)}ms  avg ${ms(avg)}  max ${ms(max)}` }
}

export default {
  enabled: new URLSearchParams(location.search).has('debug'),

  /** Name of the implementation being measured, printed with the timings */
  label: '',

  /** Increase by one for each row that is written to the DOM during update() */
  rowsDrawn: 0,

  /**
   * Runs and times one update(). Call this once per frame instead of update()
   * @param {() => void} update
   */
  measure(update) {
    this.rowsDrawn = 0

    const start = performance.now()
    update()
    const end = performance.now()

    if (lastFrameAt) {
      updateTimes[sampleCount % SAMPLES] = end - start
      frameTimes[sampleCount % SAMPLES] = start - lastFrameAt
      sampleCount++
    }

    lastFrameAt = start
    lastRowsDrawn = this.rowsDrawn
  },

  /**
   * The timings of the previous frames, as fixed width lines of text
   * @param {number} rowCount amount of rows in the grid
   * @returns {{ top: number, lines: string[] }} the lines, and the grid row the first one goes on
   */
  layout(rowCount) {
    if (sampleCount === 0) return { top: 0, lines: [] }

    const update = stats('update', updateTimes)
    const frame = stats('frame ', frameTimes)
    const drawn = String(lastRowsDrawn).padStart(3)
    const fps = String(Math.round(1000 / frame.avg)).padStart(3)

    const lines = [
      update.text,
      frame.text,
      `drawn  ${drawn} of ${rowCount} rows  ${fps} fps  ${this.label}`,
    ]

    return { top: Math.max(0, rowCount - lines.length - 2), lines }
  },
}
