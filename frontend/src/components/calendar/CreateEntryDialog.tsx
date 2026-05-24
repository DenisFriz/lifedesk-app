import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ListTodo, Target, Clock, Zap } from 'lucide-react'
import TaskCreateForm from './TaskCreateForm'
import GoalCreateForm from './GoalCreateForm'
import EventCreateForm from './EventCreateForm'
import { useUserLimit } from '@/contexts/UserLimitContext'

export default function CreateEntryDialog({
  date,
  time,
  open,
  onOpenChange,
  initialTaskData,
  initialGoalData,
  initialEventData,
  onTaskCreated,
  onGoalCreated,
  onEventCreated
}) {
  const [selectedType, setSelectedType] = useState(null)

  const { canCreate, data: userLimit } = useUserLimit()

  /*  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => backend.entities.Task.list()
  })
  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: () => backend.entities.Goal.list()
  })
  const { data: events = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => backend.entities.Event.list()
  }) */

  const isCalendarLimitReached = !canCreate('calendarEntries')

  useEffect(() => {
    if (initialTaskData) {
      setSelectedType('task')
    } else if (initialGoalData) {
      setSelectedType('goal')
    } else if (initialEventData) {
      setSelectedType('event')
    }
  }, [initialTaskData, initialGoalData, initialEventData])

  const handleClose = () => {
    setSelectedType(null)
    onOpenChange(false)
  }

  if (selectedType === 'task') {
    return (
      <TaskCreateForm
        date={date}
        time={time}
        open={open}
        onOpenChange={isOpen => {
          if (!isOpen) {
            handleClose()
            onTaskCreated?.()
          }
        }}
        initialData={initialTaskData}
      />
    )
  }

  if (selectedType === 'goal') {
    return (
      <GoalCreateForm
        date={date}
        time={time}
        open={open}
        onOpenChange={isOpen => {
          if (!isOpen) {
            handleClose()
            onGoalCreated?.()
          }
        }}
        initialData={initialGoalData}
      />
    )
  }

  if (selectedType === 'event') {
    return (
      <EventCreateForm
        date={date}
        time={time}
        open={open}
        onOpenChange={isOpen => {
          if (!isOpen) {
            handleClose()
            onEventCreated?.()
          }
        }}
        initialData={initialEventData}
      />
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>What would you like to create?</DialogTitle>
        </DialogHeader>
        {isCalendarLimitReached ? (
          <div className="py-6 flex flex-col items-center text-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
              <Zap className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 mb-1">Calendar entry limit reached</p>
              <p className="text-sm text-slate-500">
                You've reached the limit of {userLimit?.limits?.calendarEntries || 0} calendar
                entries on the free plan.
              </p>
            </div>
            <Link
              to="/Upgrade"
              onClick={handleClose}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Zap className="w-4 h-4" />
              Upgrade to add more
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 py-4">
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={() => setSelectedType('task')}
            >
              <ListTodo className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Task</div>
                <div className="text-xs text-slate-500">Create a new task</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={() => setSelectedType('goal')}
            >
              <Target className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Goal</div>
                <div className="text-xs text-slate-500">Create a new goal</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 justify-start"
              onClick={() => setSelectedType('event')}
            >
              <Clock className="w-5 h-5 mr-3" />
              <div className="text-left">
                <div className="font-semibold">Event</div>
                <div className="text-xs text-slate-500">Create a new event</div>
              </div>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
