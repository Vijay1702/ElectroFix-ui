export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    PROFILE: "/auth/profile",
    REFRESH_TOKEN: "/auth/refresh-token",
  },

  CUSTOMERS: {
    GET_ALL: "/customers",
    GET_BY_ID: "/customers",
    CREATE: "/customers",
    UPDATE: "/customers",
    DELETE: "/customers",
    HISTORY: "/customers/:id/history",
  },

  REPAIRS: {
    GET_ALL: "/repair-jobs",
    CREATE: "/repair-jobs",
    GET_BY_ID: "/repair-jobs",
    UPDATE: "/repair-jobs",
    UPDATE_STATUS: "/repair-jobs/:id/status",
    TIMELINE: "/repair-jobs/:id/timeline",
  },

  PRODUCTS: {
    GET_ALL: "/products",
    CREATE: "/products",
    UPDATE: "/products",
    DELETE: "/products",
    LOW_STOCK: "/products/low-stock",
  },

  CATEGORIES: {
    GET_ALL: "/categories",
    CREATE: "/categories",
    UPDATE: "/categories",
    DELETE: "/categories",
  },

  INVOICES: {
    GET_ALL: "/invoices",
    CREATE: "/invoices",
    GET_BY_ID: "/invoices",
    GENERATE_PDF: "/invoices/:id/pdf",
  },

  PAYMENTS: {
    GET_ALL: "/payments",
    CREATE: "/payments",
    GET_BY_ID: "/payments",
  },

  DASHBOARD: {
    SUMMARY: "/dashboard/summary",
    RECENT_REPAIRS: "/dashboard/recent-repairs",
    RECENT_SALES: "/dashboard/recent-sales",
    LOW_STOCK: "/dashboard/low-stock",
  },

  REPORTS: {
    SALES: "/reports/sales",
    REPAIRS: "/reports/repairs",
    PRODUCTS: "/reports/products",
    PAYMENTS: "/reports/payments",
  },

  SETTINGS: {
    GET_ALL: "/settings",
    UPDATE: "/settings",
  },

  NOTIFICATIONS: {
    GET_ALL: "/notifications",
    MARK_AS_READ: "/notifications/:id/read",
  },
};
