/**
 * Production localization — English + Arabic.
 * No duplicated business logic; resources only.
 */

export type Locale = "en" | "ar";
export type Dir = "ltr" | "rtl";

export const LOCALE_DIR: Record<Locale, Dir> = {
  en: "ltr",
  ar: "rtl",
};

const en = {
  appName: "Kodikz Survey",
  surveyAssigned: "Survey Assigned",
  surveyStarted: "Survey Started",
  surveyPaused: "Survey Paused",
  surveyResumed: "Survey Resumed",
  surveyCompleted: "Survey Completed",
  surveyCancelled: "Survey Cancelled",
  wrongDirection: "Wrong Direction",
  offRoute: "Off Route",
  gpsLost: "GPS Lost",
  roadBlockage: "Road Blockage",
  emergency: "Emergency",
  idleTimeout: "Idle Timeout",
  pause: "Pause",
  resume: "Resume",
  cancel: "Cancel",
  complete: "Complete",
  approveDiversion: "Approve Diversion",
  rejectDiversion: "Reject Diversion",
  sendMessage: "Send Message",
  requestReturn: "Request Return",
  reportBlockage: "Report Road Blockage",
  takePhoto: "Take Photo",
  chooseGallery: "Choose from Gallery",
  upload: "Upload",
  retry: "Retry",
  delete: "Delete",
  onRoute: "On Route",
  returning: "Returning",
  paused: "Paused",
  completed: "Completed",
  acknowledge: "Acknowledge",
  supervisorCommand: "Supervisor Command",
  syncOnline: "Online",
  syncOffline: "Offline",
  syncPending: "Pending sync",
  fieldPilot: "Field Pilot Diagnostics",
  voiceStatus: "Voice",
  socketHealth: "Socket",
  gpsQuality: "GPS Quality",
  apiLatency: "API Latency",
  currentAssignment: "Current Assignment",
  categories: {
    STREET_MAPPING: "Street Mapping",
    AREA_SURVEY: "Area Survey",
    REVISIT: "Revisit",
    OTHER: "Other",
  },
  blockageReasons: {
    ROAD_CLOSED: "Road Closed",
    CONSTRUCTION: "Construction",
    POLICE: "Police",
    ACCIDENT: "Accident",
    UNSAFE: "Unsafe",
    FLOOD: "Flood",
    OTHER: "Other",
  },
  voice: {
    LEAVING_ROUTE: "Leaving assigned route",
    WRONG_DIRECTION: "Wrong direction",
    RETURN_TO_ROUTE: "Return to route",
    BACK_ON_ROUTE: "Back on route",
    STREET_MISSED: "Street missed",
    SURVEY_COMPLETE: "Survey complete",
    BLOCKAGE_RECORDED: "Blockage recorded",
  },
  nav: {
    dashboard: "Dashboard",
    liveMonitoring: "Live Monitoring",
    vehicles: "Vehicles",
    permits: "Permits",
    geoUpload: "Geo Upload",
    settings: "Settings",
    systemHealth: "System Health",
    surveyCopilot: "Survey Copilot",
    commandCenter: "Command Center",
    routeManagement: "Route Management",
    areaManagement: "Area Management",
    violations: "Violations",
    analytics: "Analytics",
    reports: "Reports",
  },
  chrome: {
    phase1: "Phase 1",
    phase2: "Phase 2",
    dubaiMunicipality: "Dubai Municipality",
    gpsConnected: "GPS Connected",
    gpsReconnecting: "GPS Reconnecting",
    gpsDisconnected: "GPS Disconnected",
    gpsLive: "LIVE",
    gpsUnavailable: "GPS backend unavailable — showing master data only",
    reconnectingGps: "Reconnecting to GPS backend…",
  },
} as const;

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};

export type MessageTree = DeepStringify<typeof en>;

