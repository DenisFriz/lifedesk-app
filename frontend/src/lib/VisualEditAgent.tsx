import { useEffect, useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'

interface ElementPosition {
  top: number
  left: number
  right: number
  bottom: number
  width: number
  height: number
  centerX: number
  centerY: number
}

interface MessageEvent {
  type: string
  data?: Record<string, unknown>
}

export default function VisualEditAgent(): null {
  const [isVisualEditMode, setIsVisualEditMode] = useState(false)
  const isVisualEditModeRef = useRef(false)
  const [isPopoverDragging, setIsPopoverDragging] = useState(false)
  const isPopoverDraggingRef = useRef(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const isDropdownOpenRef = useRef(false)
  const hoverOverlaysRef = useRef<HTMLDivElement[]>([])
  const selectedOverlaysRef = useRef<HTMLDivElement[]>([])
  const currentHighlightedElementsRef = useRef<Element[]>([])
  const selectedElementIdRef = useRef<string | null>(null)

  const createOverlay = (isSelected = false): HTMLDivElement => {
    const overlay = document.createElement('div')
    overlay.style.position = 'absolute'
    overlay.style.pointerEvents = 'none'
    overlay.style.transition = 'all 0.1s ease-in-out'
    overlay.style.zIndex = '9999'

    if (isSelected) {
      overlay.style.border = '2px solid #2563EB'
    } else {
      overlay.style.border = '2px solid #95a5fc'
      overlay.style.backgroundColor = 'rgba(99, 102, 241, 0.05)'
    }

    return overlay
  }

  const positionOverlay = (overlay: HTMLDivElement, element: Element, isSelected = false): void => {
    if (!element || !isVisualEditModeRef.current) return

    void (element as HTMLElement).offsetWidth

    const rect = element.getBoundingClientRect()
    overlay.style.top = `${rect.top + window.scrollY}px`
    overlay.style.left = `${rect.left + window.scrollX}px`
    overlay.style.width = `${rect.width}px`
    overlay.style.height = `${rect.height}px`

    let label = overlay.querySelector('div')

    if (!label) {
      label = document.createElement('div')
      label.textContent = element.tagName.toLowerCase()
      label.style.position = 'absolute'
      label.style.top = '-27px'
      label.style.left = '-2px'
      label.style.padding = '2px 8px'
      label.style.fontSize = '11px'
      label.style.fontWeight = isSelected ? '500' : '400'
      label.style.color = isSelected ? '#ffffff' : '#526cff'
      label.style.backgroundColor = isSelected ? '#526cff' : '#DBEAFE'
      label.style.borderRadius = '3px'
      label.style.boxShadow = 'none'
      label.style.minWidth = '24px'
      label.style.textAlign = 'center'
      overlay.appendChild(label)
    }
  }

  const findElementsById = (id: string | null): Element[] => {
    if (!id) return []
    const sourceElements = [...document.querySelectorAll(`[data-source-location="${id}"]`)]
    if (sourceElements.length > 0) {
      return sourceElements
    }
    return [...document.querySelectorAll(`[data-visual-selector-id="${id}"]`)]
  }

  const clearHoverOverlays = (): void => {
    hoverOverlaysRef.current.forEach(overlay => {
      if (overlay && overlay.parentNode) {
        overlay.remove()
      }
    })
    hoverOverlaysRef.current = []
    currentHighlightedElementsRef.current = []
  }

  const handleMouseOver = (e: MouseEvent): void => {
    if (!isVisualEditModeRef.current || isPopoverDraggingRef.current) return

    if (isDropdownOpenRef.current) {
      clearHoverOverlays()
      return
    }

    if ((e.target as Element).tagName.toLowerCase() === 'path') {
      clearHoverOverlays()
      return
    }

    const element = (e.target as Element).closest(
      '[data-source-location], [data-visual-selector-id]'
    )
    if (!element) {
      clearHoverOverlays()
      return
    }

    const selectorId =
      (element as HTMLElement).dataset.sourceLocation ||
      (element as HTMLElement).dataset.visualSelectorId

    if (selectedElementIdRef.current === selectorId) {
      clearHoverOverlays()
      return
    }

    const elements = findElementsById(selectorId)

    clearHoverOverlays()

    elements.forEach(el => {
      const overlay = createOverlay(false)
      document.body.appendChild(overlay)
      hoverOverlaysRef.current.push(overlay)
      positionOverlay(overlay, el)
    })

    currentHighlightedElementsRef.current = elements
  }

  const handleMouseOut = (): void => {
    if (isPopoverDraggingRef.current) return
    clearHoverOverlays()
  }

  const handleElementClick = (e: MouseEvent): void => {
    if (!isVisualEditModeRef.current) return

    if (isDropdownOpenRef.current) {
      e.preventDefault()
      e.stopPropagation()
      ;(e as any).stopImmediatePropagation()

      window.parent.postMessage(
        {
          type: 'close-dropdowns'
        },
        '*'
      )
      return
    }

    if ((e.target as Element).tagName.toLowerCase() === 'path') {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    ;(e as any).stopImmediatePropagation()

    const element = (e.target as Element).closest(
      '[data-source-location], [data-visual-selector-id]'
    )
    if (!element) {
      return
    }

    const visualSelectorId =
      (element as HTMLElement).dataset.sourceLocation ||
      (element as HTMLElement).dataset.visualSelectorId

    selectedOverlaysRef.current.forEach(overlay => {
      if (overlay && overlay.parentNode) {
        overlay.remove()
      }
    })
    selectedOverlaysRef.current = []

    const elements = findElementsById(visualSelectorId)

    elements.forEach(el => {
      const overlay = createOverlay(true)
      document.body.appendChild(overlay)
      selectedOverlaysRef.current.push(overlay)
      positionOverlay(overlay, el, true)
    })

    selectedElementIdRef.current = visualSelectorId

    clearHoverOverlays()

    const rect = (element as HTMLElement).getBoundingClientRect()
    const elementPosition: ElementPosition = {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2
    }

    const elementData = {
      type: 'element-selected',
      tagName: element.tagName,
      classes: (element as any).className?.baseVal || (element as HTMLElement).className || '',
      visualSelectorId: visualSelectorId,
      content: (element as HTMLElement).innerText,
      dataSourceLocation: (element as HTMLElement).dataset.sourceLocation,
      isDynamicContent: (element as HTMLElement).dataset.dynamicContent === 'true',
      linenumber: (element as HTMLElement).dataset.linenumber,
      filename: (element as HTMLElement).dataset.filename,
      position: elementPosition
    }
    window.parent.postMessage(elementData, '*')
  }

  const unselectElement = (): void => {
    selectedOverlaysRef.current.forEach(overlay => {
      if (overlay && overlay.parentNode) {
        overlay.remove()
      }
    })
    selectedOverlaysRef.current = []

    selectedElementIdRef.current = null
  }

  const updateElementClasses = (
    visualSelectorId: string | null,
    classes: string,
    replace = false
  ): void => {
    const elements = findElementsById(visualSelectorId)

    if (elements.length === 0) {
      return
    }

    elements.forEach(element => {
      if (replace) {
        ;(element as HTMLElement).className = classes
      } else {
        const currentClasses =
          (element as any).className?.baseVal || (element as HTMLElement).className || ''
        ;(element as HTMLElement).className = twMerge(currentClasses, classes)
      }
    })

    setTimeout(() => {
      if (selectedElementIdRef.current === visualSelectorId) {
        selectedOverlaysRef.current.forEach((overlay, index) => {
          if (index < elements.length) {
            positionOverlay(overlay, elements[index])
          }
        })
      }

      if (currentHighlightedElementsRef.current.length > 0) {
        const hoveredId = (currentHighlightedElementsRef.current[0] as HTMLElement)?.dataset
          ?.visualSelectorId
        if (hoveredId === visualSelectorId) {
          hoverOverlaysRef.current.forEach((overlay, index) => {
            if (index < currentHighlightedElementsRef.current.length) {
              positionOverlay(overlay, currentHighlightedElementsRef.current[index])
            }
          })
        }
      }
    }, 50)
  }

  const updateElementContent = (visualSelectorId: string | null, content: string): void => {
    const elements = findElementsById(visualSelectorId)

    if (elements.length === 0) {
      return
    }

    elements.forEach(element => {
      ;(element as HTMLElement).innerText = content
    })

    setTimeout(() => {
      if (selectedElementIdRef.current === visualSelectorId) {
        selectedOverlaysRef.current.forEach((overlay, index) => {
          if (index < elements.length) {
            positionOverlay(overlay, elements[index])
          }
        })
      }
    }, 50)
  }

  const toggleVisualEditMode = (isEnabled: boolean): void => {
    setIsVisualEditMode(isEnabled)
    isVisualEditModeRef.current = isEnabled

    if (!isEnabled) {
      clearHoverOverlays()

      selectedOverlaysRef.current.forEach(overlay => {
        if (overlay && overlay.parentNode) {
          overlay.remove()
        }
      })
      selectedOverlaysRef.current = []

      currentHighlightedElementsRef.current = []
      selectedElementIdRef.current = null
      document.body.style.cursor = 'default'

      document.removeEventListener('mouseover', handleMouseOver as any)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('click', handleElementClick as any, true)
    } else {
      document.body.style.cursor = 'crosshair'
      document.addEventListener('mouseover', handleMouseOver as any)
      document.addEventListener('mouseout', handleMouseOut)
      document.addEventListener('click', handleElementClick as any, true)
    }
  }

  useEffect(() => {
    const elementsWithLineNumber = document.querySelectorAll(
      '[data-linenumber]:not([data-visual-selector-id])'
    )
    elementsWithLineNumber.forEach((el, index) => {
      const id = `visual-id-${(el as HTMLElement).dataset.filename}-${(el as HTMLElement).dataset.linenumber}-${index}`
      ;(el as HTMLElement).dataset.visualSelectorId = id
    })

    const handleScroll = (): void => {
      if (selectedElementIdRef.current) {
        const elements = findElementsById(selectedElementIdRef.current)
        if (elements.length > 0) {
          const element = elements[0]
          const rect = element.getBoundingClientRect()

          const viewportHeight = window.innerHeight
          const viewportWidth = window.innerWidth
          const isInViewport =
            rect.top < viewportHeight &&
            rect.bottom > 0 &&
            rect.left < viewportWidth &&
            rect.right > 0

          const elementPosition: ElementPosition = {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height,
            centerX: rect.left + rect.width / 2,
            centerY: rect.top + rect.height / 2
          }

          window.parent.postMessage(
            {
              type: 'element-position-update',
              position: elementPosition,
              isInViewport: isInViewport,
              visualSelectorId: selectedElementIdRef.current
            },
            '*'
          )
        }
      }
    }

    const handleMessage = (event: MessageEvent): void => {
      const message = event.data as MessageEvent

      switch (message.type) {
        case 'toggle-visual-edit-mode':
          toggleVisualEditMode((message.data?.enabled as boolean) ?? false)
          break

        case 'update-classes':
          if (message.data && message.data.classes !== undefined) {
            updateElementClasses(
              message.data.visualSelectorId as string | null,
              message.data.classes as string,
              (message.data.replace as boolean) || false
            )
          } else {
            console.warn('[Agent] Invalid update-classes message:', message)
          }
          break

        case 'unselect-element':
          unselectElement()
          break

        case 'refresh-page':
          window.location.reload()
          break

        case 'update-content':
          if (message.data && message.data.content !== undefined) {
            updateElementContent(
              message.data.visualSelectorId as string | null,
              message.data.content as string
            )
          } else {
            console.warn('[Agent] Invalid update-content message:', message)
          }
          break

        case 'request-element-position':
          if (selectedElementIdRef.current) {
            const elements = findElementsById(selectedElementIdRef.current)
            if (elements.length > 0) {
              const element = elements[0]
              const rect = element.getBoundingClientRect()

              const viewportHeight = window.innerHeight
              const viewportWidth = window.innerWidth
              const isInViewport =
                rect.top < viewportHeight &&
                rect.bottom > 0 &&
                rect.left < viewportWidth &&
                rect.right > 0

              const elementPosition: ElementPosition = {
                top: rect.top,
                left: rect.left,
                right: rect.right,
                bottom: rect.bottom,
                width: rect.width,
                height: rect.height,
                centerX: rect.left + rect.width / 2,
                centerY: rect.top + rect.height / 2
              }

              window.parent.postMessage(
                {
                  type: 'element-position-update',
                  position: elementPosition,
                  isInViewport: isInViewport,
                  visualSelectorId: selectedElementIdRef.current
                },
                '*'
              )
            }
          }
          break

        case 'popover-drag-state':
          if (message.data && message.data.isDragging !== undefined) {
            setIsPopoverDragging(message.data.isDragging as boolean)
            isPopoverDraggingRef.current = message.data.isDragging as boolean

            if (message.data.isDragging) {
              clearHoverOverlays()
            }
          }
          break

        case 'dropdown-state':
          if (message.data && message.data.isOpen !== undefined) {
            setIsDropdownOpen(message.data.isOpen as boolean)
            isDropdownOpenRef.current = message.data.isOpen as boolean

            if (message.data.isOpen) {
              clearHoverOverlays()
            }
          }
          break

        default:
          break
      }
    }

    window.addEventListener('message', handleMessage as any)
    window.addEventListener('scroll', handleScroll, true)
    document.addEventListener('scroll', handleScroll, true)

    window.parent.postMessage({ type: 'visual-edit-agent-ready' }, '*')

    return () => {
      window.removeEventListener('message', handleMessage as any)
      window.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('mouseover', handleMouseOver as any)
      document.removeEventListener('mouseout', handleMouseOut)
      document.removeEventListener('click', handleElementClick as any, true)

      clearHoverOverlays()

      selectedOverlaysRef.current.forEach(overlay => {
        if (overlay && overlay.parentNode) {
          overlay.remove()
        }
      })
    }
  }, [])

  useEffect(() => {
    isVisualEditModeRef.current = isVisualEditMode
  }, [isVisualEditMode])

  useEffect(() => {
    isPopoverDraggingRef.current = isPopoverDragging
  }, [isPopoverDragging])

  useEffect(() => {
    isDropdownOpenRef.current = isDropdownOpen
  }, [isDropdownOpen])

  useEffect(() => {
    const handleResize = (): void => {
      if (selectedElementIdRef.current) {
        const elements = findElementsById(selectedElementIdRef.current)
        selectedOverlaysRef.current.forEach((overlay, index) => {
          if (index < elements.length) {
            positionOverlay(overlay, elements[index])
          }
        })
      }

      if (currentHighlightedElementsRef.current.length > 0) {
        hoverOverlaysRef.current.forEach((overlay, index) => {
          if (index < currentHighlightedElementsRef.current.length) {
            positionOverlay(overlay, currentHighlightedElementsRef.current[index])
          }
        })
      }
    }

    const mutationObserver = new MutationObserver(mutations => {
      const needsUpdate = mutations.some(mutation => {
        const hasVisualId = (node: any): boolean => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.dataset && node.dataset.visualSelectorId) {
              return true
            }
            for (let i = 0; i < node.children.length; i++) {
              if (hasVisualId(node.children[i])) {
                return true
              }
            }
          }
          return false
        }

        const isLayoutChange =
          mutation.type === 'attributes' &&
          (mutation.attributeName === 'style' ||
            mutation.attributeName === 'class' ||
            mutation.attributeName === 'width' ||
            mutation.attributeName === 'height')

        return isLayoutChange && hasVisualId(mutation.target)
      })

      if (needsUpdate) {
        setTimeout(handleResize, 50)
      }
    })

    mutationObserver.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class', 'width', 'height']
    })

    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize)
      mutationObserver.disconnect()
    }
  }, [])

  return null
}
