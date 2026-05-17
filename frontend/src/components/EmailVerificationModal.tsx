import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (code: string) => void
  loading?: boolean
}

export default function EmailVerificationModal({ open, onClose, onSubmit, loading }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (open) {
      setDigits(Array(6).fill(''))
      setTimeout(() => inputsRef.current[0]?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return

    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e: any, index: number) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const arr = pasted.split('')
    const newDigits = Array(6).fill('')

    arr.forEach((d, i) => {
      newDigits[i] = d
    })

    setDigits(newDigits)
  }

  const handleSubmit = () => {
    const code = digits.join('')
    if (code.length !== 6) return
    onSubmit(code)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[420px] rounded-2xl shadow-xl p-6">
        <h2 className="text-xl font-semibold text-slate-900">Verify your email</h2>

        <p className="text-sm text-slate-500 mt-1">Enter the 6-digit code we sent to your email</p>

        {/* OTP INPUTS */}
        <div className="flex gap-2 justify-center mt-6">
          {digits.map((digit, i) => (
            <Input
              key={i}
              ref={el => (inputsRef.current[i] = el)}
              value={digit}
              onChange={e => handleChange(e.target.value, i)}
              onKeyDown={e => handleKeyDown(e, i)}
              onPaste={handlePaste}
              maxLength={1}
              className="w-12 h-12 text-center text-lg font-semibold"
            />
          ))}
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="flex-1" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Verifying...' : 'Confirm'}
          </Button>

          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">Code expires in 10 minutes</p>
      </div>
    </div>
  )
}
