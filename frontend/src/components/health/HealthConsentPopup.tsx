import { useState } from 'react'
import { backend } from '@/api/backend'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'

interface HealthConsentPopupProps {
  onNotNow: () => void
}

export default function HealthConsentPopup({ onNotNow }: HealthConsentPopupProps) {
  const queryClient = useQueryClient()
  const [checked, setChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEnable = async () => {
    setIsLoading(true)
    setError('')

    try {
      await backend.user.enableHealthConsent()
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    } catch (err) {
      console.error('Enable health consent error:', err)
      setError('Failed to enable Health features. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Enable Health Features</h3>

        <div className="space-y-3 text-sm text-slate-700 mb-5">
          <p>
            LifeDesk processes the health information you enter or upload to provide the Health
            features. This may include symptoms, medications, fitness information and medical
            documents.
          </p>

          <p>
            Your health data may be processed by contracted hosting, cloud storage and other
            technical service providers acting on our instructions.
          </p>

          <p>
            When you actively use an AI-assisted Health feature, the information required for your
            request may also be processed by our contracted AI infrastructure provider. Health data
            is not automatically submitted to the AI Assistant and is not used for advertising, sold
            or used to train general AI models.
          </p>

          <p>
            You may withdraw your consent at any time under Settings → Legal & Privacy. Withdrawing
            your consent will disable the Health area and permanently delete your stored health
            data.
          </p>
        </div>

        <label className="flex items-start gap-2 mb-3">
          <Checkbox
            checked={checked}
            onCheckedChange={v => setChecked(v === true)}
            className="mt-0.5"
          />
          <span className="text-sm text-slate-900">
            I explicitly consent to AGENCY BRAUN EOOD, the operator of LifeDesk, processing the
            health data I enter or upload in the LifeDesk Health area for the purpose of providing
            the Health features, including the use of selected Health data by the AI Assistant when
            I actively initiate such a request.
          </span>
        </label>

        <p className="text-xs text-slate-500 mb-3">
          Learn more in our{' '}
          <a
            href="https://lifedesk.me/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://lifedesk.me/consumer-health-data-privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Consumer Health Data Privacy Policy
          </a>
          .
        </p>

        <p className="text-xs text-slate-500 mb-5">Consent version: 1.01</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onNotNow} disabled={isLoading}>
            Not Now
          </Button>
          <Button className="flex-1" onClick={handleEnable} disabled={!checked || isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Enabling...
              </span>
            ) : (
              'Enable Health'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
