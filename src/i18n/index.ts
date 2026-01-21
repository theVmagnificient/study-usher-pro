import { createI18n } from 'vue-i18n'

const savedLanguage = localStorage.getItem('language') || 'ru'

const messages = {
  en: {
    // Navigation
    nav: {
      studyList: "Task List",
      taskTypes: "Task Types",
      userManagement: "User Management",
      workforceCapacity: "Workforce Capacity",
      auditLog: "Audit Log",
      slaDashboard: "SLA Dashboard",
      myQueue: "My Queue",
      validationQueue: "Validation Queue",
      myProfile: "My Profile"
    },

    // Roles
    roles: {
      admin: "Admin",
      reportingRadiologist: "Reporting Radiologist",
      validatingRadiologist: "Validating Radiologist"
    },

    // Sidebar
    sidebar: {
      activeRole: "Active Role",
      lightMode: "Light Mode",
      darkMode: "Dark Mode"
    },

    // Common UI elements
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
      language: "Language",
      loading: "Loading...",
      confirm: "Confirm",
      yes: "Yes",
      no: "No",
      close: "Close",
      optional: "Optional",
      required: "Required",
      unassigned: "Unassigned",
      all: "All",
      toggleTheme: "Toggle theme (Ctrl+D)"
    },

    // Status labels
    status: {
      new: "New",
      assigned: "Assigned",
      inProgress: "In Progress",
      draftReady: "Draft Ready",
      translated: "Translated",
      assignedForValidation: "Assigned for Validation",
      underValidation: "Under Validation",
      returned: "Returned",
      finalized: "Finalized",
      delivered: "Delivered"
    },

    // Urgency labels
    urgency: {
      stat: "STAT",
      urgent: "Urgent",
      routine: "Routine"
    },

    // Modalities
    modality: {
      ct: "CT",
      mri: "MRI",
      xray: "X-Ray",
      us: "US",
      pet: "PET",
      nm: "NM"
    },

    // Body areas
    bodyArea: {
      head: "Head",
      neck: "Neck",
      chest: "Chest",
      abdomen: "Abdomen",
      pelvis: "Pelvis",
      spine: "Spine",
      upperExtremity: "Upper Extremity",
      lowerExtremity: "Lower Extremity",
      wholeBody: "Whole Body"
    },

    // Auth / Login
    auth: {
      title: "Reporting Platform",
      subtitle: "Sign in to access your account",
      email: "Email",
      password: "Password",
      emailPlaceholder: "your.email@example.com",
      passwordPlaceholder: "••••••••",
      signIn: "Sign in",
      signingIn: "Signing in...",
      errorRequired: "Please enter both email and password",
      errorFailed: "Login failed. Please check your credentials.",
      errorUnexpected: "An unexpected error occurred. Please try again."
    },

    // Study List Page
    studyList: {
      title: "Task List",
      subtitle: "{count} tasks",
      searchPlaceholder: "Search by ID, Patient ID, or Client...",
      statusFilter: "Status",
      clientFilter: "Client",
      modalityFilter: "Modality",
      fromDateTime: "From date & time",
      toDateTime: "To date & time",
      clearFilters: "Clear",
      allStatuses: "All Statuses",
      allClients: "All Clients",
      allModalities: "All",

      // Table headers
      headers: {
        studyId: "Study ID",
        patient: "Patient",
        client: "Client",
        modalityArea: "Modality / Area",
        received: "Received",
        status: "Status",
        urgency: "Urgency",
        assignedTo: "Assigned To",
        deadline: "Deadline"
      },

      // Actions
      downloadDicom: "Download DICOM",
      reassign: "Reassign"
    },

    // Study Detail Page
    studyDetail: {
      studyInformation: "Study Information",
      patientId: "Patient ID",
      sexAge: "Sex / Age",
      received: "Received",
      modality: "Modality",
      bodyArea: "Body Area",
      assignedTo: "Assigned To",

      currentReport: "Current Report",
      protocol: "Protocol",
      findings: "Findings",
      impression: "Impression",
      russian: "Russian",
      english: "English",

      noProtocol: "No protocol documented yet",
      noFindings: "No findings documented yet",
      noImpression: "No impression documented yet",

      validatorComments: "Validator Comments",
      commentCount: "{count} comment | {count} comments",

      priorStudies: "Prior Studies",
      available: "{count} available",
      type: "Type",
      date: "Date",
      report: "Report",
      dicom: "DICOM",

      linkedBodyParts: "Linked Body Parts",
      zones: "{count} zones",
      current: "Current",

      history: "History",
      noHistory: "No history available",

      // Reassign dialog
      reassignDialog: {
        title: "Reassign Task",
        description: "Assign or reassign this task to a different radiologist",
        selectRadiologist: "Select Radiologist",
        selectPlaceholder: "Select a radiologist...",
        reportingRadiologists: "Reporting Radiologists",
        validatingRadiologists: "Validating Radiologists",
        comment: "Comment (Optional)",
        commentPlaceholder: "Reason for reassignment...",
        confirm: "Confirm",
        reassigning: "Reassigning..."
      },

      // Prior report dialog
      priorReportDialog: {
        title: "Prior Report",
        subtitle: "{type}"
      }
    },

    // User Management Page
    userManagement: {
      title: "User Management",
      subtitle: "{count} physicians",
      addPhysician: "Add Physician",
      searchPlaceholder: "Search by name or ID...",

      // Table headers
      headers: {
        physician: "Physician",
        role: "Role",
        contact: "Contact",
        modalities: "Modalities",
        workload: "Workload"
      },

      studiesCompleted: "{count} studies completed",
      manageSchedule: "Manage Schedule",
      editPhysician: "Edit Physician",
      deletePhysician: "Delete Physician",

      selectPhysician: "Select a physician to view details",
      defaultSchedule: "Default Schedule",
      manage: "Manage",
      bodyAreas: "Body Areas",
      statisticsByModality: "Statistics by Modality",

      // Edit dialog
      editDialog: {
        titleEdit: "Edit Physician",
        titleAdd: "Add Physician",
        firstName: "First Name",
        firstNamePlaceholder: "John",
        lastName: "Last Name",
        lastNamePlaceholder: "Doe",
        email: "Email",
        emailPlaceholder: "john.doe@example.com",
        phone: "Phone",
        phonePlaceholder: "+1234567890",
        role: "Role",
        create: "Create",
        update: "Update"
      },

      // Delete dialog
      deleteDialog: {
        title: "Delete Physician",
        message: "Are you sure you want to delete this physician? This action cannot be undone.",
        delete: "Delete"
      }
    },

    // Physician Queue Page
    queue: {
      title: "My Queue",
      subtitle: "{count} tasks pending",
      maxWorkload: "Maximum workload reached",
      completeFirst: "Complete a study before starting a new one",

      tabs: {
        toReport: "To Report",
        commented: "Commented",
        completed: "Completed"
      },

      empty: {
        noTasks: "No tasks in queue",
        noTasksDesc: "New tasks will appear here when assigned",
        noCommented: "No commented tasks",
        noCommentedDesc: "Validator feedback on your reports will appear here",
        noCompleted: "No completed tasks",
        noCompletedDesc: "Finalized reports will appear here"
      },

      priors: "{count} prior(s)",
      moreComments: "{count} more comment(s)"
    },

    // Validation Queue Page
    validation: {
      title: "Validation Queue",
      subtitle: "{count} tasks awaiting validation",

      tabs: {
        urgent: "Urgent Queue",
        retrospective: "Retrospective Queue"
      },

      urgentAlert: "Tasks requiring review within 1 hour — prioritize speed while maintaining accuracy",
      retroAlert: "Focus on detailed analysis and accuracy — take time to ensure thorough review",

      sections: {
        inProgress: "In Progress",
        toValidate: "To Validate",
        completed: "Completed"
      },

      empty: {
        urgentInProgress: "No urgent validations in progress",
        urgentToValidate: "No urgent tasks pending validation",
        urgentCompleted: "No urgent validations completed yet",
        retroInProgress: "No retrospective validations in progress",
        retroToValidate: "No retrospective tasks pending validation",
        retroCompleted: "No retrospective validations completed yet"
      }
    },

    // Audit Log Page
    auditLog: {
      title: "Audit Log",
      subtitle: "{count} entries",

      headers: {
        timestamp: "Timestamp",
        studyId: "Study ID",
        action: "Action",
        statusChange: "Status Change",
        user: "User",
        comment: "Comment"
      }
    },

    // SLA Dashboard Page
    sla: {
      title: "SLA / TAT Dashboard",
      subtitle: "Real-time turnaround time monitoring",

      metrics: {
        activeStudies: "Active Studies",
        overdue: "Overdue",
        critical: "Critical (<1h)",
        warning: "Warning (<4h)"
      },

      statusDistribution: "Status Distribution",
      overdueStudies: "Overdue Studies",

      headers: {
        studyId: "Study ID",
        client: "Client",
        status: "Status",
        assignedTo: "Assigned To",
        overdueBy: "Overdue By"
      }
    },

    // Task Types Page
    taskTypes: {
      title: "Task Types",
      subtitle: "{count} task types",
      addTaskType: "Add Task Type",

      headers: {
        client: "Client",
        modality: "Modality",
        bodyArea: "Body Area",
        priors: "Priors",
        expectedTat: "Expected TAT",
        price: "Price",
        payout: "Payout"
      },

      hours: "{count}h",

      dialog: {
        titleEdit: "Edit Task Type",
        titleNew: "New Task Type",
        client: "Client",
        clientPlaceholder: "e.g., City General Hospital",
        modality: "Modality",
        bodyArea: "Body Area",
        includesPriors: "Includes prior studies",
        tat: "TAT (hours)",
        price: "Price ($)",
        payout: "Payout ($)"
      }
    },

    // Workforce Capacity Page
    workforce: {
      title: "Workforce Capacity",
      subtitle: "Monitor radiologist availability and identify staffing gaps",

      metrics: {
        criticalDays: "Critical Days",
        warningDays: "Warning Days",
        goodCoverage: "Good Coverage",
        avgRadiologists: "Avg. Radiologists/Day"
      },

      calendar: {
        sunday: "Sunday",
        monday: "Monday",
        tuesday: "Tuesday",
        wednesday: "Wednesday",
        thursday: "Thursday",
        friday: "Friday",
        saturday: "Saturday",
        sun: "Sun",
        mon: "Mon",
        tue: "Tue",
        wed: "Wed",
        thu: "Thu",
        fri: "Fri",
        sat: "Sat"
      },

      radiologists: "{count} radiologist(s)",
      totalHours: "{count} total hours",
      selectDay: "Select a day",

      status: {
        critical: "Critical - Staffing needed",
        warning: "Warning - Limited coverage",
        good: "Good coverage"
      },

      dayDetails: {
        radiologists: "Radiologists",
        totalHours: "Total Hours",
        workingRadiologists: "Working Radiologists",
        noRadiologists: "No radiologists scheduled",
        modalitiesCovered: "Modalities Covered",
        noCoverage: "No coverage",
        bodyAreasCovered: "Body Areas Covered",
        helpText: "Click on a day in the calendar to see detailed staffing information."
      },

      legend: {
        critical: "Critical (≤1)",
        warning: "Warning (≤2)",
        good: "Good (>2)"
      }
    },

    // Physician Profile Page
    profile: {
      title: "My Profile",
      subtitle: "View your profile and statistics",
      editProfile: "Edit Profile",
      loadingProfile: "Loading profile...",
      noProfile: "No user profile found",
      retry: "Retry",

      contactInformation: "Contact Information",
      fullName: "Full Name",
      email: "Email",
      telegram: "Telegram",

      weekSchedule: "This Week's Schedule",
      manageSchedule: "Manage Schedule",
      off: "Off",

      supportedAreas: "Supported Areas",
      modalities: "Modalities",
      bodyAreas: "Body Areas",

      monthlyPerformance: "Monthly Performance",
      thisMonth: "This Month",
      lastMonth: "Last Month",

      allTimeTotal: "All-Time Total",
      byModality: "By Modality",
      byBodyArea: "By Body Area",

      noData: "No data yet"
    },

    // Reporting Page
    reporting: {
      dicom: "DICOM",
      downloadBodyArea: "Download {area} only",
      downloadAll: "Download all ({count} body parts)",

      comments: "Comments",
      commentCount: "{count} comment(s)",
      clinicalNotes: "Clinical Notes",
      technicalNotes: "Technical Notes",

      currentReport: "Current Report",
      englishTranslation: "English Translation",
      manualTranslation: "Manual translation",
      priorReport: "Prior Report",

      protocol: "Study Protocol",
      protocolPlaceholder: "Describe the imaging technique and protocol used...",
      protocolEn: "Study Protocol (EN)",
      protocolEnNote: "— Manual translation required",
      protocolEnPlaceholder: "Manually translate the study protocol to English...",
      protocolNotAvailable: "Protocol not available for this prior study",

      findings: "Findings",
      findingsPlaceholder: "Document all imaging findings in detail...",
      findingsEn: "Findings (EN)",
      findingsEnPlaceholder: "Manually translate the findings to English...",
      findingsNotAvailable: "No findings available for this prior study",

      impression: "Impression",
      impressionPlaceholder: "Provide a summary interpretation and recommendations...",
      impressionEn: "Impression (EN)",
      impressionEnPlaceholder: "Manually translate the impression to English...",
      impressionNotAvailable: "No impression available for this prior study",

      addValidatorComment: "Add Validator Comment",
      validatorCommentNote: "Optional feedback for the reporting radiologist",
      validatorCommentPlaceholder: "Leave a comment about the report quality, suggestions for improvement, or positive feedback...",

      saveDraft: "Save Draft",
      submitForValidation: "Submit for Validation",
      returnForRevision: "Return for Revision",
      finalizeReport: "Finalize Report",

      finalizedNote: "This report is finalized and cannot be edited",
      notAutoSaved: "Changes are not auto-saved",

      linkedBodyParts: "Linked Body Parts",
      zones: "{count} zones",
      current: "Current",

      translation: "Translation",
      englishVersion: "English Version",
      manualTranslationRequired: "Manual translation required",
      viewing: "Viewing",

      priorStudies: "Prior Studies",

      patientSummary: "Patient Summary",
      demographics: "Demographics",
      sex: "Sex:",
      male: "Male",
      female: "Female",
      age: "Age:",
      years: "years",

      currentStudy: "Current Study",
      type: "Type:",
      client: "Client:",
      clinicalHistory: "Clinical History",
      priorImaging: "Prior Imaging ({count})",
      keyPoints: "Key Points",

      submitDialog: {
        title: "Submit for Validation",
        description: "Submit this report for validation. An admin will assign a validator to review your work.",
        warning: "You will not be able to edit the report after it has been finalized by the validator. Please verify you have addressed all relevant body areas and prior studies before submitting.",
        confirmSubmission: "Confirm Submission"
      }
    }
  },
  ru: {
    // Навигация
    nav: {
      studyList: "Список задач",
      taskTypes: "Типы задач",
      userManagement: "Управление пользователями",
      workforceCapacity: "Планирование ресурсов",
      auditLog: "Журнал аудита",
      slaDashboard: "Панель SLA",
      myQueue: "Моя очередь",
      validationQueue: "Очередь валидации",
      myProfile: "Мой профиль"
    },

    // Роли
    roles: {
      admin: "Администратор",
      reportingRadiologist: "Рентгенолог-описатель",
      validatingRadiologist: "Рентгенолог-валидатор"
    },

    // Боковая панель
    sidebar: {
      activeRole: "Активная роль",
      lightMode: "Светлая тема",
      darkMode: "Тёмная тема"
    },

    // Общие элементы интерфейса
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
      language: "Язык",
      loading: "Загрузка...",
      confirm: "Подтвердить",
      yes: "Да",
      no: "Нет",
      close: "Закрыть",
      optional: "Необязательно",
      required: "Обязательно",
      unassigned: "Не назначено",
      all: "Все",
      toggleTheme: "Переключить тему (Ctrl+D)"
    },

    // Статусы
    status: {
      new: "Новое",
      assigned: "Назначено",
      inProgress: "В работе",
      draftReady: "Черновик готов",
      translated: "Переведено",
      assignedForValidation: "Назначено на валидацию",
      underValidation: "На валидации",
      returned: "Возвращено",
      finalized: "Завершено",
      delivered: "Отправлено"
    },

    // Срочность
    urgency: {
      stat: "STAT",
      urgent: "Срочно",
      routine: "Плановое"
    },

    // Модальности
    modality: {
      ct: "КТ",
      mri: "МРТ",
      xray: "Рентген",
      us: "УЗИ",
      pet: "ПЭТ",
      nm: "ЯМ"
    },

    // Области тела
    bodyArea: {
      head: "Голова",
      neck: "Шея",
      chest: "Грудная клетка",
      abdomen: "Брюшная полость",
      pelvis: "Таз",
      spine: "Позвоночник",
      upperExtremity: "Верхняя конечность",
      lowerExtremity: "Нижняя конечность",
      wholeBody: "Все тело"
    },

    // Авторизация / Вход
    auth: {
      title: "Платформа отчетности",
      subtitle: "Войдите, чтобы получить доступ к аккаунту",
      email: "Email",
      password: "Пароль",
      emailPlaceholder: "your.email@example.com",
      passwordPlaceholder: "••••••••",
      signIn: "Войти",
      signingIn: "Вход...",
      errorRequired: "Пожалуйста, введите email и пароль",
      errorFailed: "Ошибка входа. Проверьте учетные данные.",
      errorUnexpected: "Произошла непредвиденная ошибка. Попробуйте еще раз."
    },

    // Страница списка задач
    studyList: {
      title: "Список задач",
      subtitle: "{count} задач | {count} задача | {count} задачи",
      searchPlaceholder: "Поиск по ID, ID пациента или клиенту...",
      statusFilter: "Статус",
      clientFilter: "Клиент",
      modalityFilter: "Модальность",
      fromDateTime: "Дата и время от",
      toDateTime: "Дата и время до",
      clearFilters: "Очистить",
      allStatuses: "Все статусы",
      allClients: "Все клиенты",
      allModalities: "Все",

      // Заголовки таблицы
      headers: {
        studyId: "ID исследования",
        patient: "Пациент",
        client: "Клиент",
        modalityArea: "Модальность / Область",
        received: "Получено",
        status: "Статус",
        urgency: "Срочность",
        assignedTo: "Назначено",
        deadline: "Срок"
      },

      // Действия
      downloadDicom: "Скачать DICOM",
      reassign: "Переназначить"
    },

    // Страница детализации задачи
    studyDetail: {
      studyInformation: "Информация об исследовании",
      patientId: "ID пациента",
      sexAge: "Пол / Возраст",
      received: "Получено",
      modality: "Модальность",
      bodyArea: "Область тела",
      assignedTo: "Назначено",

      currentReport: "Текущий отчет",
      protocol: "Протокол",
      findings: "Находки",
      impression: "Заключение",
      russian: "Русский",
      english: "Английский",

      noProtocol: "Протокол еще не задокументирован",
      noFindings: "Находки еще не задокументированы",
      noImpression: "Заключение еще не задокументировано",

      validatorComments: "Комментарии валидатора",
      commentCount: "{count} комментарий | {count} комментария | {count} комментариев",

      priorStudies: "Предыдущие исследования",
      available: "{count} доступно",
      type: "Тип",
      date: "Дата",
      report: "Отчет",
      dicom: "DICOM",

      linkedBodyParts: "Связанные области тела",
      zones: "{count} зон | {count} зона | {count} зоны",
      current: "Текущее",

      history: "История",
      noHistory: "История недоступна",

      // Диалог переназначения
      reassignDialog: {
        title: "Переназначить задачу",
        description: "Назначить или переназначить задачу другому рентгенологу",
        selectRadiologist: "Выберите рентгенолога",
        selectPlaceholder: "Выберите рентгенолога...",
        reportingRadiologists: "Рентгенологи-описатели",
        validatingRadiologists: "Рентгенологи-валидаторы",
        comment: "Комментарий (необязательно)",
        commentPlaceholder: "Причина переназначения...",
        confirm: "Подтвердить",
        reassigning: "Переназначение..."
      },

      // Диалог предыдущего отчета
      priorReportDialog: {
        title: "Предыдущий отчет",
        subtitle: "{type}"
      }
    },

    // Страница управления пользователями
    userManagement: {
      title: "Управление пользователями",
      subtitle: "{count} врачей | {count} врач | {count} врача",
      addPhysician: "Добавить врача",
      searchPlaceholder: "Поиск по имени или ID...",

      // Заголовки таблицы
      headers: {
        physician: "Врач",
        role: "Роль",
        contact: "Контакты",
        modalities: "Модальности",
        workload: "Загрузка"
      },

      studiesCompleted: "{count} исследований завершено",
      manageSchedule: "Управление расписанием",
      editPhysician: "Редактировать врача",
      deletePhysician: "Удалить врача",

      selectPhysician: "Выберите врача для просмотра деталей",
      defaultSchedule: "Стандартное расписание",
      manage: "Управлять",
      bodyAreas: "Области тела",
      statisticsByModality: "Статистика по модальностям",

      // Диалог редактирования
      editDialog: {
        titleEdit: "Редактировать врача",
        titleAdd: "Добавить врача",
        firstName: "Имя",
        firstNamePlaceholder: "Иван",
        lastName: "Фамилия",
        lastNamePlaceholder: "Иванов",
        email: "Email",
        emailPlaceholder: "ivan.ivanov@example.com",
        phone: "Телефон",
        phonePlaceholder: "+79123456789",
        role: "Роль",
        create: "Создать",
        update: "Обновить"
      },

      // Диалог удаления
      deleteDialog: {
        title: "Удалить врача",
        message: "Вы уверены, что хотите удалить этого врача? Это действие нельзя отменить.",
        delete: "Удалить"
      }
    },

    // Страница очереди врача
    queue: {
      title: "Моя очередь",
      subtitle: "{count} задач ожидает | {count} задача ожидает | {count} задачи ожидают",
      maxWorkload: "Достигнута максимальная загрузка",
      completeFirst: "Завершите исследование перед началом нового",

      tabs: {
        toReport: "На описание",
        commented: "С комментариями",
        completed: "Завершенные"
      },

      empty: {
        noTasks: "Нет задач в очереди",
        noTasksDesc: "Новые задачи появятся здесь при назначении",
        noCommented: "Нет задач с комментариями",
        noCommentedDesc: "Здесь появятся отзывы валидаторов о ваших отчетах",
        noCompleted: "Нет завершенных задач",
        noCompletedDesc: "Здесь появятся завершенные отчеты"
      },

      priors: "{count} предыдущих",
      moreComments: "еще {count} комментарий | еще {count} комментария | еще {count} комментариев"
    },

    // Страница очереди валидации
    validation: {
      title: "Очередь валидации",
      subtitle: "{count} задач ожидают валидации | {count} задача ожидает валидации | {count} задачи ожидают валидации",

      tabs: {
        urgent: "Срочная очередь",
        retrospective: "Ретроспективная очередь"
      },

      urgentAlert: "Задачи, требующие проверки в течение 1 часа — приоритет скорости при сохранении точности",
      retroAlert: "Фокус на детальном анализе и точности — уделите время тщательной проверке",

      sections: {
        inProgress: "В работе",
        toValidate: "На валидацию",
        completed: "Завершенные"
      },

      empty: {
        urgentInProgress: "Нет срочных валидаций в работе",
        urgentToValidate: "Нет срочных задач на валидацию",
        urgentCompleted: "Нет завершенных срочных валидаций",
        retroInProgress: "Нет ретроспективных валидаций в работе",
        retroToValidate: "Нет ретроспективных задач на валидацию",
        retroCompleted: "Нет завершенных ретроспективных валидаций"
      }
    },

    // Страница журнала аудита
    auditLog: {
      title: "Журнал аудита",
      subtitle: "{count} записей | {count} запись | {count} записи",

      headers: {
        timestamp: "Время",
        studyId: "ID исследования",
        action: "Действие",
        statusChange: "Изменение статуса",
        user: "Пользователь",
        comment: "Комментарий"
      }
    },

    // Страница панели SLA
    sla: {
      title: "Панель SLA / TAT",
      subtitle: "Мониторинг времени обработки в реальном времени",

      metrics: {
        activeStudies: "Активные исследования",
        overdue: "Просрочено",
        critical: "Критичные (<1ч)",
        warning: "Предупреждение (<4ч)"
      },

      statusDistribution: "Распределение по статусам",
      overdueStudies: "Просроченные исследования",

      headers: {
        studyId: "ID исследования",
        client: "Клиент",
        status: "Статус",
        assignedTo: "Назначено",
        overdueBy: "Просрочено на"
      }
    },

    // Страница типов задач
    taskTypes: {
      title: "Типы задач",
      subtitle: "{count} типов задач | {count} тип задач | {count} типа задач",
      addTaskType: "Добавить тип задачи",

      headers: {
        client: "Клиент",
        modality: "Модальность",
        bodyArea: "Область тела",
        priors: "Предыдущие",
        expectedTat: "Ожидаемый TAT",
        price: "Цена",
        payout: "Выплата"
      },

      hours: "{count}ч",

      dialog: {
        titleEdit: "Редактировать тип задачи",
        titleNew: "Новый тип задачи",
        client: "Клиент",
        clientPlaceholder: "напр., Городская больница",
        modality: "Модальность",
        bodyArea: "Область тела",
        includesPriors: "Включает предыдущие исследования",
        tat: "TAT (часы)",
        price: "Цена ($)",
        payout: "Выплата ($)"
      }
    },

    // Страница планирования ресурсов
    workforce: {
      title: "Планирование ресурсов",
      subtitle: "Мониторинг доступности рентгенологов и выявление нехватки персонала",

      metrics: {
        criticalDays: "Критичные дни",
        warningDays: "Дни с предупреждением",
        goodCoverage: "Хорошее покрытие",
        avgRadiologists: "Сред. рентгенологов/день"
      },

      calendar: {
        sunday: "Воскресенье",
        monday: "Понедельник",
        tuesday: "Вторник",
        wednesday: "Среда",
        thursday: "Четверг",
        friday: "Пятница",
        saturday: "Суббота",
        sun: "Вс",
        mon: "Пн",
        tue: "Вт",
        wed: "Ср",
        thu: "Чт",
        fri: "Пт",
        sat: "Сб"
      },

      radiologists: "{count} рентгенолог | {count} рентгенолога | {count} рентгенологов",
      totalHours: "{count} всего часов",
      selectDay: "Выберите день",

      status: {
        critical: "Критично - требуется персонал",
        warning: "Предупреждение - ограниченное покрытие",
        good: "Хорошее покрытие"
      },

      dayDetails: {
        radiologists: "Рентгенологи",
        totalHours: "Всего часов",
        workingRadiologists: "Работающие рентгенологи",
        noRadiologists: "Нет запланированных рентгенологов",
        modalitiesCovered: "Покрытые модальности",
        noCoverage: "Нет покрытия",
        bodyAreasCovered: "Покрытые области тела",
        helpText: "Нажмите на день в календаре, чтобы увидеть детальную информацию о персонале."
      },

      legend: {
        critical: "Критично (≤1)",
        warning: "Предупреждение (≤2)",
        good: "Хорошо (>2)"
      }
    },

    // Страница профиля врача
    profile: {
      title: "Мой профиль",
      subtitle: "Просмотр профиля и статистики",
      editProfile: "Редактировать профиль",
      loadingProfile: "Загрузка профиля...",
      noProfile: "Профиль пользователя не найден",
      retry: "Повторить",

      contactInformation: "Контактная информация",
      fullName: "Полное имя",
      email: "Email",
      telegram: "Telegram",

      weekSchedule: "Расписание на эту неделю",
      manageSchedule: "Управление расписанием",
      off: "Выходной",

      supportedAreas: "Поддерживаемые области",
      modalities: "Модальности",
      bodyAreas: "Области тела",

      monthlyPerformance: "Результаты за месяц",
      thisMonth: "Этот месяц",
      lastMonth: "Прошлый месяц",

      allTimeTotal: "Всего за все время",
      byModality: "По модальностям",
      byBodyArea: "По областям тела",

      noData: "Пока нет данных"
    },

    // Страница редактора отчетов
    reporting: {
      dicom: "DICOM",
      downloadBodyArea: "Скачать только {area}",
      downloadAll: "Скачать все ({count} частей тела)",

      comments: "Комментарии",
      commentCount: "{count} комментарий | {count} комментария | {count} комментариев",
      clinicalNotes: "Клинические заметки",
      technicalNotes: "Технические заметки",

      currentReport: "Текущий отчет",
      englishTranslation: "Перевод на английский",
      manualTranslation: "Ручной перевод",
      priorReport: "Предыдущий отчет",

      protocol: "Протокол исследования",
      protocolPlaceholder: "Опишите методику визуализации и используемый протокол...",
      protocolEn: "Протокол исследования (EN)",
      protocolEnNote: "— Требуется ручной перевод",
      protocolEnPlaceholder: "Переведите вручную протокол исследования на английский...",
      protocolNotAvailable: "Протокол недоступен для этого предыдущего исследования",

      findings: "Находки",
      findingsPlaceholder: "Задокументируйте все находки визуализации подробно...",
      findingsEn: "Находки (EN)",
      findingsEnPlaceholder: "Переведите вручную находки на английский...",
      findingsNotAvailable: "Находки недоступны для этого предыдущего исследования",

      impression: "Заключение",
      impressionPlaceholder: "Предоставьте краткую интерпретацию и рекомендации...",
      impressionEn: "Заключение (EN)",
      impressionEnPlaceholder: "Переведите вручную заключение на английский...",
      impressionNotAvailable: "Заключение недоступно для этого предыдущего исследования",

      addValidatorComment: "Добавить комментарий валидатора",
      validatorCommentNote: "Необязательный отзыв для рентгенолога-описателя",
      validatorCommentPlaceholder: "Оставьте комментарий о качестве отчета, предложения по улучшению или положительный отзыв...",

      saveDraft: "Сохранить черновик",
      submitForValidation: "Отправить на валидацию",
      returnForRevision: "Вернуть на доработку",
      finalizeReport: "Завершить отчет",

      finalizedNote: "Этот отчет завершен и не может быть отредактирован",
      notAutoSaved: "Изменения не сохраняются автоматически",

      linkedBodyParts: "Связанные области тела",
      zones: "{count} зон | {count} зона | {count} зоны",
      current: "Текущее",

      translation: "Перевод",
      englishVersion: "Английская версия",
      manualTranslationRequired: "Требуется ручной перевод",
      viewing: "Просмотр",

      priorStudies: "Предыдущие исследования",

      patientSummary: "Сводка о пациенте",
      demographics: "Демография",
      sex: "Пол:",
      male: "Мужской",
      female: "Женский",
      age: "Возраст:",
      years: "лет",

      currentStudy: "Текущее исследование",
      type: "Тип:",
      client: "Клиент:",
      clinicalHistory: "Клиническая история",
      priorImaging: "Предыдущие визуализации ({count})",
      keyPoints: "Ключевые моменты",

      submitDialog: {
        title: "Отправить на валидацию",
        description: "Отправить этот отчет на валидацию. Администратор назначит валидатора для проверки вашей работы.",
        warning: "Вы не сможете редактировать отчет после его завершения валидатором. Пожалуйста, убедитесь, что вы учли все соответствующие области тела и предыдущие исследования перед отправкой.",
        confirmSubmission: "Подтвердить отправку"
      }
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
