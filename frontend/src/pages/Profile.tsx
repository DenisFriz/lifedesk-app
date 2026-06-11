import { useState, useEffect } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Crown,
  Zap,
  Rocket,
  LogOut,
  Lightbulb,
  MessageSquare,
  Sparkles,
  CheckCircle,
  Camera,
  Trash2,
  AlertTriangle,
  ShieldOff,
  MailCheck
} from 'lucide-react'
import DeleteAccountDialog from '@/components/account/DeleteAccountDialog'
import { format } from 'date-fns'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'
import { Helmet } from 'react-helmet-async'
import { useSound } from '@/contexts/SoundContext'
import { Switch } from '@/components/ui/switch'
import EmailVerificationModal from '@/components/EmailVerificationModal'
import { useCloudinaryUpload } from '@/hooks/useCloudinaryUpload'
import { useAuth } from '@/lib/AuthContext'
import { useCommunityIdeasQuery } from '@/hooks/communityideas/useCommunityIdeasQuery'

const tierConfig = {
  free: { icon: Zap, color: 'bg-slate-100 text-slate-700', label: 'Free' },
  starter: { icon: Zap, color: 'bg-blue-100 text-blue-700', label: 'Starter' },
  plus: { icon: Zap, color: 'bg-indigo-100 text-indigo-700', label: 'Plus' },
  pro: { icon: Crown, color: 'bg-purple-100 text-purple-700', label: 'Pro' },
  enterprise: { icon: Crown, color: 'bg-amber-100 text-amber-700', label: 'Enterprise' }
} as const

const statusColors: Record<string, string> = {
  new: 'bg-slate-100 text-slate-700',
  under_review: 'bg-blue-100 text-blue-700',
  planned: 'bg-purple-100 text-purple-700',
  in_progress: 'bg-amber-100 text-amber-700',
  implemented: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
} as const

