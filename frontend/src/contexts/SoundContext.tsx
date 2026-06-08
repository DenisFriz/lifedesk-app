import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
  useCallback
} from 'react'

import taskDone from '@/assets/audio/task-done.mp3'
import deleteSound from '@/assets/audio/delete.mp3'
import archived from '@/assets/audio/archived.mp3'
import goalAchieved from '@/assets/audio/goal-achieved.mp3'
import notification from '@/assets/audio/notification.mp3'

type SoundName = 'task-done' | 'delete' | 'archived' | 'goal-achieved' | 'notification'

type SoundContextType = {
  soundEnabled: boolean
  setSoundEnabled: React.Dispatch<React.SetStateAction<boolean>>
  playSound: (soundName: SoundName) => void
}

const SoundContext = createContext<SoundContextType | null>(null)

const soundMap: Record<SoundName, string> = {
  'task-done': taskDone,
  delete: deleteSound,
  archived,
  'goal-achieved': goalAchieved,
  notification
}

const audioCache: Partial<Record<SoundName, HTMLAudioElement>> = {}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const isMounted = useRef(false)

  useEffect(() => {
    const saved = localStorage.getItem('sound-enabled')
    if (saved !== null) {
      setSoundEnabled(saved === 'true')
    }
  }, [])

  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true
      return
    }
    localStorage.setItem('sound-enabled', String(soundEnabled))
  }, [soundEnabled])

  useEffect(() => {
    Object.entries(soundMap).forEach(([name, url]) => {
      const soundName = name as SoundName

      if (!audioCache[soundName]) {
        audioCache[soundName] = new Audio(url)
        audioCache[soundName]?.load()
      }
    })
  }, [])

  const playSound = useCallback(
    (soundName: SoundName) => {
      if (!soundEnabled) return

      const audio = audioCache[soundName]

      if (!audio) return

      audio.currentTime = 0

      audio.play().catch(() => {})
    },
    [soundEnabled]
  )

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        playSound
      }}
    >
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)

  if (!context) {
    throw new Error('useSound must be used within SoundProvider')
  }

  return context
}
