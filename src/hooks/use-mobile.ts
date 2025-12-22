import { ref, computed, onMounted, onUnmounted } from 'vue'

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const isMobile = ref<boolean | undefined>(undefined)

  const checkMobile = () => {
    isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
  }

  let mql: MediaQueryList | null = null

  onMounted(() => {
    mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    checkMobile()
    mql.addEventListener('change', checkMobile)
  })

  onUnmounted(() => {
    if (mql) {
      mql.removeEventListener('change', checkMobile)
    }
  })

  return computed(() => !!isMobile.value)
}

