import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Star, Archive, Trash2, Bell, X, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateMedium } from '@/components/utils/formatters'
import { Draggable } from '@hello-pangea/dnd'
import { backend } from '@/api/backend'

export default function GoalTaskRow({
  task,
  taskIndex,
  goalId,
  sortBy,
  bulkMode,
  filterType,
  editingField,
  editValue,
  selectOpen,
  showReminders,
  reminderValues,
  setEditValue,
  setEditingField,
  setSelectOpen,
  setShowReminders,
  setReminderValues,
  startEdit,
  handleTaskBlur,
  saveTaskEdit,
  updateTaskMutation,
  updateTaskOrderMutation,
  playSound,
  queryClient,
  getGoalTasks
}) {
  return (
    <Draggable draggableId={task.id} index={taskIndex}>
      {(provided, snapshot) => (
        <tr
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            'bg-slate-50 border-b border-slate-100',
            snapshot.isDragging && 'opacity-50'
          )}
        >
          {!sortBy && (
            <td
              className="pl-10 pr-2 py-3 w-10 cursor-grab active:cursor-grabbing align-middle"
              {...provided.dragHandleProps}
            >
              <GripVertical className="w-4 h-4 text-slate-400" />
            </td>
          )}
          <td className="pl-10 pr-2 py-3 w-8 align-middle">
            <button
              onClick={() => {
                updateTaskMutation.mutate({
                  id: task.id,
                  data: { important: !task.important }
                })
              }}
            >
              <Star
                className={cn(
                  'w-4 h-4',
                  task.important ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                )}
              />
            </button>
          </td>
          <td className="py-3 text-center w-8 align-middle">
            <Checkbox
              checked={task.status === 'completed'}
              onCheckedChange={checked => {
                updateTaskMutation.mutate({
                  id: task.id,
                  data: { status: checked ? 'completed' : 'pending' }
                })
                if (checked) playSound('task-done')
              }}
              className={cn(
                task.status === 'completed' && 'border-green-500 data-[state=checked]:bg-green-500'
              )}
            />
          </td>
          {bulkMode && <td className="px-4 py-3"></td>}
          <td className="px-4 py-3 w-64 align-middle">
            <Input
              value={editingField === `${task.id}-title` ? editValue : task.title}
              onChange={e => {
                setEditValue(e.target.value)
                setEditingField(`${task.id}-title`)
              }}
              onBlur={() => {
                if (editingField === `${task.id}-title`) {
                  handleTaskBlur(task.id, 'title')
                }
              }}
              onFocus={() => startEdit(task.id, 'title', task.title)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  saveTaskEdit(task.id, 'title')
                } else if (e.key === 'Escape') {
                  setEditingField(null)
                }
              }}
              maxLength={200}
              className={cn(
                'border-0 shadow-none px-2 py-1 h-auto text-sm font-medium focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white',
                task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'
              )}
            />
          </td>
          <td className="px-4 py-3 align-middle">
            <Textarea
              value={editingField === `${task.id}-description` ? editValue : task.description || ''}
              onChange={e => {
                setEditValue(e.target.value)
                setEditingField(`${task.id}-description`)
              }}
              onBlur={() => {
                if (editingField === `${task.id}-description`) {
                  handleTaskBlur(task.id, 'description')
                }
              }}
              onFocus={() => startEdit(task.id, 'description', task.description)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  saveTaskEdit(task.id, 'description')
                } else if (e.key === 'Escape') {
                  setEditingField(null)
                }
              }}
              placeholder="Add description..."
              maxLength={5000}
              className="w-full resize-none border-0 shadow-none px-2 py-1 text-sm text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 bg-transparent hover:bg-slate-100 focus:bg-white min-h-[60px]"
            />
          </td>
          {(filterType === 'all' || filterType === 'important') && (
            <td className="px-4 py-3 w-32 align-middle"></td>
          )}
          <td className="px-4 py-3 w-32 align-middle"></td>
          <td className="px-4 py-3 w-40 align-middle">
            {editingField === `${task.id}-due_date` ? (
              <div
                className="space-y-1"
                onBlur={e => {
                  if (selectOpen) return
                  if (!e.currentTarget.contains(e.relatedTarget)) {
                    const timeInput = document.querySelector(
                      `input[data-time-for="${task.id}"]`
                    ) as HTMLInputElement | null
                    const reminders = reminderValues[task.id] || []
                    saveTaskEdit(task.id, 'due_date')
                    updateTaskMutation.mutate({
                      id: task.id,
                      data: { due_time: timeInput?.value || null, reminders }
                    })
                    setShowReminders({})
                    setReminderValues({})
                  }
                }}
              >
                <Input
                  type="date"
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const timeInput = document.querySelector(
                        `input[data-time-for="${task.id}"]`
                      ) as HTMLInputElement | null
                      const reminders = reminderValues[task.id] || []
                      saveTaskEdit(task.id, 'due_date')
                      updateTaskMutation.mutate({
                        id: task.id,
                        data: { due_time: timeInput?.value || null, reminders }
                      })
                      setShowReminders({})
                      setReminderValues({})
                    } else if (e.key === 'Escape') {
                      setEditingField(null)
                      setShowReminders({})
                      setReminderValues({})
                    }
                  }}
                  autoFocus
                  className="h-8"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="time"
                    defaultValue={task.due_time || ''}
                    data-time-for={task.id}
                    className="h-8 text-xs flex-1"
                    placeholder="Time"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        const timeInput = document.querySelector(
                          `input[data-time-for="${task.id}"]`
                        ) as HTMLInputElement | null
                        const reminders = reminderValues[task.id] || []
                        saveTaskEdit(task.id, 'due_date')
                        updateTaskMutation.mutate({
                          id: task.id,
                          data: { due_time: timeInput?.value || null, reminders }
                        })
                        setShowReminders({})
                        setReminderValues({})
                      } else if (e.key === 'Escape') {
                        setEditingField(null)
                        setShowReminders({})
                        setReminderValues({})
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setShowReminders(prev => ({ ...prev, [task.id]: !prev[task.id] }))
                      if (!reminderValues[task.id]) {
                        setReminderValues(prev => ({ ...prev, [task.id]: task.reminders || [] }))
                      }
                    }}
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                </div>
                {showReminders[task.id] && (
                  <div className="space-y-1 mt-2">
                    <div className="text-xs text-slate-600 font-medium">Reminders:</div>
                    {(reminderValues[task.id] || []).map((totalMinutes, idx) => {
                      let value = totalMinutes
                      let unit = 'minutes'

                      if (totalMinutes % 10080 === 0 && totalMinutes >= 10080) {
                        value = totalMinutes / 10080
                        unit = 'weeks'
                      } else if (totalMinutes % 1440 === 0 && totalMinutes >= 1440) {
                        value = totalMinutes / 1440
                        unit = 'days'
                      } else if (totalMinutes % 60 === 0 && totalMinutes >= 60) {
                        value = totalMinutes / 60
                        unit = 'hours'
                      }

                      return (
                        <div key={idx} className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={value}
                            onChange={e => {
                              const newValue = parseInt(e.target.value) || 1
                              const multiplier =
                                unit === 'minutes'
                                  ? 1
                                  : unit === 'hours'
                                    ? 60
                                    : unit === 'days'
                                      ? 1440
                                      : 10080
                              const newMinutes = newValue * multiplier

                              const newReminders = [...(reminderValues[task.id] || [])]
                              newReminders[idx] = newMinutes
                              setReminderValues(prev => ({ ...prev, [task.id]: newReminders }))
                            }}
                            className="h-8 text-xs w-20 flex-1"
                            placeholder="Value"
                            min="1"
                          />
                          <Select
                            value={unit}
                            open={selectOpen}
                            onOpenChange={setSelectOpen}
                            onValueChange={newUnit => {
                              const multiplier =
                                newUnit === 'minutes'
                                  ? 1
                                  : newUnit === 'hours'
                                    ? 60
                                    : newUnit === 'days'
                                      ? 1440
                                      : 10080
                              const newMinutes = value * multiplier

                              const newReminders = [...(reminderValues[task.id] || [])]
                              newReminders[idx] = newMinutes
                              setReminderValues(prev => ({ ...prev, [task.id]: newReminders }))
                            }}
                          >
                            <SelectTrigger className="h-8 flex-1 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minutes">Minutes</SelectItem>
                              <SelectItem value="hours">Hours</SelectItem>
                              <SelectItem value="days">Days</SelectItem>
                              <SelectItem value="weeks">Weeks</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )
                    })}
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newReminders = [...(reminderValues[task.id] || []), 30]
                          setReminderValues(prev => ({ ...prev, [task.id]: newReminders }))
                        }}
                        className="flex-1 text-xs"
                      >
                        Add reminder
                      </Button>
                      {(reminderValues[task.id] || []).length > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={e => {
                            e.stopPropagation()
                            const newReminders = reminderValues[task.id].slice(0, -1)
                            setReminderValues(prev => ({ ...prev, [task.id]: newReminders }))
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => {
                  startEdit(task.id, 'due_date', task.due_date)
                  setReminderValues(prev => ({ ...prev, [task.id]: task.reminders || [] }))
                }}
                className="cursor-text text-sm text-slate-600 hover:bg-slate-100 px-2 py-1 rounded"
              >
                {task.due_date ? (
                  <>
                    <div>{formatDateMedium(task.due_date)}</div>
                    {task.due_time && (
                      <div className="text-xs text-slate-500 mt-0.5">{task.due_time}</div>
                    )}
                    {task.reminders && task.reminders.length > 0 && (
                      <div className="text-xs text-slate-500 mt-0.5">
                        🔔 {task.reminders.length}
                      </div>
                    )}
                  </>
                ) : (
                  'Set date...'
                )}
              </div>
            )}
          </td>
          <td className="px-4 py-3 text-center w-20 align-middle">
            <div className="flex items-center justify-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        playSound('archived')
                        updateTaskMutation.mutate({
                          id: task.id,
                          data: { status: 'archived' }
                        })
                      }}
                    >
                      <Archive className="h-4 w-4 text-slate-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Archive</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        playSound('delete')
                        backend.entities.Task.delete(task.id).then(() => {
                          queryClient.invalidateQueries({ queryKey: ['tasks'] })
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-rose-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </td>
        </tr>
      )}
    </Draggable>
  )
}
