import { createI18n } from 'vue-i18n'

const savedLanguage = localStorage.getItem('language') || 'en'

const messages = {
  en: {
    nav: {
      studyList: "Study List",
      taskTypes: "Task Types",
      userManagement: "User Management",
      workforceCapacity: "Workforce Capacity",
      auditLog: "Audit Log",
      slaDashboard: "SLA Dashboard",
      myQueue: "My Queue",
      validationQueue: "Validation Queue",
      myProfile: "My Profile"
    },
    roles: {
      admin: "Admin",
      reportingRadiologist: "Reporting Radiologist",
      validatingRadiologist: "Validating Radiologist"
    },
    sidebar: {
      activeRole: "Active Role",
      lightMode: "Light Mode",
      darkMode: "Dark Mode"
    },
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      search: "Search",
      filter: "Filter",
      actions: "Actions",
      status: "Status",
      date: "Date",
      time: "Time",
      comments: "Comments",
      submit: "Submit",
      approve: "Approve",
      return: "Return",
      download: "Download",
      language: "Language"
    }
  },
  ru: {
    nav: {
      studyList: "Список исследований",
      taskTypes: "Типы задач",
      userManagement: "Управление пользователями",
      workforceCapacity: "Планирование ресурсов",
      auditLog: "Журнал аудита",
      slaDashboard: "Панель SLA",
      myQueue: "Моя очередь",
      validationQueue: "Очередь валидации",
      myProfile: "Мой профиль"
    },
    roles: {
      admin: "Администратор",
      reportingRadiologist: "Рентгенолог-описатель",
      validatingRadiologist: "Рентгенолог-валидатор"
    },
    sidebar: {
      activeRole: "Активная роль",
      lightMode: "Светлая тема",
      darkMode: "Тёмная тема"
    },
    common: {
      save: "Сохранить",
      cancel: "Отмена",
      delete: "Удалить",
      edit: "Редактировать",
      add: "Добавить",
      search: "Поиск",
      filter: "Фильтр",
      actions: "Действия",
      status: "Статус",
      date: "Дата",
      time: "Время",
      comments: "Комментарии",
      submit: "Отправить",
      approve: "Утвердить",
      return: "Вернуть",
      download: "Скачать",
      language: "Язык"
    }
  }
}

export function setupI18n() {
  const i18n = createI18n({
    legacy: false,
    locale: savedLanguage,
    fallbackLocale: 'en',
    messages
  })

  return i18n
}
