import { useEffect, useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { useGoalMutations } from '@/hooks/goals/useGoalMutations'
import { GoalRecord } from '@/db'

interface GoalDescriptionModalProps {
  goal: GoalRecord | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function GoalDescriptionModal({
  goal,
  open,
  onOpenChange
}: GoalDescriptionModalProps) {
  const [content, setContent] = useState('')
  const { updateMutation } = useGoalMutations()

  useEffect(() => {
    if (open && goal) {
      setContent(goal.description || '')
    }
  }, [open, goal?.id])

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'clean']
      ]
    }),
    []
  )

  const handleSave = async () => {
    if (!goal) return

    try {
      const goalId = String(goal.serverId || goal.id || '')
      await updateMutation.mutateAsync({
        id: goalId,
        data: { description: content }
      })
      onOpenChange(false)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full h-full max-w-full max-h-full lg:max-w-2xl lg:h-auto lg:max-h-[90vh] overflow-y-auto m-0 lg:m-auto rounded-none lg:rounded-lg">
        <DialogHeader>
          <DialogTitle>Edit Description</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-[300px]">
          <ReactQuill
            theme="snow"
            value={content}
            onChange={setContent}
            modules={modules}
            className="h-full"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
