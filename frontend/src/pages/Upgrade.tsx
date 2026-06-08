import { useState } from 'react'
import { backend } from '@/api/backend'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ArrowLeft,
  Rocket,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  X
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'
import { Helmet } from 'react-helmet-async'
import { SEO } from '@/lib/seo'
import { useAuth } from '@/lib/AuthContext'

const FREE_FEATURES = [
  '10 Goals / 20 Tasks',
  '10 Calendar Entries / 10 Events',
  '1 Vehicle, 1 Estate, 1 Other Asset',
  '1 Offline Bank Account',
  'Manual CSV Transactions',
  '10 Health Tracking Entries / 5 Medical Documents',
  '3 Workouts / 3 Workout Plans / 3 Measurements',
  '3 Hobbies / Learning / Relationships',
  '1 Business / 5 Projects & Clients',
  '1 Marketing Strategy / 1 Campaign / 1 Content',
  'Community (Read Only)'
]

const PLUS_FEATURES = [
  '100 Goals / 200 Tasks',
  '400 Calendar Entries / 100 Events',
  'Push Notifications',
  'Edit Sections & Tools',
  '500 Quick Notes Lines / 50 Time Tracker Entries',
  '5 Offline Accounts / Connect Real Bank Accounts',
  'Manual & CSV + Real Bank Transactions',
  'Auto Categorization / Analytics / 200 Budget Entries',
  '4 Vehicles, 4 Estates, 4 Other Assets',
  'Insurance & Inspection Tracking / 10 Repair Entries',
  '50 Health Entries / 50 Medical Documents',
  '10 Workouts, Plans, Measurements & Progress Photos',
  '10 Hobbies / Learning / Relationships',
  '3 Businesses / Budget / 50 Projects & Clients',
  '5 Marketing Strategies / 5 Campaigns / 5 Content',
  'Full Community Access (Like, Comment, Submit)'
]

const PRO_FEATURES = [
  'Unlimited Goals, Tasks, Calendar & Events',
  'AI Assistant',
  'Edit Sections & Tools',
  'Unlimited Quick Notes & Time Tracker',
  'Unlimited Offline & Real Bank Accounts',
  'Manual, CSV & Real Bank Transactions',
  'Auto Categorization / Analytics / Unlimited Budget',
  'Unlimited Vehicles, Estates & Other Assets',
  'Insurance & Inspection Tracking / Unlimited Repairs',
  '50 Vehicle Photos',
  'Unlimited Health Tracking & Medical Documents',
  'Unlimited Workouts, Plans, Measurements & Photos',
  'Unlimited Hobbies / Learning / Relationships',
  'Unlimited Businesses / Budget + Transactions',
  'Unlimited Projects & Clients',
  'Unlimited Marketing Strategies, Campaigns & Content',
  'Full Community Access'
]

type Subscription = {
  id?: string
  user_email: string
  plan_name?: 'free' | 'plus' | 'pro' | 'enterprise'
  cancel_at_period_end?: boolean
  current_period_end?: string
}

type BillingPortalResponse = {
  data: {
    url?: string
  }
}

type CheckoutSessionResponse = {
  data?: {
    url?: string
    success?: boolean
  }
}

type DowngradeResponse = {
  data?: {
    success?: boolean
  }
}

