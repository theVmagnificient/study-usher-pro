import { useState, useCallback, useEffect, RefObject } from 'react'
import type { ReportTemplate } from '@/data/reportTemplates'

interface UseSlashTemplatesOptions {
  templates: ReportTemplate[]
  value: string
  textareaRef: RefObject<HTMLTextAreaElement | null>
  onUpdate: (value: string) => void
}

export function useSlashTemplates({ templates, value, textareaRef, onUpdate }: UseSlashTemplatesOptions) {
  const [showPopup, setShowPopup] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [slashPosition, setSlashPosition] = useState(-1)

  const filteredTemplates = templates.filter(t =>
    !searchQuery ? true : t.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const closePopup = useCallback(() => {
    setShowPopup(false)
    setSearchQuery('')
    setSlashPosition(-1)
    setActiveIndex(0)
  }, [])

  const selectTemplate = useCallback((template: ReportTemplate) => {
    const el = textareaRef.current
    if (!el) return
    const cursorPos = el.selectionStart
    const before = value.substring(0, slashPosition)
    const after = value.substring(cursorPos)
    const newValue = before + template.text + after
    onUpdate(newValue)
    closePopup()
    setTimeout(() => {
      if (el) {
        el.focus()
        const newPos = slashPosition + template.text.length
        el.setSelectionRange(newPos, newPos)
      }
    }, 0)
  }, [value, slashPosition, textareaRef, onUpdate, closePopup])

  const onKeydown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPopup) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex(i => (i + 1) % filteredTemplates.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex(i => (i - 1 + filteredTemplates.length) % filteredTemplates.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredTemplates.length > 0) selectTemplate(filteredTemplates[activeIndex])
        return
      }
      if (e.key === 'Escape' || e.key === 'Tab') {
        closePopup()
        return
      }
    }

    if (e.key === '/' && !showPopup && templates.length > 0) {
      const el = textareaRef.current
      if (!el) return
      setSlashPosition(el.selectionStart)
      setSearchQuery('')
      setActiveIndex(0)
      setTimeout(() => setShowPopup(true), 0)
    }
  }, [showPopup, filteredTemplates, activeIndex, templates, textareaRef, selectTemplate, closePopup])

  const onInput = useCallback(() => {
    if (!showPopup || slashPosition === -1) return
    const el = textareaRef.current
    if (!el) return
    const currentPos = el.selectionStart
    if (currentPos <= slashPosition || value[slashPosition] !== '/') {
      closePopup()
      return
    }
    const textAfterSlash = value.substring(slashPosition + 1, currentPos)
    if (textAfterSlash.includes('\n')) {
      closePopup()
      return
    }
    setSearchQuery(textAfterSlash)
    setActiveIndex(0)
  }, [showPopup, slashPosition, value, textareaRef, closePopup])

  // Close on outside click
  useEffect(() => {
    if (!showPopup) return
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (target.closest('[data-template-popup]')) return
      if (textareaRef.current && textareaRef.current.contains(target)) return
      closePopup()
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [showPopup, textareaRef, closePopup])

  return { showPopup, filteredTemplates, activeIndex, searchQuery, onKeydown, onInput, selectTemplate, closePopup }
}