const ar: MessageTree = {
  appName: "كوديكز للمسح",
  surveyAssigned: "تم تعيين المسح",
  surveyStarted: "بدأ المسح",
  surveyPaused: "تم إيقاف المسح مؤقتاً",
  surveyResumed: "تم استئناف المسح",
  surveyCompleted: "اكتمل المسح",
  surveyCancelled: "تم إلغاء المسح",
  wrongDirection: "اتجاه خاطئ",
  offRoute: "خارج المسار",
  gpsLost: "فقدان إشارة GPS",
  roadBlockage: "عائق على الطريق",
  emergency: "طوارئ",
  idleTimeout: "انتهاء مهلة التوقف",
  pause: "إيقاف مؤقت",
  resume: "استئناف",
  cancel: "إلغاء",
  complete: "إكمال",
  approveDiversion: "الموافقة على التحويل",
  rejectDiversion: "رفض التحويل",
  sendMessage: "إرسال رسالة",
  requestReturn: "طلب العودة",
  reportBlockage: "الإبلاغ عن عائق",
  takePhoto: "التقاط صورة",
  chooseGallery: "اختيار من المعرض",
  upload: "رفع",
  retry: "إعادة المحاولة",
  delete: "حذف",
  onRoute: "على المسار",
  returning: "العودة",
  paused: "موقوف",
  completed: "مكتمل",
  acknowledge: "تأكيد الاستلام",
  supervisorCommand: "أمر المشرف",
  syncOnline: "متصل",
  syncOffline: "غير متصل",
  syncPending: "مزامنة معلقة",
  fieldPilot: "تشخيصات التجريب الميداني",
  voiceStatus: "الصوت",
  socketHealth: "الاتصال",
  gpsQuality: "جودة GPS",
  apiLatency: "زمن الاستجابة",
  currentAssignment: "التعيين الحالي",
  categories: {
    STREET_MAPPING: "رسم الشوارع",
    AREA_SURVEY: "مسح المنطقة",
    REVISIT: "إعادة زيارة",
    OTHER: "أخرى",
  },
  blockageReasons: {
    ROAD_CLOSED: "طريق مغلق",
    CONSTRUCTION: "أعمال إنشائية",
    POLICE: "شرطة",
    ACCIDENT: "حادث",
    UNSAFE: "غير آمن",
    FLOOD: "فيضان",
    OTHER: "أخرى",
  },
  voice: {
    LEAVING_ROUTE: "مغادرة المسار المعين",
    WRONG_DIRECTION: "اتجاه خاطئ",
    RETURN_TO_ROUTE: "عد إلى المسار",
    BACK_ON_ROUTE: "عدت إلى المسار",
    STREET_MISSED: "شارع فائت",
    SURVEY_COMPLETE: "اكتمل المسح",
    BLOCKAGE_RECORDED: "تم تسجيل العائق",
  },
  nav: {
    dashboard: "لوحة التحكم",
    liveMonitoring: "المراقبة المباشرة",
    vehicles: "المركبات",
    permits: "التصاريح",
    geoUpload: "رفع GIS",
    settings: "الإعدادات",
    systemHealth: "صحة النظام",
    surveyCopilot: "مساعد المسح",
    commandCenter: "مركز القيادة",
    routeManagement: "إدارة المسارات",
    areaManagement: "إدارة المناطق",
    violations: "المخالفات",
    analytics: "التحليلات",
    reports: "التقارير",
  },
  chrome: {
    phase1: "المرحلة 1",
    phase2: "المرحلة 2",
    dubaiMunicipality: "بلدية دبي",
    gpsConnected: "GPS متصل",
    gpsReconnecting: "GPS إعادة اتصال",
    gpsDisconnected: "GPS غير متصل",
    gpsLive: "مباشر",
    gpsUnavailable: "خادم GPS غير متاح — عرض البيانات الأساسية فقط",
    reconnectingGps: "إعادة الاتصال بخادم GPS…",
  },
};

export const messages: Record<Locale, MessageTree> = {
  en: en as MessageTree,
  ar,
};

export function getMessages(locale: Locale): MessageTree {
  return messages[locale] ?? messages.en;
}

export function t(
  locale: Locale,
  key: keyof Omit<MessageTree, "categories" | "blockageReasons" | "voice">
): string {
  return String(getMessages(locale)[key] ?? key);
}

export function applyDocumentLocale(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALE_DIR[locale];
}
