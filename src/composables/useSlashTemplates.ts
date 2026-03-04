import { ref, computed, type Ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import type { ReportTemplate } from '@/data/reportTemplates'

export function useSlashTemplates(options: {
  templates: ReportTemplate[]
  modelValue: Ref<string>
  textareaEl: Ref<HTMLTextAreaElement | null>
  onUpdate: (value: string) => void
}) {
  const { templates, modelValue, textareaEl, onUpdate } = options

  const showPopup = ref(false)
  const searchQuery = ref('')
  const activeIndex = ref(0)
  const slashPosition = ref(-1)

  const filteredTemplates = computed(() => {
    if (!searchQuery.value) return templates
    const q = searchQuery.value.toLowerCase()
    return templates.filter(t => t.label.toLowerCase().includes(q))
  })

  function onKeydown(e: KeyboardEvent) {
    if (showPopup.value) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value + 1) % filteredTemplates.value.length
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        activeIndex.value = (activeIndex.value - 1 + filteredTemplates.value.length) % filteredTemplates.value.length
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredTemplates.value.length > 0) {
          selectTemplate(filteredTemplates.value[activeIndex.value])
        }
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closePopup()
        return
      }
      if (e.key === 'Tab') {
        closePopup()
        return
      }
    }

    if (e.key === '/' && !showPopup.value && templates.length > 0) {
      const el = textareaEl.value
      if (!el) return
      slashPosition.value = el.selectionStart
      searchQuery.value = ''
      activeIndex.value = 0
      // Show popup after the "/" character is inserted
      nextTick(() => {
        showPopup.value = true
      })
    }
  }

  function onInput() {
    if (!showPopup.value || slashPosition.value === -1) return
    const el = textareaEl.value
    if (!el) return

    const currentPos = el.selectionStart
    // Extract text between slash+1 and cursor as search query
    const textAfterSlash = modelValue.value.substring(slashPosition.value + 1, currentPos)

    // If user moved cursor before the slash or deleted the slash, close popup
    if (currentPos <= slashPosition.value || modelValue.value[slashPosition.value] !== '/') {
      closePopup()
      return
    }

    // If user typed a space right after "/" with no query, close popup
    if (textAfterSlash.includes('\n')) {
      closePopup()
      return
    }

    searchQuery.value = textAfterSlash
    activeIndex.value = 0
  }

  function selectTemplate(template: ReportTemplate) {
    const el = textareaEl.value
    if (!el) return

    const value = modelValue.value
    const cursorPos = el.selectionStart
    // Remove "/" and any filter text, insert template text
    const before = value.substring(0, slashPosition.value)
    const after = value.substring(cursorPos)
    const newValue = before + template.text + after

    onUpdate(newValue)
    closePopup()

    // Restore focus and set cursor position after the inserted text
    nextTick(() => {
      if (el) {
        el.focus()
        const newPos = slashPosition.value + template.text.length
        el.setSelectionRange(newPos, newPos)
      }
    })
  }

  function closePopup() {
    showPopup.value = false
    searchQuery.value = ''
    slashPosition.value = -1
    activeIndex.value = 0
  }

  // Close popup on outside click
  function onDocumentClick(e: MouseEvent) {
    if (!showPopup.value) return
    const target = e.target as HTMLElement
    // If click is inside popup, don't close
    if (target.closest('[data-template-popup]')) return
    // If click is on the textarea itself, don't close (let onInput handle it)
    if (textareaEl.value && textareaEl.value.contains(target)) return
    closePopup()
  }

  onMounted(() => {
    document.addEventListener('click', onDocumentClick)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('click', onDocumentClick)
  })

  return {
    showPopup,
    filteredTemplates,
    activeIndex,
    searchQuery,
    onKeydown,
    onInput,
    selectTemplate,
    closePopup,
  }
}
