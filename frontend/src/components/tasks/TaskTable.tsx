import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { format } from 'date-fns'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task } from '@/types/entities'

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface TaskTableProps {
  tasks: Task[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onToggleComplete: (task: Task) => void
  sortConfig: SortConfig
  onSort: (column: string) => void
}

interface SortableHeaderProps {
  column: string
  children: React.ReactNode
  className?: string
}

const priorityConfig = {
  high: { label: 'High', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  medium: { label: 'Medium', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  low: { label: 'Low', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

export default function TaskTable({
  tasks,
  onEdit,
  onDelete,
  onToggleComplete,
  sortConfig,
  onSort
}: TaskTableProps) {
  const [deleteTask, setDeleteTask] = useState<Task | null>(null)

  const getSortIcon = (column: string) => {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="h-4 w-4 text-slate-400" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4 text-indigo-600" />
    ) : (
      <ArrowDown className="h-4 w-4 text-indigo-600" />
    )
  }

  const SortableHeader = ({ column, children, className }: SortableHeaderProps) => (
    <TableHead className={className}>
      <button
        onClick={() => onSort(column)}
        className="flex items-center gap-2 hover:text-indigo-600 transition-colors font-medium"
      >
        {children}
        {getSortIcon(column)}
      </button>
    </TableHead>
  )

  const handleConfirmDelete = (): void => {
    if (deleteTask) {
      onDelete(deleteTask.id)
      setDeleteTask(null)
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No tasks yet</h3>
        <p className="text-slate-500 text-center">Create your first task to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-slate-200">
              <TableHead className="w-12"></TableHead>
              <SortableHeader column="title" className="min-w-[200px]">
                Task
              </SortableHeader>
              <SortableHeader column="priority" className="w-32">
                Priority
              </SortableHeader>
              <SortableHeader column="due_date" className="w-36">
                Due Date
              </SortableHeader>
              <SortableHeader column="created_date" className="w-36">
                Created
              </SortableHeader>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => (
              <TableRow
                key={task.id}
                className={cn(
                  'group transition-colors border-slate-100',
                  task.status === 'completed' && 'bg-slate-50/50'
                )}
              >
                <TableCell className="pr-0">
                  <Checkbox
                    checked={task.status === 'completed'}
                    onCheckedChange={() => onToggleComplete(task)}
                    className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p
                      className={cn(
                        'font-medium text-slate-900 transition-all',
                        task.status === 'completed' && 'line-through text-slate-400'
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-sm text-slate-500 line-clamp-1">{task.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn('font-medium border', priorityConfig[task.priority]?.className)}
                  >
                    {priorityConfig[task.priority]?.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600">
                  {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
                </TableCell>
                <TableCell className="text-slate-500 text-sm">
                  {format(new Date(task.created_date), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => onEdit(task)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setDeleteTask(task)}
                        className="text-rose-600 focus:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteTask} onOpenChange={() => setDeleteTask(null)}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTask?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
