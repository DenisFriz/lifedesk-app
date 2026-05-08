import { Button } from '@/components/ui/button'
import { Clock, Square, Pause, Play } from 'lucide-react'

interface LongRunningDialogProps {
  hours: number
  onStop: () => void
  onPause: () => void
  onContinue: () => void
}

export default function LongRunningDialog({
  hours,
  onStop,
  onPause,
  onContinue
}: LongRunningDialogProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Still tracking?</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Timer has been running for{' '}
              <span className="font-medium text-slate-700">{hours}h</span>.
            </p>
          </div>
        </div>
        <div className="space-y-2 mt-4">
          <Button
            className="w-full justify-start gap-2"
            variant="destructive"
            size="sm"
            onClick={onStop}
          >
            <Square className="w-4 h-4" />
            Stop timer
          </Button>
          <Button
            className="w-full justify-start gap-2"
            variant="outline"
            size="sm"
            onClick={onPause}
          >
            <Pause className="w-4 h-4" />
            Pause timer
          </Button>
          <Button
            className="w-full justify-start gap-2 bg-green-600 hover:bg-green-700 text-white"
            size="sm"
            onClick={onContinue}
          >
            <Play className="w-4 h-4" />
            Continue tracking
          </Button>
        </div>
      </div>
    </div>
  )
}
