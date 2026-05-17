import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Wallet, Heart, Dumbbell, Smile, Brain, Users, Briefcase } from 'lucide-react'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  businesses: { id: string; name: string }[]
  onSelect: (category: string, businessId?: string) => void
  title: string
  description: string
}

export function CategorySelectDialog({
  open,
  onOpenChange,
  businesses,
  onSelect,
  title,
  description
}: Props) {
  const handleSelect = (category: string, businessId?: string) => {
    onSelect(category, businessId)
    onOpenChange(false)
  }

  const Item = ({ icon: Icon, title, description, onClick }: any) => (
    <Button variant="outline" className="justify-start h-auto py-3" onClick={onClick}>
      <Icon className="w-5 h-5 mr-3 flex-shrink-0 text-slate-600" />
      <div className="text-left">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-slate-500 hidden lg:block">{description}</div>
      </div>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <Item
            icon={Wallet}
            title="Finance"
            description="Financial Goals & Tasks"
            onClick={() => handleSelect('finances')}
          />

          <Item
            icon={Wallet}
            title="Assets"
            description="Physical Assets & Wealth"
            onClick={() => handleSelect('assets')}
          />

          <Item
            icon={Heart}
            title="Health"
            description="Body & Health"
            onClick={() => handleSelect('health_body')}
          />

          <Item
            icon={Dumbbell}
            title="Fitness"
            description="Workouts & Training"
            onClick={() => handleSelect('fitness')}
          />

          <Item
            icon={Smile}
            title="Hobbies"
            description="Leisure & Interests"
            onClick={() => handleSelect('hobbies')}
          />

          <Item
            icon={Brain}
            title="Learning"
            description="Learning & Development"
            onClick={() => handleSelect('learning')}
          />

          <Item
            icon={Users}
            title="Relationships"
            description="Relationships & Friendships"
            onClick={() => handleSelect('relationships')}
          />

          {businesses.map(b => (
            <Item
              key={b.id}
              icon={Briefcase}
              title={b.name}
              description="Business"
              onClick={() => handleSelect('business', b.id)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
