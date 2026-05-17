import { GoogleLogin } from '@react-oauth/google'

type Props = {
  onSuccess: (credentialResponse: any) => void
  onError: () => void
  disabled?: boolean
}

export default function GoogleAuth({ onSuccess, onError, disabled }: Props) {
  return (
    <div className="mb-6 space-y-4 w-full">
      <div className="flex justify-center w-full px-2 sm:px-0">
        <div
          className={`
            w-full max-w-[320px] sm:max-w-[320px]
          `}
        >
          <div className="flex justify-center w-full px-4">
            <div className="w-full max-w-[320px]">
              <GoogleLogin
                onSuccess={onSuccess}
                onError={onError}
                theme="outline"
                size="large"
                shape="pill"
                text="continue_with"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-2 sm:px-0">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>

        <div className="relative flex justify-center text-[11px] sm:text-xs uppercase">
          <span className="bg-white px-3 text-slate-400">Or continue with email</span>
        </div>
      </div>
    </div>
  )
}
