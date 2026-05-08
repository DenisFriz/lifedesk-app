import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Shield } from 'lucide-react'
import { User } from '@/types'

const TERMS_VERSION = '1.0'

interface Props {
  user: User | null
  children: React.ReactNode
}

export default function TermsAcceptanceGate({ user, children }: Props) {
  const [accepted, setAccepted] = useState<boolean>(false)
  const queryClient = useQueryClient()

  const acceptMutation = useMutation({
    mutationFn: () =>
      backend.auth.updateMe({
        terms_accepted_at: new Date().toISOString(),
        terms_accepted_version: TERMS_VERSION
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      window.location.reload()
    }
  })

  // Wait for user data to load before deciding
  if (!user) return <>{children}</>

  // If already accepted, render children normally
  if (user.terms_accepted_at) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Terms of Service & Privacy Policy
            </h2>
            <p className="text-sm text-slate-500">Please read and accept before continuing</p>
          </div>
        </div>

        {/* Scrollable content */}
        <ScrollArea className="h-72 px-6 py-4">
          <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">1. Acceptance of Terms</h3>
              <p>
                By accessing and using lifedesk, you accept and agree to be bound by these Terms of
                Service and our Privacy Policy. If you do not agree to these terms, please do not
                use the application.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">2. Use of the Service</h3>
              <p>
                lifedesk is a personal life management platform. You agree to use it only for lawful
                purposes and in a way that does not infringe the rights of others or restrict their
                use of the service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">3. Your Data</h3>
              <p>
                You retain full ownership of all data you enter into lifedesk. We store your data
                securely and do not sell or share your personal information with third parties
                without your explicit consent.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">4. Financial Data</h3>
              <p>
                When you connect bank accounts, financial data is fetched via secure third-party
                services (Plaid). We do not store your banking credentials. Transaction data is
                stored only to provide the app's budgeting features.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">5. Privacy Policy</h3>
              <p>
                We collect only the data necessary to provide our service. This includes your email
                address, profile information, and any data you voluntarily enter. We use
                industry-standard encryption to protect your data at rest and in transit. We can use
                anonymous data analyzing and statistics.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">6. Account Responsibility</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities that occur under your account.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">7. Modifications</h3>
              <p>
                We reserve the right to modify these terms at any time. Continued use of the service
                after changes constitutes your acceptance of the new terms.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">8. Termination</h3>
              <p>
                You may delete your account at any time. We reserve the right to suspend or
                terminate accounts that violate these terms.
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={accepted}
              onCheckedChange={checked => setAccepted(!!checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-slate-700">
              I have read and agree to the <strong>Terms of Service</strong> and{' '}
              <strong>Privacy Policy</strong> of lifedesk.
            </span>
          </label>
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={!accepted || acceptMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {acceptMutation.isPending ? 'Saving...' : 'Accept & Continue'}
          </Button>
        </div>
      </div>
    </div>
  )
}
