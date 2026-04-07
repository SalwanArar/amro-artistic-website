// src/utils/assetLoader.js
// ─────────────────────────────────────────────────────────────────
// Preloads all heavy assets (frames, audio, etc.) before the user
// enters the site. Reports progress via a callback so the Preloader
// UI can display accurate percentage + current file name.
//
// Usage:
//   import { loadAllAssets } from './assetLoader'
//   await loadAllAssets(onProgress)   // onProgress(pct, label)
// ─────────────────────────────────────────────────────────────────

// ── FRAME CONFIG ─────────────────────────────────────────────────
const FRAME_COUNT  = 483                    // frame_00000 → frame_00482
const FRAME_DIR    = '/frames/'
const FRAME_PREFIX = 'frame_'
const FRAME_EXT    = '.png'

// Zero-pad a number to 5 digits: 0 → "00000", 42 → "00042"
const pad5 = n => String(n).padStart(5, '0')

// Build the full ordered list of frame URLs
export const buildFrameUrls = () =>
  Array.from({ length: FRAME_COUNT }, (_, i) =>
    `${FRAME_DIR}${FRAME_PREFIX}${pad5(i)}${FRAME_EXT}`
  )

// ── AUDIO ASSETS ─────────────────────────────────────────────────
// Add your audio files here as you produce them.
// Each entry: { url: string, label: string }
const AUDIO_ASSETS = [
  // { url: '/audio/bg-music.mp3',  label: 'Background music'  },
  // { url: '/audio/sfx-click.mp3', label: 'Click SFX'         },
]

// ── OTHER ASSETS (fonts loaded via CSS, no entry needed) ─────────

// ── CORE LOADER ──────────────────────────────────────────────────
// Loads a single Image and resolves when it's decoded and ready
// to paint — meaning it can be drawn to a <canvas> immediately.
const loadImage = url =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src     = url
  })

// Loads a single audio file via fetch so the browser caches it.
const loadAudio = url =>
  fetch(url, { cache: 'force-cache' }).then(r => {
    if (!r.ok) throw new Error(`Failed to load audio: ${url}`)
  })

// ── BATCH LOADER ─────────────────────────────────────────────────
// Loads assets in parallel batches to maximise throughput while
// staying within browser connection limits (~6 per origin).
const BATCH_SIZE = 10

const loadInBatches = async (tasks, onProgress, startPct, endPct) => {
  const results = []
  const total   = tasks.length
  let   done    = 0

  for (let i = 0; i < total; i += BATCH_SIZE) {
    const batch = tasks.slice(i, i + BATCH_SIZE)

    const batchResults = await Promise.allSettled(
      batch.map(async task => {
        const result = await task.fn()
        done++
        const pct   = startPct + ((done / total) * (endPct - startPct))
        onProgress(Math.round(pct), task.label)
        return result
      })
    )
    results.push(...batchResults)
  }

  return results
}

// ── PUBLIC API ────────────────────────────────────────────────────
// loadAllAssets(onProgress) → Promise<{ frames: Image[], ... }>
//
// onProgress(pct: number, label: string) is called after each asset.
// pct is 0–100. label is a human-readable name for the loading UI.
//
// The returned object is cached on the module so Intro.jsx can import
// and use the frames directly without reloading.
let _cache = null

export const loadAllAssets = async (onProgress = () => {}) => {
  if (_cache) {
    onProgress(100, 'Already loaded')
    return _cache
  }

  // ── Phase 1: frames (0 → 95 %) ─────────────────────────────────
  const frameUrls = buildFrameUrls()
  const frameImages = new Array(FRAME_COUNT)

  const frameTasks = frameUrls.map((url, i) => ({
    label: `Frame ${i + 1} / ${FRAME_COUNT}`,
    fn: async () => {
      const img = await loadImage(url)
      frameImages[i] = img   // store in order
      return img
    },
  }))

  await loadInBatches(frameTasks, onProgress, 0, AUDIO_ASSETS.length > 0 ? 95 : 100)

  // ── Phase 2: audio (95 → 100 %) ────────────────────────────────
  if (AUDIO_ASSETS.length > 0) {
    const audioTasks = AUDIO_ASSETS.map(({ url, label }) => ({
      label,
      fn: () => loadAudio(url),
    }))
    await loadInBatches(audioTasks, onProgress, 95, 100)
  }

  onProgress(100, 'Ready')

  _cache = { frames: frameImages }
  return _cache
}

// Expose the cache directly so Intro.jsx can grab frames
// without going through the async load path again.
export const getLoadedAssets = () => _cache