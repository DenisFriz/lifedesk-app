import { Button } from '@/components/ui/button'
import { Clock, SkipForward, Pause } from 'lucide-react'

interface IdleDialogProps {
  idleMinutes: number
  onKeep: () => void
  onDiscard: () => void
  onStayPaused: () => void
}

export default function IdleDialog({
  idleMinutes,
  onKeep,
  onDiscard,
  onStayPaused
}: IdleDialogProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">You've been idle</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              No activity detected for{' '}
              <span className="font-medium text-slate-700">{idleMinutes} min</span>. Timer was
              paused.
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-600 mb-4">What would you like to do with the idle time?</p>
        <div className="space-y-2">
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white justify-start gap-2"
            size="sm"
            onClick={onKeep}
          >
            <Clock className="w-4 h-4" />
            Keep idle time
          </Button>
          <Button
            className="w-full justify-start gap-2"
            variant="outline"
            size="sm"
            onClick={onDiscard}
          >
            <SkipForward className="w-4 h-4" />
            Remove idle time <span className="text-slate-400 ml-1">(-{idleMinutes} min)</span>
          </Button>
          <Button
            className="w-full justify-start gap-2"
            variant="ghost"
            size="sm"
            onClick={onStayPaused}
          >
            <Pause className="w-4 h-4" />
            Stay paused
          </Button>
        </div>
      </div>
    </div>
  )
}
