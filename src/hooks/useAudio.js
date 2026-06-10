import { useEffect, useRef } from 'react'
import { Howl } from 'howler'
import { useApp } from './useApp'

const BACKGROUND_MUSIC_SRC = '/audio/background-music.mp3'
const BACKGROUND_MUSIC_VOLUME = 0.35

export function useAudio() {
  const { isEntered, audioEnabled, onAudioReady } = useApp()
  const soundRef = useRef(null)

  useEffect(() => {
    const sound = new Howl({
      src: [BACKGROUND_MUSIC_SRC],
      html5: true,
      loop: true,
      volume: BACKGROUND_MUSIC_VOLUME,
      preload: true,
      onload: onAudioReady,
      onloaderror: (_, error) => {
        console.error('Failed to load background music.', error)
      },
      onplayerror: (_, error) => {
        console.error('Failed to start background music.', error)
      },
    })

    soundRef.current = sound

    return () => {
      sound.stop()
      sound.unload()
      soundRef.current = null
    }
  }, [onAudioReady])

  useEffect(() => {
    const sound = soundRef.current
    if (!sound) return

    if (!isEntered || !audioEnabled) {
      sound.pause()
      return
    }

    if (!sound.playing()) {
      sound.play()
    }
  }, [isEntered, audioEnabled])
}
