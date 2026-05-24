import { Users, Heart, AlertCircle, Gift } from 'lucide-react'
import { differenceInDays, parseISO, addYears, isAfter } from 'date-fns'

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  twice_a_year: 180,
  yearly: 365
}

interface Props {
  contacts: any[]
}

export default function RelationshipStats({ contacts }: Props) {
  const total = contacts?.length
  const close = contacts?.filter(c =>
    ['family', 'close_friend', 'partner'].includes(c.relationship)
  ).length

  const overdue = contacts?.filter(c => {
    if (!c.check_in_frequency || !c.last_contact_date) return false
    const days = FREQUENCY_DAYS[c.check_in_frequency]
    return differenceInDays(new Date(), parseISO(c.last_contact_date)) >= days
  }).length

  const upcomingBirthdays = contacts?.filter(c => {
    if (!c.birthday) return false
    const bday = parseISO(c.birthday)
    const today = new Date()
    let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
    if (!isAfter(next, today)) next = addYears(next, 1)
    return differenceInDays(next, today) <= 30
  }).length

  const stats = [
    {
      label: 'Total Contacts',
      value: total,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      label: 'Close Relationships',
      value: close,
      icon: Heart,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    },
    {
      label: 'Need Check-in',
      value: overdue,
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
    {
      label: 'Birthdays (30d)',
      value: upcomingBirthdays,
      icon: Gift,
      color: 'text-pink-600',
      bg: 'bg-pink-50'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3"
        >
          <div
            className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}
          >
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
