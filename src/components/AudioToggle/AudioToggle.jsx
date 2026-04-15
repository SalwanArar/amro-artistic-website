import { useApp } from '../../context/AppContext'
import './AudioToggle.css'

export default function AudioToggle() {
  const { isEntered, audioEnabled, audioReady, toggleAudio } = useApp()

  if (!isEntered) return null

  return (
    <button
      type="button"
      className="audio-toggle"
      onClick={toggleAudio}
      aria-pressed={audioEnabled}
      aria-label={audioEnabled ? 'Pause background music' : 'Play background music'}
      title={audioEnabled ? 'Pause music' : 'Play music'}
    >
      <span className="audio-toggle__icon" aria-hidden="true">
        {audioEnabled ? (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M11 5 6.5 9H3v6h3.5L11 19V5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="M15 9v6M19 9v6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none">
            <path
              d="M11 5 6.5 9H3v6h3.5L11 19V5Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="m15 9 5 6M20 9l-5 6"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        )}
      </span>
      <span className="audio-toggle__text">
        {audioEnabled ? 'Music on' : 'Music off'}
      </span>
      {!audioReady && <span className="audio-toggle__status">Loading...</span>}
    </button>
  )
}
