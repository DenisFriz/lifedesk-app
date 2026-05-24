import { useState } from 'react'
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

export default function DeleteRecurringDialog({ open, onOpenChange, onConfirm }) {
  const [deleteType, setDeleteType] = useState(null)

  const handleChoice = type => {
    setDeleteType(type)
    onOpenChange(false)

    // Show browser confirm after choice
    const confirmMessage =
      type === 'single'
        ? 'Are you sure you want to delete this entry?'
        : 'Are you sure you want to delete all recurring entries?'

    if (confirm(confirmMessage)) {
      onConfirm(type)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete recurring entry</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to delete only this entry or all recurring entries?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => handleChoice('single')}>
            Only this entry
          </AlertDialogAction>
          <AlertDialogAction
            onClick={() => handleChoice('all')}
            className="bg-rose-600 hover:bg-rose-700"
          >
            All recurring entries
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
