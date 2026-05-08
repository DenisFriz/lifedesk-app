import { Contact } from '@/types/entities'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, Phone, Mail, MapPin, AlertCircle, CheckCircle } from 'lucide-react'
import { differenceInDays, parseISO, addYears, isAfter } from 'date-fns'

const COLOR_MAP = {
  rose: 'bg-rose-500',
  pink: 'bg-pink-500',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  orange: 'bg-orange-500'
}

const REL_LABELS = {
  family: 'Family',
  close_friend: 'Close Friend',
  friend: 'Friend',
  colleague: 'Colleague',
  acquaintance: 'Acquaintance',
  mentor: 'Mentor',
  partner: 'Partner',
  other: 'Other'
}

const REL_COLORS = {
  family: 'bg-rose-100 text-rose-700',
  close_friend: 'bg-pink-100 text-pink-700',
  friend: 'bg-indigo-100 text-indigo-700',
  colleague: 'bg-blue-100 text-blue-700',
  acquaintance: 'bg-slate-100 text-slate-600',
  mentor: 'bg-amber-100 text-amber-700',
  partner: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-600'
}

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  biweekly: 14,
  monthly: 30,
  quarterly: 90,
  twice_a_year: 180,
  yearly: 365
}

function getCheckInStatus(contact: any) {
  if (!contact.check_in_frequency || !contact.last_contact_date) return null
  const days = FREQUENCY_DAYS[contact.check_in_frequency]
  const daysSince = differenceInDays(new Date(), parseISO(contact.last_contact_date))
  const overdue = daysSince >= days
  return { overdue, daysSince, days }
}

function getUpcomingBirthday(birthday: string | undefined) {
  if (!birthday) return null
  const today = new Date()
  const bday = parseISO(birthday)
  let next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate())
  if (!isAfter(next, today)) next = addYears(next, 1)
  const daysUntil = differenceInDays(next, today)
  return { daysUntil, date: next }
}

interface Props {
  contact: any &
    Contact & {
      check_in_frequency?: string
      last_contact_date?: string
      avatar_color?: string
      location?: string
      interests?: string
    }
  onEdit: (contact: any) => void
  onDelete: (id: string) => void
  onCheckedIn: (contact: any) => void
}

export default function ContactCard({ contact, onEdit, onDelete, onCheckedIn }: Props) {
  const checkIn = getCheckInStatus(contact)
  const birthday = getUpcomingBirthday(contact.birthday)
  const initials = contact.name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={`bg-white rounded-xl border p-4 transition-colors ${checkIn?.overdue ? 'border-amber-300' : 'border-slate-200 hover:border-slate-300'}`}
    >
      <div className="flex gap-3">
        {/* Avatar */}
        <div
          className={`w-12 h-12 rounded-full ${COLOR_MAP[contact.avatar_color] || COLOR_MAP.indigo} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-semibold text-slate-900">{contact.name}</h3>
                <Badge className={`text-xs ${REL_COLORS[contact.id] || REL_COLORS.other}`}>
                  {REL_LABELS[contact.id] || 'Other'}
                </Badge>
              </div>

              {/* Meta info */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mb-2">
                {contact.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {contact.location}
                  </span>
                )}
                {contact.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {contact.phone}
                  </span>
                )}
                {contact.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    {contact.email}
                  </span>
                )}
              </div>

              {contact.interests && (
                <p className="text-xs text-slate-500 mb-2 italic">"{contact.interests}"</p>
              )}

              {/* Alerts */}
              <div className="flex flex-wrap gap-2">
                {checkIn?.overdue && (
                  <div className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    {checkIn.daysSince}d since last contact
                  </div>
                )}
                {!checkIn?.overdue && contact.last_contact_date && (
                  <div className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" />
                    {checkIn.daysSince}d ago
                  </div>
                )}
                {birthday && birthday.daysUntil <= 14 && (
                  <div className="flex items-center gap-1 text-xs text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full">
                    🎂 Birthday in {birthday.daysUntil === 0 ? 'today!' : `${birthday.daysUntil}d`}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => onCheckedIn(contact)}
              >
                ✓ Check in
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(contact)}
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onDelete(contact.id)}
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
