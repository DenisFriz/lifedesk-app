import { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, X, ShieldOff } from 'lucide-react'
import { format } from 'date-fns'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [confirmUserId, setConfirmUserId] = useState(null)

  const { data: currentUser } = useQuery<User>({
    queryKey: ['currentUser'],
    queryFn: () => backend.auth.me()
  })

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['allUsers'],
    queryFn: () => backend.entities.User.list() as Promise<User[]>,
    enabled: currentUser?.role === 'admin'
  })

  const clearMutation = useMutation<void, Error, string>({
    mutationFn: (userId: string) => backend.functions.invoke('adminClearDeletedFields', { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allUsers'] })
      setConfirmUserId(null)
    }
  })

  if (currentUser?.role !== 'admin') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#f4f7fb' }}
      >
        <p className="text-slate-500">Access denied.</p>
      </div>
    )
  }

  const filtered = users.filter(
    u =>
      !search ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  // Only show users that have is_deleted or deleted_at set
  const deletedUsers = filtered.filter(u => u.is_deleted || u.deleted_at)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Admin: Deleted Accounts</h1>
        <p className="text-slate-500 text-sm mb-6">
          Users with <code>is_deleted</code> or <code>deleted_at</code> set. Clear these fields to
          restore access.
        </p>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-sm px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-slate-500 py-8">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading users...
          </div>
        ) : deletedUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
            No users with deletion flags found.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3">Name / Email</th>
                  <th className="px-4 py-3">is_deleted</th>
                  <th className="px-4 py-3">deleted_at</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {deletedUsers.map(u => (
                  <tr
                    key={u.id}
                    className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{u.full_name || '—'}</p>
                      <p className="text-slate-400 text-xs">{u.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {u.is_deleted != null ? (
                        <Badge variant="destructive" className="text-xs">
                          {String(u.is_deleted)}
                        </Badge>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.deleted_at ? (
                        format(new Date(u.deleted_at), 'MMM d, yyyy HH:mm')
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {confirmUserId === u.id ? (
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-xs text-slate-500">Sure?</span>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-7 px-3 text-xs"
                            onClick={() => clearMutation.mutate(u.id)}
                            disabled={clearMutation.isPending}
                          >
                            {clearMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Yes, clear'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => setConfirmUserId(null)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-3 text-xs gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setConfirmUserId(u.id)}
                        >
                          <ShieldOff className="w-3 h-3" /> Clear flags
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
