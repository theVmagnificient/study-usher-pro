import type { Composer } from 'vue-i18n'

/**
 * Локализует действие аудита
 * @param action - действие на английском (например, "Status Changed")
 * @param t - функция i18n translate
 * @returns локализованное действие
 */
export function localizeAuditAction(action: string, t: Composer['t']): string {
  const key = `auditLog.actions.${action}`
  const translation = t(key)

  // Если перевод не найден, возвращаем оригинальный текст
  return translation === key ? action : translation
}
