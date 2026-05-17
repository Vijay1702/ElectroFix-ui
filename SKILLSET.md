# Repair Shop Management System

# Frontend UI Architecture Documentation

---

## 1. Frontend Technology Stack

### Core Technologies

- React.js
- TypeScript
- Vite
- Tailwind CSS

---

## 2. UI Architecture Standards

### IMPORTANT DEVELOPMENT RULES

#### Rule 1

DO NOT hardcode:

- Colors
- API endpoints
- Labels
- Status values
- Sidebar menus

Everything must come from centralized files.

---

#### Rule 2

DO NOT repeat Tailwind classes inside pages.

Create reusable components.

---

#### Rule 3

If same UI is used more than one time:

- Convert into shared reusable component.

---

#### Rule 4

Pages should ONLY:

- Fetch data
- Handle business logic
- Assemble components

Pages should NOT:

- Contain duplicated UI
- Contain duplicated styles

---

#### Rule 5

All text MUST use translation files.

DO NOT hardcode labels.

---

#### Rule 6

All API endpoints MUST come from centralized endpoint mapping files.

DO NOT use:

```ts
axios.get("/api/customer");
```

---

## 3. Recommended Folder Structure

```txt
src/
├── assets/
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── tables/
│   ├── cards/
│   ├── layout/
│   ├── feedback/
│   └── shared/
│
├── pages/
│
├── modules/
│
├── services/
│
├── api/
│
├── theme/
│
├── i18n/
│
├── hooks/
│
├── store/
│
├── constants/
│
├── types/
│
├── utils/
│
├── layouts/
│
├── routes/
│
└── App.tsx
```

---

## 4. Theme Architecture

### Purpose

Centralize all UI design values.

---

### Theme Folder Structure

```txt
src/theme/
├── colors.ts
├── typography.ts
├── shadows.ts
├── spacing.ts
├── radius.ts
└── index.ts
```

---

### colors.ts

```ts
export const colors = {
  primary: {
    main: "#4F46E5",
    light: "#EEF2FF",
    dark: "#3730A3",
  },

  success: {
    main: "#16A34A",
    light: "#DCFCE7",
  },

  warning: {
    main: "#EA580C",
    light: "#FFEDD5",
  },

  danger: {
    main: "#DC2626",
    light: "#FEE2E2",
  },

  gray: {
    50: "#F8FAFC",
    100: "#F1F5F9",
    200: "#E2E8F0",
    700: "#334155",
    900: "#0F172A",
  },
};
```

---

## 5. Tailwind CSS Standards

### IMPORTANT RULE

DO NOT directly use long Tailwind classes repeatedly.

---

### Shared Utility Classes

#### globals.css

```css
.page-title {
  @apply text-2xl font-semibold text-gray-900;
}

.card-container {
  @apply bg-white rounded-2xl shadow-sm border p-6;
}

.input-style {
  @apply h-11 rounded-xl border px-4 outline-none;
}

.primary-button {
  @apply bg-primary text-white rounded-xl px-5 h-11 hover:opacity-90;
}
```

---

## 6. Multi Language Support

### Purpose

Support:

- English
- Tamil
- Hindi
- Malayalam

---

### i18n Folder Structure

```txt
src/i18n/
├── en.json
├── ta.json
├── hi.json
├── ml.json
├── config.ts
└── index.ts
```

---

### IMPORTANT RULE

DO NOT hardcode labels.

**BAD:**

```tsx
<h1>Dashboard</h1>
```

**GOOD:**

```tsx
<h1>{t("dashboard.title")}</h1>
```

---

### en.json Example

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "edit": "Edit",
    "delete": "Delete",
    "search": "Search"
  },

  "sidebar": {
    "dashboard": "Dashboard",
    "customers": "Customers",
    "repairJobs": "Repair Jobs",
    "products": "Products",
    "invoice": "Invoice"
  },

  "dashboard": {
    "title": "Dashboard",
    "todaySales": "Today's Sales",
    "pendingRepairs": "Pending Repairs",
    "completedRepairs": "Completed Repairs"
  }
}
```

---

## 7. API Architecture

### IMPORTANT RULE

DO NOT use API endpoints directly inside:

- Pages
- Components
- Hooks

---

### API Folder Structure

```txt
src/api/
├── endpoints.ts
├── axios.ts
├── customer.api.ts
├── repair.api.ts
├── billing.api.ts
├── product.api.ts
└── auth.api.ts
```

---

### endpoints.ts — Centralized Endpoint Mapping

```ts
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
  },

  CUSTOMER: {
    GET_ALL: "/customers",
    CREATE: "/customers",
    UPDATE: "/customers/:id",
    DELETE: "/customers/:id",
  },

  REPAIR: {
    GET_ALL: "/repairs",
    CREATE: "/repairs",
    UPDATE_STATUS: "/repairs/:id/status",
  },

  PRODUCT: {
    GET_ALL: "/products",
    CREATE: "/products",
  },

  BILLING: {
    CREATE: "/billing",
    GET_ALL: "/billing",
  },
};
```

---

### API Service Example — customer.api.ts

```ts
import { API_ENDPOINTS } from "./endpoints";
import axiosInstance from "./axios";