export default function Profile() {
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const [searchParams] = useSearchParams()
  const checkoutStatus = searchParams.get('checkout')

  const { planName, subscription } = useSubscription()
  const navigate = useNavigate()

  const { upload } = useCloudinaryUpload()

  const { soundEnabled, setSoundEnabled } = useSound()

  const { user, isLoadingAuth: isLoading } = useAuth()

  // On successful checkout, invalidate cached user + subscription data so plan shows immediately
  useEffect(() => {
    if (checkoutStatus === 'success') {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
    }
  }, [checkoutStatus, queryClient])

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) => backend.user.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      setIsEditing(false)
    }
  })

  const handleLogout = async () => {
    try {
      await backend.auth.logout()
      navigate('/login')
    } catch (error) {
      console.error(error)
    }
  }

  const handleSave = () => {
    updateMutation.mutate({ full_name: fullName })
  }

  const handleProfileImageUpload = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    const allowedTypes = ['image/jpeg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPG and PNG files are allowed.')
      e.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be 5 MB or less.')
      e.target.value = ''
      return
    }

    setUploadingImage(true)

    try {
      const result = await upload(file)

      const file_url = result.secure_url
      const public_id = result.public_id

      await backend.user.updateMe({
        profile_image_url: file_url,
        profile_image_public_id: public_id
      })

      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDeleteProfileImage = async () => {
    await backend.user.deleteAvatar()
    queryClient.invalidateQueries({ queryKey: ['currentUser'] })
  }

  const handleSendVerificationCode = async () => {
    try {
      await backend.email.sendEmailVerificationCode()
      setVerifyModalOpen(true)
    } catch (error) {
      console.error(error)
    }
  }

  const handleVerifyCode = async (code: string) => {
    try {
      setVerifying(true)

      await backend.email.verifyEmailCode(code)

      queryClient.invalidateQueries({ queryKey: ['currentUser'] })

      setVerifyModalOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setVerifying(false)
    }
  }

  const currentTier = tierConfig[user?.subscription_tier || 'free'] ?? tierConfig.free
  const TierIcon = currentTier.icon

  const { data: myIdeas = [] } = useCommunityIdeasQuery()

  const { data: myComments = [] } = useQuery({
    queryKey: ['myComments', user?.email],
    queryFn: () =>
      backend.entities.CommunityComment.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user?.email
  })

  const [selectedPlan, setSelectedPlan] = useState<'free' | 'plus' | 'pro'>('free')

  useEffect(() => {
    if (user?.subscription_tier) {
      setSelectedPlan(user.subscription_tier)
    }
  }, [user?.subscription_tier])

  const updateSubscription = useMutation({
    mutationFn: (subscription: 'free' | 'plus' | 'pro') =>
      backend.user.changeSubscription(subscription),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage'] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    }
  })

  const [ideasPage, setIdeasPage] = useState(1)
  const [commentsPage, setCommentsPage] = useState(1)
  const PAGE_SIZE = 5

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#f4f7fb' }}
      >
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Profile | LifeDesk</title>
      </Helmet>
      <EmailVerificationModal
        open={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        loading={verifying}
        onSubmit={handleVerifyCode}
      />

      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h1 className="profile-page-title text-4xl font-bold text-slate-900 mb-2">Profile</h1>
            <p className="text-slate-600">Manage your account settings</p>
          </div>
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="profile-account-title text-lg font-semibold text-slate-900 mb-4">
                Account Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      {user?.profile_image || user?.google_avatar_url ? (
                        <img
                          src={user.profile_image || user.google_avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={e => {
                            const target = e.currentTarget
                            if (user.google_avatar_url && target.src !== user.google_avatar_url) {
                              target.src = user.google_avatar_url
                            } else {
                              target.style.display = 'none'
                            }
                          }}
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      {uploadingImage ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5 text-white" />
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        onChange={handleProfileImageUpload}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {user?.full_name || 'No name set'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Click the image to change your profile photo
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">JPG or PNG, max 5 MB</p>
                    {user?.profile_image && (
                      <button
                        onClick={handleDeleteProfileImage}
                        className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 mt-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Remove photo
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="mt-1 text-slate-600">{user?.email}</div>
                </div>
                <div>
                  <Label>Full Name</Label>
                  {isEditing ? (
                    <div className="mt-1 flex gap-2">
                      <Input
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="Your name"
                      />
                      <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        Save
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-slate-600">{user?.full_name || 'Not set'}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFullName(user?.full_name || '')
                          setIsEditing(true)
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <Label>Email Verification</Label>
                  <div className="mt-1 flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center ${
                          user?.email_verified
                            ? 'bg-green-100 text-green-600'
                            : 'bg-amber-100 text-amber-600'
                        }`}
                      >
                        <MailCheck className="w-4 h-4" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {user?.email_verified ? 'Email verified' : 'Email not verified'}
                        </p>

                        <p className="text-xs text-slate-500">
                          {user?.email_verified
                            ? 'Your email address is confirmed'
                            : 'Please confirm your email address'}
                        </p>
                      </div>
                    </div>
                    {!user?.email_verified && (
                      <Button size="sm" onClick={handleSendVerificationCode}>
                        Verify Email
                      </Button>
                    )}
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div>
                    <Label>Role</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="capitalize">
                        {user?.role}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <p>For testing purpose only</p>
              <div className="mt-4 flex items-center gap-2">
                {(['free', 'plus', 'pro'] as const).map(plan => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      'px-4 py-2 rounded-lg text-sm font-medium border transition',
                      selectedPlan === plan
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    {plan.charAt(0).toUpperCase() + plan.slice(1)}
                  </button>
                ))}

                <button
                  onClick={() => updateSubscription.mutate(selectedPlan)}
                  disabled={updateSubscription.isPending || selectedPlan === planName}
                  className="ml-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {updateSubscription.isPending ? 'Updating...' : 'Update plan'}
                </button>
              </div>
              <div className="w-full h-1 bg-red-600 mb-5 mt-2"></div>
              <h2 className="profile-subscription-title text-lg font-semibold text-slate-900 mb-4">
                Subscription
              </h2>

              {checkoutStatus === 'success' && (
                <div className="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  Payment successful! Your plan has been updated.
                </div>
              )}

              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-lg ${planName === 'plus' ? 'bg-indigo-100' : planName === 'pro' || planName === 'enterprise' ? 'bg-orange-100' : currentTier.color} flex items-center justify-center`}
                >
                  {planName === 'plus' ? (
                    <Crown className="w-6 h-6 text-indigo-600" />
                  ) : planName === 'pro' || planName === 'enterprise' ? (
                    <Rocket className="w-6 h-6 text-orange-500" />
                  ) : (
                    <TierIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900 capitalize">{planName} Plan</div>
                  <div className="text-sm text-slate-500 flex items-center gap-1.5">
                    {subscription?.cancel_at_period_end === true && (
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                    {planName === 'free' && 'Basic access — upgrade to unlock more'}
                    {(planName === 'plus' || planName === 'pro') &&
                      subscription?.current_period_end &&
                      (subscription?.cancel_at_period_end === true
                        ? `Cancels ${format(new Date(subscription.current_period_end), 'MMM d, yyyy')}`
                        : `Renews ${format(new Date(subscription.current_period_end), 'MMM d, yyyy')}`)}
                    {planName === 'enterprise' && 'Enterprise — full access'}
                  </div>
                </div>
                {planName === 'free' ? (
                  <Link to="/upgrade">
                    <Button className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
                      <Sparkles className="w-4 h-4" /> Upgrade
                    </Button>
                  </Link>
                ) : (
                  <Link to="/upgrade">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="profile-actions-title text-lg font-semibold text-slate-900 mb-4">
                Actions
              </h2>

              <div className="mt-3 mb-3 flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">Sound</p>

                  <p className="text-xs text-slate-500">Enable interface sounds</p>
                </div>

                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
              </div>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full justify-start text-slate-600 hover:text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
            </div>

            {/* My Ideas */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-500" />
                My Community Ideas ({myIdeas.length})
              </h2>
              {myIdeas.length === 0 ? (
                <p className="text-slate-400 text-sm">You haven't submitted any ideas yet.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {myIdeas.slice((ideasPage - 1) * PAGE_SIZE, ideasPage * PAGE_SIZE).map(idea => (
                      <div
                        key={idea.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">
                            {idea.title}
                          </p>
                          {idea.description && (
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                              {idea.description}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(idea.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                        <Badge
                          className={`text-xs flex-shrink-0 ${statusColors[idea.status] || statusColors.new}`}
                        >
                          {idea.status?.replace('_', ' ') || 'new'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  {myIdeas.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIdeasPage(p => p - 1)}
                        disabled={ideasPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-slate-500">
                        Page {ideasPage} of {Math.ceil(myIdeas.length / PAGE_SIZE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIdeasPage(p => p + 1)}
                        disabled={ideasPage >= Math.ceil(myIdeas.length / PAGE_SIZE)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* My Comments */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                My Comments ({myComments.length})
              </h2>
              {myComments.length === 0 ? (
                <p className="text-slate-400 text-sm">You haven't made any comments yet.</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {myComments
                      .slice((commentsPage - 1) * PAGE_SIZE, commentsPage * PAGE_SIZE)
                      .map(comment => (
                        <div key={comment.id} className="p-3 rounded-lg bg-slate-50">
                          <p className="text-sm text-slate-700 line-clamp-2">{comment.content}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      ))}
                  </div>
                  {myComments.length > PAGE_SIZE && (
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommentsPage(p => p - 1)}
                        disabled={commentsPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-slate-500">
                        Page {commentsPage} of {Math.ceil(myComments.length / PAGE_SIZE)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCommentsPage(p => p + 1)}
                        disabled={commentsPage >= Math.ceil(myComments.length / PAGE_SIZE)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Admin Tools */}
            {user?.role === 'admin' && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin Tools</h2>
                <Link to="/admin-users">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Manage Deleted Accounts
                  </Button>
                </Link>
              </div>
            )}

            {/* Danger Zone */}
            <div className="bg-red-50 rounded-xl border border-red-200 p-6">
              <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone! Irreversible actions
              </h2>
              <Button
                onClick={() => setDeleteAccountOpen(true)}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-100 bg-white border border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>
        </div>

        <DeleteAccountDialog
          isOpen={deleteAccountOpen}
          onClose={() => setDeleteAccountOpen(false)}
          onSuccess={() => setDeleteAccountOpen(false)}
          userEmail={user?.email}
        />
      </div>
    </>
  )
}
