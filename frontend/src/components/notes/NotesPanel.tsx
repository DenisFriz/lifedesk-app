import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react'
import { StickyNote, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { backend } from '@/api/backend'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useLayout } from '../../Layout'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubscription } from '@/hooks/useSubscription'
import debounce from 'lodash/debounce'
import { useToast } from '@/components/ui/use-toast'

interface NotesPanelContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const NotesPanelContext = createContext<NotesPanelContextType>({
  isOpen: false,
  setIsOpen: () => {}
})

interface NotesPanelButtonProps {
  collapsed: boolean
}

function NotesPanelButton({ collapsed }: NotesPanelButtonProps) {
  const { isOpen, setIsOpen } = useContext(NotesPanelContext)

  return (
    <Button
      onClick={() => setIsOpen(!isOpen)}
      size="icon"
      variant="ghost"
      className="notes-toggle-btn h-10 w-10 rounded-lg shadow-lg bg-white hover:bg-slate-100 border border-slate-200"
    >
      <StickyNote className="w-5 h-5 text-amber-600" />
    </Button>
  )
}

interface NotesPanelContentProps {
  collapsed: boolean
}

function NotesPanelContent({ collapsed }: NotesPanelContentProps) {
  const { isOpen, setIsOpen } = useContext(NotesPanelContext)
  const { toast } = useToast()
  const { limit } = useSubscription()
  const linesLimit = limit('quick_notes_lines_limit')
  const [content, setContent] = useState('')
  const [savedContent, setSavedContent] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<string>(() => {
    const saved = localStorage.getItem('notesActiveTab')
    return saved || 'general'
  })
  const [visibleTabsCount, setVisibleTabsCount] = useState<number>(5)
  const [panelWidth, setPanelWidth] = useState<number>(() => {
    const saved = localStorage.getItem('notesPanelWidth')
    return saved ? parseInt(saved) : 800
  })

  const contentCache = useRef<Record<string, string>>({})
  const scrollCache = useRef<Record<string, number>>(
    JSON.parse(localStorage.getItem('notesScrollCache') || '{}')
  )
  const quillRef = useRef<any>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // Keep refs for use in callbacks/beforeunload
  const contentRef = useRef<string>(content)
  const savedContentRef = useRef<string>(savedContent)
  const activeTabRef = useRef<string>(activeTab)
  const notesRef = useRef<any[]>([])

  useEffect(() => {
    contentRef.current = content
  }, [content])
  useEffect(() => {
    savedContentRef.current = savedContent
  }, [savedContent])
  useEffect(() => {
    activeTabRef.current = activeTab
  }, [activeTab])

  const { data: notes = [], isSuccess: notesLoaded } = useQuery({
    queryKey: ['notes'],
    queryFn: () => backend.entities.Note.list()
  })

  useEffect(() => {
    notesRef.current = notes
  }, [notes])

  const { data: businesses = [] } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => backend.entities.Business.list('order')
  })

  const updateNoteMutation = useMutation({
    mutationFn: async ({ category, newContent }: { category: string; newContent: string }) => {
      const existingNote = notesRef.current.find(n => n.category === category)
      if (existingNote) {
        return backend.entities.Note.update(existingNote.id, { content: newContent })
      } else {
        return backend.entities.Note.create({ category, content: newContent })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] })
    }
  })

  // Debounced autosave — fires 2s after user stops typing
  const debouncedSave = useCallback(
    debounce((category: string, newContent: string) => {
      updateNoteMutation.mutate({ category, newContent })
      setSavedContent(newContent)
      savedContentRef.current = newContent
    }, 2000),
    []
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)')
    setIsMobile(mediaQuery.matches)
    const handleChange = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (isOpen && notesLoaded) {
      if (contentCache.current[activeTab] !== undefined) {
        setContent(contentCache.current[activeTab])
        setSavedContent(contentCache.current[activeTab])
      } else {
        const currentNote = notes.find(n => n.category === activeTab)
        const noteContent = currentNote?.content || ''
        setContent(noteContent)
        setSavedContent(noteContent)
        contentCache.current[activeTab] = noteContent
      }
    }
  }, [isOpen, notes, activeTab, notesLoaded])

  useEffect(() => {
    if (isOpen) {
      const editor = quillRef.current?.getEditor()
      if (editor && editor.scroll && scrollCache.current[activeTab] !== undefined) {
        const scrollContainer = editor.scroll.domNode
        if (scrollContainer) {
          setTimeout(() => {
            scrollContainer.scrollTop = scrollCache.current[activeTab]
          }, 0)
        }
      }
    }
  }, [isOpen, activeTab])

  // Save when closing the panel
  useEffect(() => {
    if (!isOpen && contentRef.current && contentRef.current !== savedContentRef.current) {
      updateNoteMutation.mutate({ category: activeTabRef.current, newContent: contentRef.current })
      setSavedContent(contentRef.current)
    }
  }, [isOpen])

  const handleContentChange = (
    newContent: string,
    delta: any,
    source: string,
    editor: any
  ): void => {
    if (source === 'user') {
      const html = editor.getHTML()
      const text = editor.getText()
      const lineCount = text.split('\n').length - 1

      // Check if the delta contains newline insertions (e.g. from paste)
      const isInsertingNewLines = delta.ops?.some(
        op => typeof op.insert === 'string' && op.insert.includes('\n')
      )

      if (linesLimit !== Infinity && lineCount > linesLimit) {
        // Fallback: undo if limit is exceeded (catches paste and other edge cases)
        if (isInsertingNewLines) {
          editor.history.undo()
          showLimitToast()
          return
        }
      }

      if (linesLimit !== Infinity && isInsertingNewLines && lineCount >= linesLimit) {
        editor.history.undo()
        showLimitToast()
        return
      }

      if (text.length > 1000000) return

      setContent(html)
      contentRef.current = html
      contentCache.current[activeTab] = html

      debouncedSave(activeTab, html)
    }
  }

  const getCurrentLineCount = (): number => {
    const editor = quillRef.current?.getEditor()
    if (!editor) return 0
    const text = editor.getText()
    return text.split('\n').length - 1
  }

  const handleSave = (): void => {
    if (content !== undefined) {
      const editor = quillRef.current?.getEditor()
      if (editor && editor.scroll) {
        const scrollContainer = editor.scroll.domNode
        if (scrollContainer) {
          scrollCache.current[activeTab] = scrollContainer.scrollTop
          localStorage.setItem('notesScrollCache', JSON.stringify(scrollCache.current))
        }
      }
      debouncedSave.cancel()
      updateNoteMutation.mutate({ category: activeTab, newContent: content })
      setSavedContent(content)
      savedContentRef.current = content
      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 2000)
    }
  }

  const handleTabChange = (newTab: string): void => {
    const previousTab = activeTab
    const previousContent = content

    const editor = quillRef.current?.getEditor()
    if (editor && editor.scroll) {
      const scrollContainer = editor.scroll.domNode
      if (scrollContainer) {
        scrollCache.current[previousTab] = scrollContainer.scrollTop
        localStorage.setItem('notesScrollCache', JSON.stringify(scrollCache.current))
      }
    }

    if (previousContent !== savedContent && previousContent !== undefined) {
      debouncedSave.cancel()
      updateNoteMutation.mutate({ category: previousTab, newContent: previousContent })
      setSavedContent(previousContent)
      savedContentRef.current = previousContent
    }

    setContent('')
    setActiveTab(newTab)
    localStorage.setItem('notesActiveTab', newTab)
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, content, savedContent, activeTab])

  // Save on page unload (refresh/close)
  useEffect(() => {
    const saveBeforeUnload = (): void => {
      const editor = quillRef.current?.getEditor()
      if (editor && editor.scroll) {
        const scrollContainer = editor.scroll.domNode
        if (scrollContainer) {
          scrollCache.current[activeTabRef.current] = scrollContainer.scrollTop
          localStorage.setItem('notesScrollCache', JSON.stringify(scrollCache.current))
        }
      }

      const currentContent = contentRef.current
      const currentSaved = savedContentRef.current
      const currentTab = activeTabRef.current

      if (currentContent && currentContent !== currentSaved) {
        debouncedSave.cancel()
        const existingNote = notesRef.current.find(n => n.category === currentTab)
        const payload = JSON.stringify({ category: currentTab, content: currentContent })
        const apiUrl = existingNote
          ? `${window.location.origin}/api/entities/Note/${existingNote.id}`
          : `${window.location.origin}/api/entities/Note`
        navigator.sendBeacon(apiUrl, new Blob([payload], { type: 'application/json' }))
      }
    }

    window.addEventListener('beforeunload', saveBeforeUnload)
    return () => window.removeEventListener('beforeunload', saveBeforeUnload)
  }, [])

  const sidebarWidth = collapsed ? 64 : 256

  useEffect(() => {
    const updateVisibleTabs = (): void => {
      if (!panelRef.current) return
      const containerWidth = isMobile ? window.innerWidth : panelWidth
      const availableWidth = containerWidth - 82
      const tabWidth = 85
      const maxTabs = Math.max(2, Math.floor(availableWidth / tabWidth))
      setVisibleTabsCount(Math.min(maxTabs, allTabs.length))
    }
    updateVisibleTabs()
    window.addEventListener('resize', updateVisibleTabs)
    return () => window.removeEventListener('resize', updateVisibleTabs)
  }, [isMobile, panelWidth, businesses.length])

  const showLimitToast = useCallback(() => {
    toast({
      title: 'Line limit reached',
      description: `You've reached the ${linesLimit}-line limit. Upgrade your plan for more lines.`,
      variant: 'destructive'
    })
  }, [linesLimit, toast])

  const modules = React.useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean']
      ],
      keyboard: {
        bindings: {
          handleEnter: {
            key: 'Enter',
            handler(range) {
              if (linesLimit === Infinity) return true
              const editor = quillRef.current?.getEditor()
              if (!editor) return true
              const lineCount = editor.getText().split('\n').length - 1
              if (lineCount >= linesLimit) {
                showLimitToast()
                return false
              }
              return true
            }
          }
        }
      },
      clipboard: { matchVisual: false }
    }),
    [linesLimit, showLimitToast]
  )

  const { isHidden: isHiddenFromLayout } = useLayout()
  const isHidden = typeof isHiddenFromLayout === 'function' ? isHiddenFromLayout : () => false

  const getOrderedCategories = (): any[] => {
    const categories = [
      { id: 'assets', label: 'Assets', sectionPath: 'Private > Assets' },
      { id: 'health_body', label: 'Health', sectionPath: 'Private > Health' },
      { id: 'fitness', label: 'Fitness', sectionPath: 'Private > Fitness' },
      { id: 'hobbies', label: 'Hobbies', sectionPath: 'Private > Hobbies' },
      { id: 'learning', label: 'Learning', sectionPath: 'Private > Learning & Development' },
      { id: 'relationships', label: 'Relationships', sectionPath: 'Private > Relationships' }
    ]
    const saved = localStorage.getItem('subsectionOrder')
    const subsectionOrder = saved ? JSON.parse(saved) : {}
    const privateOrder = subsectionOrder['Private'] || []
    if (privateOrder.length === 0) return categories
    return [...categories].sort((a, b) => {
      const nameA = a.sectionPath.replace('Private > ', '')
      const nameB = b.sectionPath.replace('Private > ', '')
      const indexA = privateOrder.indexOf(nameA)
      const indexB = privateOrder.indexOf(nameB)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }

  const getOrderedBusinesses = (): any[] => {
    const saved = localStorage.getItem('subsectionOrder')
    const subsectionOrder = saved ? JSON.parse(saved) : {}
    const businessOrder = subsectionOrder['Business'] || []
    if (businessOrder.length === 0) return businesses
    return [...businesses].sort((a, b) => {
      const indexA = businessOrder.indexOf(a.name)
      const indexB = businessOrder.indexOf(b.name)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  }

  const orderedCategories = getOrderedCategories()
  const orderedBusinesses = getOrderedBusinesses()

  const getSectionOrder = (): string[] => {
    const saved = localStorage.getItem('sectionOrder')
    return saved ? JSON.parse(saved) : []
  }

  const sectionOrder = getSectionOrder()
  const businessIndex = sectionOrder.indexOf('Business')
  const privateIndex = sectionOrder.indexOf('Private')
  const businessBeforePrivate =
    businessIndex !== -1 && privateIndex !== -1 && businessIndex < privateIndex

  const privateTabs = orderedCategories
  const businessTabs = orderedBusinesses.map(b => ({
    id: `business-${b.id}`,
    label: b.name,
    sectionPath: `Business > ${b.name}`
  }))

  const allTabsRaw = [
    { id: 'general', label: 'General', sectionPath: 'Home' },
    ...(businessBeforePrivate
      ? [...businessTabs, ...privateTabs]
      : [...privateTabs, ...businessTabs])
  ]

  const allTabs = allTabsRaw.filter(tab => !isHidden(tab.sectionPath))
  const visibleTabs = allTabs.slice(0, visibleTabsCount)
  const overflowTabs = allTabs.slice(visibleTabsCount)

  return (
    <>
      {/* Mobile Full-Screen Notes Panel */}
      {isMobile && isOpen && (
        <div ref={panelRef} className="lg:hidden fixed inset-0 z-[60] bg-white flex flex-col">
          <div className="px-4 py-3 flex items-center justify-between border-b border-slate-200 flex-shrink-0">
            <h3 className="text-lg font-semibold text-slate-900">Quick Notes</h3>
            <div className="flex items-center gap-2">
              {linesLimit !== Infinity &&
                quillRef.current &&
                (() => {
                  const lines = getCurrentLineCount()
                  const isNearLimit = lines >= linesLimit * 0.9
                  const isAtLimit = lines >= linesLimit
                  return (
                    <span
                      className={`text-xs font-semibold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-slate-400'}`}
                    >
                      {lines} / {linesLimit} lines
                    </span>
                  )
                })()}
              <button
                onClick={handleSave}
                className={`px-3 py-1 text-sm rounded transition-colors ${isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
              >
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded hover:bg-slate-100 -mr-2"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>
          </div>

          <div className="bg-[#eaecf4] p-1 flex items-center gap-1 overflow-x-auto flex-shrink-0">
            {visibleTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors',
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-transparent text-[#475569]'
                )}
              >
                {tab.label}
              </button>
            ))}
            {overflowTabs.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'px-3 py-1.5 text-sm font-medium rounded-md flex items-center gap-1 h-auto',
                      overflowTabs.some(tab => tab.id === activeTab)
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'bg-transparent text-[#475569]'
                    )}
                  >
                    More <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-[70]">
                  {overflowTabs.map(tab => (
                    <DropdownMenuItem
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={activeTab === tab.id ? 'bg-indigo-50' : ''}
                    >
                      {tab.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex-1 overflow-hidden">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              value={content ?? ''}
              onChange={handleContentChange}
              modules={modules}
              className="notes-editor h-full"
            />
          </div>
        </div>
      )}

      {/* Desktop Sliding Notes Panel */}
      {!isMobile && (
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/20 z-30 hidden lg:block"
                style={{ left: `${sidebarWidth}px` }}
                onClick={() => {
                  if (content && content !== savedContent) {
                    debouncedSave.cancel()
                    updateNoteMutation.mutate({ category: activeTab, newContent: content })
                    setSavedContent(content)
                    savedContentRef.current = content
                  }
                  setIsOpen(false)
                }}
              />

              <motion.div
                ref={panelRef}
                initial={{ x: -panelWidth, left: sidebarWidth }}
                animate={{ x: 0, left: sidebarWidth }}
                exit={{ x: -panelWidth }}
                transition={{ type: 'spring', damping: 30, stiffness: 200, mass: 0.8 }}
                className="fixed top-0 h-full bg-white shadow-2xl z-40 flex flex-col border-r border-slate-200 hidden lg:flex"
                style={{ width: `${panelWidth}px` }}
              >
                <div className="h-full flex flex-col">
                  <div className="px-4 pt-4 pb-2 flex-shrink-0 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900">Quick Notes</h3>
                    <div className="flex items-center gap-2">
                      {linesLimit !== Infinity &&
                        quillRef.current &&
                        (() => {
                          const lines = getCurrentLineCount()
                          const isNearLimit = lines >= linesLimit * 0.9
                          const isAtLimit = lines >= linesLimit
                          return (
                            <span
                              className={`text-xs font-semibold ${isAtLimit ? 'text-red-600' : isNearLimit ? 'text-amber-600' : 'text-slate-400'}`}
                            >
                              {lines} / {linesLimit}
                            </span>
                          )
                        })()}
                      <button
                        onClick={handleSave}
                        className={`px-2 py-1 text-xs rounded transition-colors ${isSaved ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                      >
                        {isSaved ? 'Saved' : 'Save'}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mr-2"
                        onClick={() => setIsOpen(false)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="bg-[#eaecf4] p-1 flex items-center gap-1 overflow-x-auto flex-shrink-0">
                    {visibleTabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors',
                          activeTab === tab.id
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'bg-transparent text-[#475569]'
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                    {overflowTabs.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              'px-2 py-1 text-xs font-medium rounded-md flex items-center gap-1 h-auto',
                              overflowTabs.some(tab => tab.id === activeTab)
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'bg-transparent text-[#475569]'
                            )}
                          >
                            More <ChevronDown className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[70]">
                          {overflowTabs.map(tab => (
                            <DropdownMenuItem
                              key={tab.id}
                              onClick={() => handleTabChange(tab.id)}
                              className={activeTab === tab.id ? 'bg-indigo-50' : ''}
                            >
                              {tab.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden">
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      value={content ?? ''}
                      onChange={handleContentChange}
                      modules={modules}
                      className="notes-editor h-full"
                    />
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}
    </>
  )
}

interface NotesPanelProps {
  collapsed: boolean
  isOpen?: boolean
  setIsOpen?: (open: boolean) => void
}

export default function NotesPanel({
  collapsed,
  isOpen: externalIsOpen,
  setIsOpen: externalSetIsOpen
}: NotesPanelProps) {
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false)
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen
  const setIsOpen = externalSetIsOpen || setInternalIsOpen

  return (
    <NotesPanelContext.Provider value={{ isOpen, setIsOpen }}>
      <NotesPanelContent collapsed={collapsed} />
    </NotesPanelContext.Provider>
  )
}
