import { useState, useEffect, useRef, useCallback } from 'react'
import { useLayout } from '@/Layout'

type TabConfig = {
  value: string
  label: string
  filterType: string
  category?: string
  section?: string
}

export function useEntityTabs({ tabs, storageKey }: { tabs: TabConfig[]; storageKey: string }) {
  const { isHidden } = useLayout()

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(storageKey) || 'all'
  })

  const [visibleTabs, setVisibleTabs] = useState<TabConfig[]>([])
  const [overflowTabs, setOverflowTabs] = useState<TabConfig[]>([])
  const [isScrolled, setIsScrolled] = useState(false)

  const headerRef = useRef<HTMLDivElement | null>(null)

  const getOrderedTabs = useCallback(() => {
    const saved = localStorage.getItem('subsectionOrder')
    const subsectionOrder = saved ? JSON.parse(saved) : {}

    const privateOrder = subsectionOrder['Private'] || []

    return [...tabs]
      .sort((a, b) => {
        if (!a.section || !b.section) return 0

        const nameA = a.section.replace('Private > ', '')
        const nameB = b.section.replace('Private > ', '')

        const indexA = privateOrder.indexOf(nameA)
        const indexB = privateOrder.indexOf(nameB)

        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })
      .filter(tab => !tab.section || !isHidden(tab.section))
  }, [tabs, isHidden])

  useEffect(() => {
    const calculate = () => {
      const maxVisible = window.innerWidth < 640 ? 6 : window.innerWidth < 1024 ? 9 : 12

      const ordered = getOrderedTabs()

      setVisibleTabs(ordered.slice(0, maxVisible))
      setOverflowTabs(ordered.slice(maxVisible))
    }

    calculate()
    window.addEventListener('resize', calculate)
    return () => window.removeEventListener('resize', calculate)
  }, [getOrderedTabs])

  useEffect(() => {
    if (!headerRef.current) return

    const observer = new IntersectionObserver(([entry]) => setIsScrolled(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: '-60px 0px 0px 0px'
    })

    observer.observe(headerRef.current)
    return () => observer.disconnect()
  }, [])

  const changeTab = (value: string) => {
    setActiveTab(value)
    localStorage.setItem(storageKey, value)
  }

  return {
    activeTab,
    setActiveTab: changeTab,
    visibleTabs,
    overflowTabs,
    isScrolled,
    headerRef
  }
}
