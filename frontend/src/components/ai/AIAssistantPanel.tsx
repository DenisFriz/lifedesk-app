import React, { useState, useRef, useEffect, Dispatch, SetStateAction } from 'react'
import { backend } from '@/api/backend'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { X, Send, Loader, Sparkles, Image as ImageIcon, X as XIcon, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { Link } from 'react-router-dom'
import { useSubscription } from '@/hooks/useSubscription'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
}

type ChatMutationInput = {
  question: string
  file_urls?: string[]
}

type ChatResponse = {
  data: {
    answer: string
  }
}

type ApiError = {
  response?: {
    data?: {
      error?: string
    }
  }
  message: string
}

type UploadResult = {
  file_url: string
}

interface AIAssistantPanelProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  messages: ChatMessage[]
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>
  collapsed: boolean
}

export default function AIAssistantPanel({
  isOpen,
  setIsOpen,
  messages,
  setMessages,
  collapsed
}: AIAssistantPanelProps) {
  const [input, setInput] = useState<string>('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => backend.auth.me()
  })

  const sidebarWidth = collapsed ? 64 : 256
  const { can } = useSubscription()
  const aiEnabled = can('ai_assistant')

  const chatMutation = useMutation<ChatResponse, ApiError, ChatMutationInput>({
    mutationFn: ({ question, file_urls }) =>
      backend.functions.invoke('aiHealthChat', { question, file_urls }),

    onSuccess: response => {
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.answer }])
      setInput('')
      setUploadedImages([])
    },

    onError: error => {
      const errorMsg = error.response?.data?.error || 'Failed to get response'
      setMessages(prev => [...prev, { role: 'assistant', content: `Error: ${errorMsg}` }])
    }
  })

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      const uploadPromises = files.map(
        (file: File) => backend.integrations.Core.UploadFile({ file }) as Promise<UploadResult>
      )

      const results = await Promise.all(uploadPromises)
      const fileUrls = results.map(r => r.file_url)

      setUploadedImages(prev => [...prev, ...fileUrls])
    } catch (error) {
      console.error('Failed to upload images:', error)
    }
  }

  const removeImage = (index: number): void => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSend = (): void => {
    if (!input.trim() && uploadedImages.length === 0) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: input,
      images: uploadedImages.length > 0 ? uploadedImages : undefined
    }

    setMessages(prev => [...prev, userMessage])

    chatMutation.mutate({
      question: input || 'Analyze the uploaded images',
      file_urls: uploadedImages.length > 0 ? uploadedImages : undefined
    })
  }

  if (!isOpen) return null

  // If AI not enabled on plan, show upgrade message instead
  if (!aiEnabled) {
    return (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/20 z-30"
          style={{ left: `${sidebarWidth}px` }}
        />
        <motion.div
          initial={{ x: -400, left: sidebarWidth }}
          animate={{ x: 0, left: sidebarWidth }}
          exit={{ x: -400 }}
          transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
          className="fixed top-0 bottom-0 z-40 w-96 bg-white shadow-2xl flex flex-col"
        >
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900">AI Assistant</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-500" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 text-lg mb-2">AI Assistant</h4>
              <p className="text-sm text-slate-500">
                The AI Assistant is available on PRO plan. Upgrade to unlock intelligent insights
                across all your data.
              </p>
            </div>
            <Link
              to="/Upgrade"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>Upgrade your plan to access this feature →</span>
            </Link>
          </div>
        </motion.div>
      </>
    )
  }

  return (
    <>
      {/* Background Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setIsOpen(false)}
        className="fixed inset-0 bg-black/20 z-30"
        style={{ left: `${sidebarWidth}px` }}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: -400, left: sidebarWidth }}
        animate={{ x: 0, left: sidebarWidth }}
        exit={{ x: -400 }}
        transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
        className="fixed top-0 bottom-0 z-40 w-96 bg-white shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Assistant</h3>
              <p className="text-xs text-slate-500">Pro feature</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 px-4">
              <Sparkles className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium">Ask me anything</p>
              <p className="text-sm mt-2">
                I have access to all your data: health, fitness, business, finances, goals, and more
              </p>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'flex gap-3',
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'rounded-lg px-4 py-2.5 max-w-xs text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-900'
                    )}
                  >
                    {msg.images && msg.images.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {msg.images.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt=""
                            className="w-20 h-20 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                    {msg.role === 'assistant' ? (
                      <ReactMarkdown className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_strong]:font-semibold">
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <p>{msg.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Loader className="w-3 h-3 text-white animate-spin" />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-500 text-sm">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {uploadedImages.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img} alt="" className="w-16 h-16 object-cover rounded border" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <XIcon className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={chatMutation.isPending}
              className="flex-shrink-0"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Ask me anything..."
              disabled={chatMutation.isPending}
              className="text-sm resize-none"
              rows={2}
            />
            <Button
              onClick={handleSend}
              disabled={(!input.trim() && uploadedImages.length === 0) || chatMutation.isPending}
              size="icon"
              className="bg-indigo-600 hover:bg-indigo-700 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-slate-500 text-center">Analyzes all your app data & images</p>
        </div>
      </motion.div>
    </>
  )
}