export const getCustomers = async () => {
  return axiosInstance.get(API_ENDPOINTS.CUSTOMER.GET_ALL);
};
```

---

### IMPORTANT BENEFITS

Using centralized endpoints:

- Easier maintenance
- Cleaner architecture
- Faster API updates
- Better scalability
- Avoid duplicate URLs

---

## 8. Shared Component Architecture

### Purpose

Entire application must use reusable components.

---

### Shared Components Structure

```txt
src/components/
├── ui/
├── forms/
├── tables/
├── cards/
├── layout/
├── feedback/
└── shared/
```

---

### Reusable UI Components

#### Button Component

**Path:** `components/ui/Button.tsx`

**Usage:**

```tsx
<Button variant="primary">Save</Button>
```

---

#### Input Component

**Path:** `components/ui/Input.tsx`

---

#### Select Component

**Path:** `components/ui/Select.tsx`

---

#### Modal Component

**Path:** `components/ui/Modal.tsx`

---

#### Status Badge Component

**Path:** `components/ui/StatusBadge.tsx`

---

### Shared Table Component

**Path:** `components/tables/DataTable.tsx`

**Features:**

- Pagination
- Search
- Sorting
- Responsive
- Empty State
- Loading State

---

### Shared Card Components

**Path:** `components/cards/`

**Components:**

- SummaryCard
- SalesCard
- RepairCard
- ProductCard

---

### Shared Layout Components

**Path:** `components/layout/`

**Components:**

- Sidebar
- Navbar
- AppLayout
- PageHeader
- PageContainer

---

## 9. Sidebar Architecture

### IMPORTANT RULE

Sidebar items must come from config file.

---

### sidebar.config.ts

```ts
export const sidebarMenus = [
  {
    label: "sidebar.dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    label: "sidebar.customers",
    path: "/customers",
    icon: Users,
  },
];
```

---

## 10. State Management

### Recommended

Use: **Zustand**

---

### Store Structure

```txt
src/store/
├── auth.store.ts
├── customer.store.ts
├── repair.store.ts
├── billing.store.ts
└── product.store.ts
```

---

## 11. Form Architecture

### Recommended Libraries

- React Hook Form
- Zod

---

### Form Structure

```txt
components/forms/
├── CustomerForm.tsx
├── ProductForm.tsx
├── RepairJobForm.tsx
└── BillingForm.tsx
```

---

### Validation Example

```ts
const schema = z.object({
  customerName: z.string().min(3),
  phoneNumber: z.string().min(10),
});
```

---

## 12. Status Management Architecture

### IMPORTANT RULE

Status values MUST come from constants.

---

### repair-status.constants.ts

```ts
export const REPAIR_STATUS = {
  RECEIVED: "received",
  UNDER_REPAIR: "under_repair",
  WAITING_PARTS: "waiting_parts",
  DELIVERED: "delivered",
};
```

---

### Status Color Mapping — status-color.mapper.ts

```ts
export const statusColors = {
  received: "bg-blue-100 text-blue-700",
  under_repair: "bg-orange-100 text-orange-700",
  waiting_parts: "bg-yellow-100 text-yellow-700",
  delivered: "bg-green-100 text-green-700",
};
```

---

## 13. Dashboard UI Standards

### Dashboard Layout

```tsx
grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6
```

---

### Summary Cards — Shared Component

**Path:** `components/cards/SummaryCard.tsx`

---

### Dashboard Sections

- Summary Cards
- Recent Repairs
- Recent Sales
- Low Stock Alerts

---

## 14. Customer Management UI

### Features

- Customer listing
- Search
- Filters
- Add customer
- Edit customer
- Customer history

---

### Shared Components Used

- DataTable
- PageHeader
- Modal
- CustomerForm

---

## 15. Repair Job UI

### Features

- Create repair job
- Update repair status
- Device image upload
- Technician assignment
- Repair timeline

---

### Shared Components Used

- RepairJobForm
- StatusBadge
- DataTable
- TimelineCard

---

## 16. Product Management UI

### Features

- Add products
- Edit products
- Stock tracking
- Low stock alert

---

### Shared Components Used

- ProductForm
- ProductCard
- DataTable

---

## 17. Billing UI

### Features

- Generate invoice
- Add products/services
- Payment tracking
- PDF invoice

---

### Shared Components Used

- BillingForm
- SummaryCard
- InvoiceCard

---

## 18. Reports UI

### Features

- Sales reports
- Repair reports
- Inventory reports

---

### Shared Components Used

- ChartCard
- SummaryCard
- FilterBar

---

## 19. Responsive Design Standards

### Mobile First Design

---

### Breakpoints

```txt
sm → Mobile
md → Tablet
lg → Laptop
xl → Desktop
```

---

### Responsive Table Wrapper

```tsx
overflow-x-auto
```

---

### Responsive Grid

```tsx
grid-cols-1 md:grid-cols-2 xl:grid-cols-4
```

---

## 20. Notifications

### Recommended

Use: **Sonner Toast**

---

## 21. Icon Standards

### Recommended

Use: **Lucide React**

---

## 22. Recommended UI Libraries

- shadcn/ui
- TanStack Table
- React Hook Form
- Zustand
- Zod
- Recharts
- Sonner

---

## 23. Recommended Page Structure

```txt
pages/
├── dashboard/
├── customers/
├── repair-jobs/
├── products/
├── billing/
├── payments/
├── reports/
└── settings/
```

---

## 24. Final Frontend Architecture Goal

The application must be:

- Clean architecture
- Reusable
- Component driven
- Multi language ready
- Theme based
- API centralized
- Mobile responsive
- Scalable
- Maintainable
- Professional dashboard standard
- Enterprise ready
