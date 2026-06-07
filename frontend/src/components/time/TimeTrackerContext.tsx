import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode
} from 'react'
import { useQuery, useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { format } from 'date-fns'
import IdleDialog from './IdleDialog'
import LongRunningDialog from './LongRunningDialog'
import { db, TimeEntryRecord } from '@/db'
import { timeEntryRepository } from '@/repositories/timeentry.repository'

interface TimeTrackerContextValue {
  runningEntry: TimeEntryRecord | null
  stopTimerMutation: UseMutationResult<any, any, string, any>
  isPaused: boolean
  elapsedTime: number
  handlePause: () => void
  handleResume: () => void
}

const TimeTrackerContext = createContext<TimeTrackerContextValue | null>(null)

export const useTimeTracker = (): TimeTrackerContextValue => {
  const context = useContext(TimeTrackerContext)
  if (!context) {
    throw new Error('useTimeTracker must be used within a TimeTrackerProvider')
  }
  return context
}

// Settings helpers (localStorage)
const getIdleThreshold = () => parseInt(localStorage.getItem('trackerIdleThreshold') || '10', 10)
const getRemindersEnabled = () => localStorage.getItem('trackerRemindersEnabled') !== 'false'

interface TimeTrackerProviderProps {
  children: ReactNode
}

interface IdleDialogState {
  idleMinutes: number
}

interface LongRunningDialogState {
  hours: number
}

export const TimeTrackerProvider = ({ children }: TimeTrackerProviderProps) => {
  const queryClient = useQueryClient()
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [elapsedTime, setElapsedTime] = useState<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Idle / visibility state
  const lastActivityRef = useRef<number>(Date.now())
  const pausedAtRef = useRef<number | null>(null) // timestamp when auto-paused
  const [idleDialog, setIdleDialog] = useState<IdleDialogState | null>(null) // { idleMinutes }
  const [longRunningDialog, setLongRunningDialog] = useState<LongRunningDialogState | null>(null) // { hours }
  const longRunningAlertedRef = useRef<Set<number>>(new Set()) // track which hour marks were alerted

  const { data: runningEntry } = useQuery({
    queryKey: ['runningTimeEntry'],
    queryFn: async () => {
      const entry = await db.timeentries.filter(e => e.is_running && !e.is_deleted).first()
      return entry || null
    }
  })

  // Initialize timer from running entry
  useEffect(() => {
    if (runningEntry) {
      const startTime = new Date(`${runningEntry.date}T${runningEntry.start_time}`)
      const now = new Date()
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
      const previousDuration = runningEntry.duration || 0
      const previousDurationSeconds = previousDuration * 60
      setElapsedTime(elapsed + previousDurationSeconds)

      if (!isPaused) {
        startInterval()
      }
    } else {
      setElapsedTime(0)
      setIsPaused(false)
      longRunningAlertedRef.current.clear()
      stopInterval()
    }
  }, [runningEntry])

  const startInterval = (): void => {
    if (intervalRef.current) return
    intervalRef.current = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)
  }

  const stopInterval = (): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const handlePause = useCallback((): void => {
    stopInterval()
    setIsPaused(true)
  }, [])

  const handleResume = useCallback((): void => {
    startInterval()
    setIsPaused(false)
    lastActivityRef.current = Date.now()
  }, [])

  const stopTimerMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const now = new Date()
      const endTime = format(now, 'HH:mm:ss')
      const entry = queryClient.getQueryData<TimeEntryRecord>(['runningTimeEntry'])
      const startTime = entry ? new Date(`${entry.date}T${entry.start_time}`) : now
      const durationMs = now.getTime() - startTime.getTime()
      const newDurationMinutes = Math.round(durationMs / 60000)
      const newDuration = newDurationMinutes === 0 && durationMs > 0 ? 1 : newDurationMinutes
      const previousDuration = entry?.duration || 0
      const totalDuration = previousDuration + newDuration

      return timeEntryRepository.update(entryId, {
        end_time: endTime,
        duration: totalDuration,
        is_running: false
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['runningTimeEntry'] })
      queryClient.invalidateQueries({ queryKey: ['timeentries'] })
      setElapsedTime(0)
      setIsPaused(false)
      longRunningAlertedRef.current.clear()
      stopInterval()
    }
  })

  // ── Idle Detection (desktop only) ──────────────────────────────────────────
  useEffect(() => {
    const isTouchOnly = (): boolean =>
      window.matchMedia('(pointer: coarse)').matches &&
      !window.matchMedia('(pointer: fine)').matches
    if (isTouchOnly()) return // skip on mobile-only devices

    const resetActivity = (): void => {
      lastActivityRef.current = Date.now()
    }

    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetActivity, { passive: true }))

    const idleCheckInterval = setInterval(() => {
      if (!runningEntry || isPaused || idleDialog) return

      const idleMs = Date.now() - lastActivityRef.current
      const thresholdMs = getIdleThreshold() * 60 * 1000

      if (idleMs >= thresholdMs) {
        const idleMinutes = Math.floor(idleMs / 60000)
        pausedAtRef.current = Date.now() - idleMs // when idle started
        handlePause()
        setIdleDialog({ idleMinutes })
      }
    }, 30000) // check every 30s

    return () => {
      events.forEach(e => window.removeEventListener(e, resetActivity))
      clearInterval(idleCheckInterval)
    }
  }, [runningEntry, isPaused, idleDialog, handlePause])

  // ── Visibility Change (tab switch / device lock / mobile background) ───────
  useEffect(() => {
    const handleVisibilityChange = (): void => {
      if (!runningEntry) return

      if (document.hidden) {
        // Going to background
        pausedAtRef.current = Date.now()
        handlePause()
      } else {
        // Coming back — if was auto-paused due to visibility, show dialog
        if (pausedAtRef.current && isPaused) {
          const awayMs = Date.now() - pausedAtRef.current
          const awayMinutes = Math.floor(awayMs / 60000)
          if (awayMinutes >= 1) {
            setIdleDialog({ idleMinutes: awayMinutes })
          } else {
            // Away for less than a minute — just resume silently
            handleResume()
            pausedAtRef.current = null
          }
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [runningEntry, isPaused, handlePause, handleResume])

  // ── Long-running Reminder ──────────────────────────────────────────────────
  useEffect(() => {
    if (!runningEntry || isPaused || !getRemindersEnabled()) return

    const ALERT_HOURS = [2, 6]
    const currentHours = Math.floor(elapsedTime / 3600)

    for (const h of ALERT_HOURS) {
      if (currentHours >= h && !longRunningAlertedRef.current.has(h)) {
        longRunningAlertedRef.current.add(h)
        setLongRunningDialog({ hours: h })
        break
      }
    }
  }, [elapsedTime, runningEntry, isPaused])

  // ── Idle dialog handlers ───────────────────────────────────────────────────
  const handleIdleKeep = (): void => {
    setIdleDialog(null)
    pausedAtRef.current = null
    handleResume()
  }

  const handleIdleDiscard = (): void => {
    const { idleMinutes } = idleDialog!
    setIdleDialog(null)
    pausedAtRef.current = null

    // Subtract idle duration from the entry
    if (runningEntry) {
      const currentDuration = runningEntry.duration || 0
      const newDuration = Math.max(0, currentDuration - idleMinutes)
      timeEntryRepository.update(runningEntry.id, { duration: newDuration }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['runningTimeEntry'] })
      })
      setElapsedTime(prev => Math.max(0, prev - idleMinutes * 60))
    }
    handleResume()
  }

  const handleIdleStayPaused = (): void => {
    setIdleDialog(null)
    pausedAtRef.current = null
    // stays paused — user manually resumes
  }

  // ── Long-running dialog handlers ───────────────────────────────────────────
  const handleLongRunningStop = (): void => {
    setLongRunningDialog(null)
    if (runningEntry) stopTimerMutation.mutate(runningEntry.id)
  }

  const handleLongRunningPause = (): void => {
    setLongRunningDialog(null)
    handlePause()
  }

  const handleLongRunningContinue = (): void => {
    setLongRunningDialog(null)
    // just dismiss
  }

  useEffect(() => {
    return () => stopInterval()
  }, [])

  return (
    <TimeTrackerContext.Provider
      value={{
        runningEntry,
        stopTimerMutation,
        isPaused,
        elapsedTime,
        handlePause,
        handleResume
      }}
    >
      {children}

      {/* Idle dialog */}
      {idleDialog && (
        <IdleDialog
          idleMinutes={idleDialog.idleMinutes}
          onKeep={handleIdleKeep}
          onDiscard={handleIdleDiscard}
          onStayPaused={handleIdleStayPaused}
        />
      )}

      {/* Long-running dialog */}
      {longRunningDialog && !idleDialog && (
        <LongRunningDialog
          hours={longRunningDialog.hours}
          onStop={handleLongRunningStop}
          onPause={handleLongRunningPause}
          onContinue={handleLongRunningContinue}
        />
      )}
    </TimeTrackerContext.Provider>
  )
}
