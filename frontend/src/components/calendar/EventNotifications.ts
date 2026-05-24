import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useSound } from '@/contexts/SoundContext'
import { useEventsQuery } from '@/hooks/events/useEventsQuery'
import { useTasksQuery } from '@/hooks/tasks/useTasksQuery'
import { useGoalsQuery } from '@/hooks/goals/useGoalsQuery'

export default function EventNotifications() {
  const { data: events = [] } = useEventsQuery()

  const { data: tasks = [] } = useTasksQuery()

  const { data: goals = [] } = useGoalsQuery()

  const { playSound } = useSound()

  const notifiedEvents = useRef(new Set())
  const permissionRequested = useRef(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('notifiedEvents')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only keep notifications from the last 24 hours
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        const filtered = parsed.filter(item => item.timestamp > oneDayAgo)
        notifiedEvents.current = new Set(filtered.map(item => item.key))
        localStorage.setItem('notifiedEvents', JSON.stringify(filtered))
      }
    } catch (error) {
      console.error('Failed to load notification history:', error)
    }

    // Request notification permission aggressively
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        permissionRequested.current = true
        Notification.requestPermission().then(permission => {
          console.log('🔔 Permission request result:', permission)
        })
      } else if (Notification.permission === 'denied') {
        console.warn(
          '⚠️ Notifications are blocked. Please allow notifications in browser settings.'
        )
      } else {
        console.log('✅ Notification permission:', Notification.permission)
      }
    }
  }, [])

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date()

      const showReminder = (item, dateTime, type) => {
        if (!item || !item.id || !item.reminders?.length) return

        item.reminders.forEach(reminderMinutes => {
          const reminderTime = new Date(dateTime.getTime() - reminderMinutes * 60000)
          const reminderKey = `${type}-${item.id}-${reminderMinutes}`

          // Show notification if we're past the reminder time but before event + 10 minute grace period
          const eventPlusGrace = new Date(dateTime.getTime() + 10 * 60 * 1000)
          if (
            now >= reminderTime &&
            now <= eventPlusGrace &&
            !notifiedEvents.current.has(reminderKey)
          ) {
            notifiedEvents.current.add(reminderKey)

            // Persist to localStorage
            try {
              const stored = localStorage.getItem('notifiedEvents')
              const history = stored ? JSON.parse(stored) : []
              history.push({ key: reminderKey, timestamp: Date.now() })
              localStorage.setItem('notifiedEvents', JSON.stringify(history))
            } catch (error) {
              console.error('Failed to persist notification:', error)
            }

            console.log(`🔔 NOTIFICATION TRIGGERED: ${item.title}`, {
              type,
              reminderMinutes,
              reminderTime: reminderTime.toLocaleTimeString(),
              eventTime: dateTime.toLocaleTimeString(),
              now: now.toLocaleTimeString(),
              notificationAPI: 'Notification' in window,
              permission: Notification.permission
            })

            const timeLabel =
              reminderMinutes < 60
                ? `${reminderMinutes} minute${reminderMinutes === 1 ? '' : 's'}`
                : reminderMinutes === 60
                  ? '1 hour'
                  : reminderMinutes === 1440
                    ? '1 day'
                    : reminderMinutes < 1440
                      ? `${Math.floor(reminderMinutes / 60)} hours`
                      : `${Math.floor(reminderMinutes / 1440)} days`

            // Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                console.log('✅ Creating browser notification...')
                const notification = new Notification(item.title, {
                  body: `${type === 'event' ? 'Starting' : type === 'task' ? 'Due' : 'Target'} in ${timeLabel}`,
                  tag: reminderKey
                })

                notification.onclick = () => {
                  window.focus()
                  notification.close()
                }

                // Play notification sound
                playSound('notification')

                console.log('✅ Browser notification created successfully')
              } catch (error) {
                console.error('❌ Failed to create browser notification:', error)
              }
            } else {
              console.warn('⚠️ Browser notifications not available or not granted:', {
                apiAvailable: 'Notification' in window,
                permission: Notification.permission
              })
            }

            // Toast notification
            try {
              console.log('✅ Creating toast notification...')
              toast.info(item.title, {
                description: `${type === 'event' ? 'Starting' : type === 'task' ? 'Due' : 'Target'} in ${timeLabel}`,
                duration: 10000
              })
              console.log('✅ Toast notification created successfully')
            } catch (error) {
              console.error('❌ Failed to create toast notification:', error)
            }
          }
        })
      }

      // Check events
      events.forEach(event => {
        if (!event || !event.id) return
        if (!event.start_date || !event.start_time) return
        if (event.status === 'archived') return

        const [hours, minutes] = event.start_time.split(':').map(Number)
        const eventDateTime = new Date(event.start_date)
        eventDateTime.setHours(hours, minutes, 0, 0)

        showReminder(event, eventDateTime, 'event')
      })

      // Check tasks
      tasks.forEach(task => {
        if (!task || !task.id) return
        if (!task.due_date || !task.due_time) return
        if (task.status === 'completed' || task.status === 'archived') return

        const [hours, minutes] = task.due_time.split(':').map(Number)
        const taskDateTime = new Date(task.due_date)
        taskDateTime.setHours(hours, minutes, 0, 0)

        showReminder(task, taskDateTime, 'task')
      })

      // Check goals
      goals.forEach(goal => {
        if (!goal || !goal.id) return
        if (!goal.target_date || !goal.target_time) return
        if (goal.status === 'achieved' || goal.status === 'archived') return

        const [hours, minutes] = goal.target_time.split(':').map(Number)
        const goalDateTime = new Date(goal.target_date)
        goalDateTime.setHours(hours, minutes, 0, 0)

        showReminder(goal, goalDateTime, 'goal')
      })
    }

    // Check every 30 seconds for more responsive notifications
    const interval = setInterval(checkReminders, 30000)
    checkReminders() // Check immediately

    // Also check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkReminders()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [events, tasks, goals])

  return null
}
