import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Zap } from 'lucide-react'

interface UpgradeLimitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UpgradeLimitModal({ open, onOpenChange }: UpgradeLimitModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Need more?
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-600 mt-2">
            Change to Plus or Pro Plan.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-2 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            Not now
          </Button>
          <Link to="/upgrade" className="flex-1 sm:flex-none">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700">View Plans</Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
