import axios from "axios";
import NProgress from "nprogress";
import { toast } from "sonner";
import { offlineDB } from "./offlineDb";
import "nprogress/nprogress.css";

// Configure NProgress
NProgress.configure({ showSpinner: false, minimum: 0.1 });

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let activeRequests = 0;
let isRedirectingToLogin = false;

function getStoreNameFromUrl(url: string): string | null {
  if (!url) return null;
  const cleanUrl = url.split("?")[0].replace(/^\/api/, "");
  
  if (cleanUrl.includes("/products")) return "products";
  if (cleanUrl.includes("/categories")) return "categories";
  if (cleanUrl.includes("/customers")) return "customers";
  if (cleanUrl.includes("/repair-jobs")) return "repairs";
  if (cleanUrl.includes("/invoices")) return "invoices";
  if (cleanUrl.includes("/payments")) return "payments";
  if (cleanUrl.includes("/attendance")) return "attendance";
  if (cleanUrl.includes("/users")) return "users";
  
  return null;
}

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    if (activeRequests === 0) {
      NProgress.start();
    }
    activeRequests++;

    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    activeRequests--;
    if (activeRequests === 0) {
      NProgress.done();
    }
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    activeRequests--;
    if (activeRequests === 0) {
      NProgress.done();
    }

    // Cache successful GET responses in IndexedDB
    const storeName = getStoreNameFromUrl(response.config.url || "");
    if (storeName && response.config.method === "get" && response.data?.success) {
      const data = response.data.data;
      let itemsToCache: any[] = [];
      
      if (Array.isArray(data)) {
        itemsToCache = data;
      } else if (data && typeof data === "object") {
        const possibleArray = data.items || data.products || data.customers || data.repairs || data.invoices || data.payments || data.attendance || data.users;
        if (Array.isArray(possibleArray)) {
          itemsToCache = possibleArray;
        } else if (typeof data.id !== "undefined") {
          itemsToCache = [data];
        }
      }
      
      if (itemsToCache.length > 0) {
        offlineDB.putMany(storeName, itemsToCache).catch(err => 
          console.warn(`Failed to cache ${storeName} offline:`, err)
        );
      }
    }

    return response;
  },
  async (error) => {
    activeRequests--;
    if (activeRequests === 0) {
      NProgress.done();
    }

    const isLoginRequest = error.config?.url?.includes("/auth/login");
    const isNetworkError = !error.response || error.code === "ERR_NETWORK" || error.message === "Network Error";
    const isOffline = !navigator.onLine || isNetworkError;

    // Handle session expiration (401) when online
    if (error.response?.status === 401 && !isLoginRequest) {
      if (!isRedirectingToLogin) {
        isRedirectingToLogin = true;
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        toast.error("Session expired. Please log in again.");
        setTimeout(() => {
          isRedirectingToLogin = false;
          window.location.href = "/login";
        }, 1500);
      }
      return Promise.reject(error);
    }

    // Handle offline fallback
    if (isOffline && !isLoginRequest && error.config) {
      const url = error.config.url || "";
      const cleanUrl = url.split("?")[0].replace(/^\/api/, "");
      const storeName = getStoreNameFromUrl(url);

      if (storeName) {
        try {
          const method = error.config.method?.toUpperCase() || "GET";

          if (method === "GET") {
            // Handle single item vs list
            const segments = cleanUrl.split("/").filter(Boolean);
            const isSingleItem = segments.length > 1 && isNaN(Number(segments[segments.length - 1])) && 
              !["low-stock", "unread", "summary", "recent-repairs", "recent-sales", "technician-workload"].includes(segments[segments.length - 1]);
            
            if (isSingleItem) {
              const id = segments[segments.length - 1];
              const item = await offlineDB.getById(storeName, id);
              if (item) {
                return {
                  data: { success: true, data: item },
                  status: 200,
                  statusText: "OK",
                  headers: {},
                  config: error.config
                };
              }
            } else {
              // Handle list queries
              const items = await offlineDB.getAll<any>(storeName);
              
              // Handle dashboard endpoints which require computed stats
              if (cleanUrl.includes("/dashboard/summary")) {
                const productsCount = (await offlineDB.getAll("products")).length;
                const customersCount = (await offlineDB.getAll("customers")).length;
                const repairsCount = (await offlineDB.getAll("repairs")).length;
                const invoices = await offlineDB.getAll<any>("invoices");
                const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || inv.total || 0), 0);
                
                return {
                  data: {
                    success: true,
                    data: {
                      totalRevenue,
                      activeRepairs: repairsCount,
                      totalProducts: productsCount,
                      totalCustomers: customersCount
                    }
                  },
                  status: 200,
                  statusText: "OK",
                  headers: {},
                  config: error.config
                };
              }

              // Simple search/filter logic for local lists
              const urlObj = new URL(url, window.location.origin);
              const search = urlObj.searchParams.get("search")?.toLowerCase() || "";
              const categoryId = urlObj.searchParams.get("categoryId") || "";
              
              let filteredItems = items;
              if (search) {
                filteredItems = items.filter((item: any) => {
                  const name = (item.name || item.fullName || item.title || item.jobNumber || item.deviceType || "").toLowerCase();
                  const desc = (item.description || item.problemDescription || item.model || item.phone || "").toLowerCase();
                  return name.includes(search) || desc.includes(search);
                });
              }
              if (categoryId && storeName === "products") {
                filteredItems = filteredItems.filter((item: any) => item.categoryId === categoryId);
              }
              
              const page = parseInt(urlObj.searchParams.get("page") || "1");
              const limit = parseInt(urlObj.searchParams.get("limit") || "10");
              const all = urlObj.searchParams.get("all") === "true";
              
              let paginatedData: any = filteredItems;
              if (!all) {
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                paginatedData = filteredItems.slice(startIndex, endIndex);
              }
              
              return {
                data: {
                  success: true,
                  data: all ? paginatedData : {
                    items: paginatedData,
                    meta: {
                      total: filteredItems.length,
                      page,
                      limit,
                      totalPages: Math.ceil(filteredItems.length / limit)
                    }
                  }
                },
                status: 200,
                statusText: "OK",
                headers: {},
                config: error.config
              };
            }
          } else {
            // POST, PUT, DELETE operations
            const requestData = error.config.data ? JSON.parse(error.config.data) : null;
            let responseData: any = {};

            if (method === "POST") {
              const tempId = `offline_${Date.now()}`;
              const newItem = { 
                ...requestData, 
                id: tempId, 
                createdAt: new Date().toISOString(), 
                updatedAt: new Date().toISOString() 
              };
              
              await offlineDB.put(storeName, newItem);
              responseData = newItem;
              
              await offlineDB.addToSyncQueue({
                method: "POST",
                url: error.config.url,
                data: newItem
              });

              // Stock adjustment when creating invoice offline
              if (storeName === "invoices") {
                const invoiceItems = requestData.items || [];
                for (const item of invoiceItems) {
                  const product = await offlineDB.getById<any>("products", item.productId);
                  if (product) {
                    product.quantity = Math.max(0, (product.quantity || 0) - (item.quantity || 0));
                    await offlineDB.put("products", product);
                  }
                }
              }
            } else if (method === "PUT" || method === "PATCH") {
              const segments = cleanUrl.split("/").filter(Boolean);
              const id = segments[segments.length - 1];
              
              const existingItem = await offlineDB.getById<any>(storeName, id);
              const updatedItem = { 
                ...(existingItem || {}), 
                ...requestData, 
                id, 
                updatedAt: new Date().toISOString() 
              };
              
              await offlineDB.put(storeName, updatedItem);
              responseData = updatedItem;
              
              await offlineDB.addToSyncQueue({
                method,
                url: error.config.url,
                data: updatedItem
              });
            } else if (method === "DELETE") {
              const segments = cleanUrl.split("/").filter(Boolean);
              const id = segments[segments.length - 1];
              
              await offlineDB.delete(storeName, id);
              responseData = { id };
              
              await offlineDB.addToSyncQueue({
                method: "DELETE",
                url: error.config.url,
                data: { id }
              });
            }

            toast.warning("Saved locally. Changes will sync once internet is back.");

            return {
              data: {
                success: true,
                data: responseData
              },
              status: 200,
              statusText: "OK",
              headers: {},
              config: error.config
            };
          }
        } catch (dbErr) {
          console.error("Offline DB operation failed:", dbErr);
        }
      }
    }

    const message = error.response?.data?.message || error.message || "An unexpected error occurred.";
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
