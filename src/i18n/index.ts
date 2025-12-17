import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const savedLanguage = localStorage.getItem('language') || 'en';

const resources = {
  en: {
    translation: {
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
    }
  },
  ru: {
    translation: {
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
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
