// src/utils/assetLoader.js
// ─────────────────────────────────────────────────────────────────
// Preloads all heavy assets (frames, audio) before the user enters
// the site. Reports progress via a callback so the Preloader UI can
// display accurate percentage + current file name.
//
// Assets live in src/assets/ so Vite resolves and hashes their URLs
// at build time — no manual base-URL prefixing required.
// ─────────────────────────────────────────────────────────────────

// ── FRAME URLS ───────────────────────────────────────────────────
// Vite resolves each PNG at build time and returns its final URL
// (hashed, base-prefixed). Sorted by filename → correct frame order.
const _frameGlob = import.meta.glob(
  '../assets/frames/*.png',
  { query: '?url', import: 'default', eager: true }
)

const _frameUrls = Object.entries(_frameGlob)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url)

const FRAME_COUNT = _frameUrls.length

export const buildFrameUrls = () => _frameUrls

// ── AUDIO ASSETS ─────────────────────────────────────────────────
const AUDIO_ASSETS = [
  // { url: bgMusicUrl, label: 'Background music' },
]

// ── CORE LOADER ──────────────────────────────────────────────────
const loadImage = url =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload  = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src     = url
  })

const loadAudio = url =>
  fetch(url, { cache: 'force-cache' }).then(r => {
    if (!r.ok) throw new Error(`Failed to load audio: ${url}`)
  })

// ── BATCH LOADER ─────────────────────────────────────────────────
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
        onProgress(Math.round(startPct + (done / total) * (endPct - startPct)), task.label)
        return result
      })
    )
    results.push(...batchResults)
  }

  return results
}

// ── PUBLIC API ────────────────────────────────────────────────────
let _cache = null

export const loadAllAssets = async (onProgress = () => {}) => {
  if (_cache) {
    onProgress(100, 'Already loaded')
    return _cache
  }

  const frameImages = new Array(FRAME_COUNT)
  const frameTasks  = _frameUrls.map((url, i) => ({
    label: `Frame ${i + 1} / ${FRAME_COUNT}`,
    fn: async () => {
      const img = await loadImage(url)
      frameImages[i] = img
      return img
    },
  }))

  await loadInBatches(frameTasks, onProgress, 0, AUDIO_ASSETS.length > 0 ? 95 : 100)

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

export const getLoadedAssets = () => _cache