export default function Upgrade() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { planName, isLoading: subIsLoading } = useSubscription()
  const [loading, setLoading] = useState(null)
  const [expandedPlans, setExpandedPlans] = useState(new Set())
  const [showDowngradeWarning, setShowDowngradeWarning] = useState(false)
  const [showDowngradeToPlusWarning, setShowDowngradeToPlusWarning] = useState(false)

  const toggleFeatures = plan =>
    setExpandedPlans(prev => {
      const next = new Set(prev)
      next.has(plan) ? next.delete(plan) : next.add(plan)
      return next
    })

  const { user, authError } = useAuth()

  /*   const { data: user, error: userError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => backend.user.me(),
    retry: 1
  }) */

  const { data: subscription = null, error: subError } = useQuery<Subscription | null, Error>({
    queryKey: ['subscription', user?.email],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user?.email) return null

      try {
        const subs = (await backend.entities.Subscription.list()) as Subscription[]
        const userSub = subs.find(s => s.user_email === user.email)
        return userSub || null
      } catch (err) {
        console.error('[UPGRADE] Error fetching subscription:', err)
        return null
      }
    },
    enabled: !!user?.email,
    retry: 1
  })

  // NORMALIZE: subscription might be an array-like object, extract the real record
  const subscriptionRecord =
    subscription && !Array.isArray(subscription)
      ? subscription
      : Array.isArray(subscription)
        ? subscription[0]
        : null

  const isCancelled = subscriptionRecord?.cancel_at_period_end === true
  const periodEndDate = subscriptionRecord?.current_period_end
    ? new Date(subscriptionRecord.current_period_end)
    : null

  // If there are query errors, show error state
  if (authError || subError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
          <p className="text-slate-600 mb-4">Unable to load upgrade information.</p>
          <Link to="/profile">
            <Button>Go back</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleBillingPortal = async () => {
    setLoading('downgrade')

    const res = await backend.functions.invoke<BillingPortalResponse>(
      'createBillingPortalSession',
      {
        return_url: `${window.location.origin}/profile`
      }
    )

    if (res.data?.url) {
      window.location.href = res.data.url
    } else {
      setLoading(null)
    }
  }

  const handleDowngradeClick = () => {
    setShowDowngradeWarning(true)
  }

  const handleConfirmDowngrade = () => {
    setShowDowngradeWarning(false)
    handleBillingPortal()
  }

  const handleDowngradeToPlus = async () => {
    setShowDowngradeToPlusWarning(false)
    setLoading('downgrade-plus')

    const res = await backend.functions.invoke<DowngradeResponse>('downgradeToPlan', {
      plan_name: 'plus',
      return_url: `${window.location.origin}/profile`
    })

    setLoading(null)

    if (res.data?.success) {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      queryClient.invalidateQueries({ queryKey: ['subscription'] })
      navigate('/profile?checkout=success')
    }
  }

  const handleUpgrade = async () => {
    setLoading('plus')

    const res = await backend.functions.invoke<CheckoutSessionResponse>('createCheckoutSession', {
      plan_name: 'plus',
      success_url: `${window.location.origin}/profile?checkout=success`,
      cancel_url: `${window.location.origin}/upgrade`
    })

    if (res.data?.url) {
      window.location.href = res.data.url
    } else {
      setLoading(null)
    }
  }

  const isPlus = planName === 'plus' || planName === 'pro' || planName === 'enterprise'
  const isPro = planName === 'pro' || planName === 'enterprise'

  const handleUpgradePro = async () => {
    setLoading('pro')

    const res = await backend.functions.invoke<CheckoutSessionResponse>('createCheckoutSession', {
      plan_name: 'pro',
      success_url: `${window.location.origin}/profile?checkout=success`,
      cancel_url: `${window.location.origin}/upgrade`
    })

    if (res.data?.url) {
      window.location.href = res.data.url
    } else {
      setLoading(null)
    }
  }

  return (
    <>
      <Helmet>
        <title>{SEO.upgrade.title}</title>
        <meta name="description" content={SEO.upgrade.description} />
        <meta property="og:title" content={SEO.upgrade.title} />
        <meta property="og:description" content={SEO.upgrade.description} />
        <meta property="og:url" content={SEO.upgrade.canonical} />
        <link rel="canonical" href={SEO.upgrade.canonical} />
      </Helmet>
      <div className="min-h-screen" style={{ backgroundColor: '#f4f7fb' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 flex items-center gap-4">
            <Link to="/profile">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Upgrade Your Plan</h1>
              <p className="text-slate-500 mt-1">Unlock the full power of LifeDesk</p>
            </div>
          </div>

          {isCancelled && periodEndDate && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">
                    Subscription Scheduled for Cancellation
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    Your current plan will remain active until{' '}
                    <strong>
                      {periodEndDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </strong>
                    . After that, you'll be downgraded to the Free plan.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Free</h2>
                  <p className="text-slate-500 text-sm">Forever free</p>
                </div>
              </div>
              <div className="mt-4 mb-4">
                <span className="text-4xl font-bold text-slate-900">$0</span>
                <span className="text-slate-500 ml-1">/ month</span>
              </div>
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                Get started with the essentials. Manage your goals, tasks, calendar, events, basic
                finances, assets, health, fitness, and business areas with limited entries — perfect
                for exploring LifeDesk.
              </p>
              <button
                onClick={() => toggleFeatures('free')}
                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 mb-4 transition-colors"
              >
                {expandedPlans.has('free') ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Hide feature list
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> What's included
                  </>
                )}
              </button>
              {expandedPlans.has('free') && (
                <div className="space-y-3 mb-6">
                  {FREE_FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-4">
                {subIsLoading ? (
                  <Button variant="outline" className="w-full" disabled>
                    Loading...
                  </Button>
                ) : !isPlus ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDowngradeClick}
                    disabled={!!loading}
                  >
                    {loading === 'downgrade' ? 'Redirecting...' : 'Downgrade'}
                  </Button>
                )}
              </div>
            </div>

            {/* Plus Plan */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl flex flex-col">
              <div className="absolute top-4 right-4">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  POPULAR
                </span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Plus</h2>
                  <p className="text-white/70 text-sm">Everything you need</p>
                </div>
              </div>
              <div className="mt-4 mb-4">
                <span className="text-4xl font-bold">$9</span>
                <span className="text-white/70 ml-1">/ month</span>
              </div>
              <p className="text-sm text-white/80 mb-4 leading-relaxed">
                For users who want full personal organization and connected finance. Unlock higher
                limits, connect real bank accounts, use automatic transaction categorization, and
                manage vehicles, health, fitness, and private life in a much more complete way.
              </p>
              <button
                onClick={() => toggleFeatures('plus')}
                className="flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white mb-4 transition-colors"
              >
                {expandedPlans.has('plus') ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Hide feature list
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> See full feature list
                  </>
                )}
              </button>
              {expandedPlans.has('plus') && (
                <div className="space-y-3 mb-6">
                  {PLUS_FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/90">
                      <Check className="w-4 h-4 text-white/70 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-4">
                {subIsLoading ? (
                  <Button className="w-full bg-white/20 text-white font-semibold" disabled>
                    Loading...
                  </Button>
                ) : planName === 'plus' ? (
                  <Button
                    className="w-full bg-white text-indigo-700 hover:bg-white/90 font-semibold"
                    disabled
                  >
                    <Check className="w-4 h-4 mr-2" /> Current Plan
                  </Button>
                ) : isPro ? (
                  <Button
                    className="w-full bg-white/20 text-white hover:bg-white/30 font-semibold border border-white/30"
                    onClick={() => setShowDowngradeToPlusWarning(true)}
                    disabled={!!loading}
                  >
                    {loading === 'downgrade-plus' ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin" /> Processing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Crown className="w-4 h-4" /> Downgrade to Plus
                      </span>
                    )}
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-white text-indigo-700 hover:bg-white/90 font-semibold"
                    onClick={handleUpgrade}
                    disabled={!!loading}
                  >
                    {loading === 'plus' ? (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 animate-spin" /> Redirecting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Upgrade to Plus — $9/mo
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl flex flex-col">
              <div className="absolute top-4 right-4">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  BEST VALUE
                </span>
              </div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Pro</h2>
                  <p className="text-white/70 text-sm">Unlimited everything + AI</p>
                </div>
              </div>
              <div className="mt-4 mb-4">
                <span className="text-4xl font-bold">$19</span>
                <span className="text-white/70 ml-1">/ month</span>
              </div>
              <p className="text-sm text-white/80 mb-4 leading-relaxed">
                For power users, solopreneurs, and serious planners. Get unlimited usage across
                almost all areas, full business transactions, and the AI Assistant with access to
                your LifeDesk areas to answer questions and help create entries for you.
              </p>
              <button
                onClick={() => toggleFeatures('pro')}
                className="flex items-center gap-1 text-xs font-medium text-white/70 hover:text-white mb-4 transition-colors"
              >
                {expandedPlans.has('pro') ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> Hide feature list
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> See full feature list
                  </>
                )}
              </button>
              {expandedPlans.has('pro') && (
                <div className="space-y-3 mb-6">
                  {PRO_FEATURES.map(f => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/90">
                      <Check className="w-4 h-4 text-white/70 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-auto pt-4">
                {subIsLoading ? (
                  <Button className="w-full bg-white/20 text-white font-semibold" disabled>
                    Loading...
                  </Button>
                ) : isPro ? (
                  <Button
                    className="w-full bg-white text-orange-700 hover:bg-white/90 font-semibold"
                    disabled
                  >
                    <Check className="w-4 h-4 mr-2" /> Current Plan
                  </Button>
                ) : (
                  <Button
                    className="w-full bg-white text-orange-700 hover:bg-white/90 font-semibold"
                    onClick={handleUpgradePro}
                    disabled={!!loading}
                  >
                    {loading === 'pro' ? (
                      <span className="flex items-center gap-2">
                        <Rocket className="w-4 h-4 animate-spin" /> Redirecting...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Rocket className="w-4 h-4" /> Upgrade to Pro — $19/mo
                      </span>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-8">Secure payment via Stripe.</p>
        </div>

        {/* Downgrade Warning Modal */}
        {showDowngradeToPlusWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Downgrade to Plus</h3>
                  <p className="text-sm text-slate-500 mt-0.5">From Pro ($19/mo) → Plus ($9/mo)</p>
                </div>
                <button
                  onClick={() => setShowDowngradeToPlusWarning(false)}
                  className="ml-auto text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 space-y-3 text-sm text-amber-900">
                <p className="font-semibold">Downgrading will affect your data and features:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    <span>
                      The AI Assistant and unlimited usage will{' '}
                      <strong>no longer be available</strong> on Plus.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    <span>
                      Entries exceeding Plus plan limits will be <strong>locked</strong> until you
                      upgrade again.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    <span>The change takes effect immediately. No data is deleted.</span>
                  </li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDowngradeToPlusWarning(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleDowngradeToPlus}
                  disabled={loading === 'downgrade-plus'}
                >
                  {loading === 'downgrade-plus' ? 'Processing...' : 'I understand, downgrade'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {showDowngradeWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Before you downgrade</h3>
                  <p className="text-sm text-slate-500 mt-0.5">Please read this carefully</p>
                </div>
                <button
                  onClick={() => setShowDowngradeWarning(false)}
                  className="ml-auto text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 space-y-3 text-sm text-amber-900">
                <p className="font-semibold">Downgrading will affect your data and features:</p>
                <ul className="space-y-2 list-none">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    <span>
                      Some features (e.g. AI Assistant, bank connections, analytics){' '}
                      <strong>will no longer be available</strong> on your new plan.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    <span>
                      Any existing entries — goals, tasks, transactions, health records, workouts,
                      etc. — that <strong>exceed the new plan's limits will be locked</strong>. They
                      remain stored but cannot be viewed or edited until you upgrade again.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-amber-500">•</span>
                    <span>No data is deleted — everything can be restored by upgrading.</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowDowngradeWarning(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleConfirmDowngrade}
                  disabled={loading === 'downgrade'}
                >
                  {loading === 'downgrade' ? 'Redirecting...' : 'I understand, downgrade'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
