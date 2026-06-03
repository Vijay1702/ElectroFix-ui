import { offlineDB } from "@/api/offlineDb";
import axiosInstance from "@/api/axios";

export const syncService = {
  isSyncing: false,

  async getPendingCount(): Promise<number> {
    const queue = await offlineDB.getSyncQueue();
    return queue.length;
  },

  async sync(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
    if (this.isSyncing) return { success: false, syncedCount: 0, error: "Sync already in progress" };
    if (!navigator.onLine) return { success: false, syncedCount: 0, error: "Network offline" };

    const queue = await offlineDB.getSyncQueue();
    if (queue.length === 0) return { success: true, syncedCount: 0 };

    this.isSyncing = true;
    let syncedCount = 0;
    
    // ID mapping to map temporary client-side IDs (offline_*) to real server database IDs
    const idMap = new Map<string, string>();

    // Sort the queue so dependencies are created first:
    // Customers -> Categories -> Products -> Repairs -> Invoices -> Payments -> Attendance
    const getPriority = (url: string) => {
      const cleanUrl = url.split("?")[0].replace(/^\/api/, "");
      if (cleanUrl.includes("/customers")) return 1;
      if (cleanUrl.includes("/categories")) return 2;
      if (cleanUrl.includes("/products")) return 3;
      if (cleanUrl.includes("/repair-jobs")) return 4;
      if (cleanUrl.includes("/invoices")) return 5;
      if (cleanUrl.includes("/payments")) return 6;
      if (cleanUrl.includes("/attendance")) return 7;
      return 10;
    };

    const sortedQueue = [...queue].sort((a, b) => getPriority(a.url) - getPriority(b.url));

    try {
      for (const item of sortedQueue) {
        // Prepare the payload, mapping any offline temporary IDs to real ones
        let payload = { ...item.data };
        
        // Map customerId if it exists and is in the map
        if (payload.customerId && idMap.has(payload.customerId)) {
          payload.customerId = idMap.get(payload.customerId);
        }
        // Map productId if it exists and is in the map
        if (payload.productId && idMap.has(payload.productId)) {
          payload.productId = idMap.get(payload.productId);
        }
        // Map repairJobId if it exists and is in the map
        if (payload.repairJobId && idMap.has(payload.repairJobId)) {
          payload.repairJobId = idMap.get(payload.repairJobId);
        }
        // Map invoiceId if it exists and is in the map
        if (payload.invoiceId && idMap.has(payload.invoiceId)) {
          payload.invoiceId = idMap.get(payload.invoiceId);
        }

        // For arrays of items (like invoice items), map their IDs
        if (Array.isArray(payload.items)) {
          payload.items = payload.items.map((i: any) => {
            const newItem = { ...i };
            if (newItem.productId && idMap.has(newItem.productId)) {
              newItem.productId = idMap.get(newItem.productId);
            }
            return newItem;
          });
        }

        // Remove client-side temporary IDs and metadata before posting to server
        const originalId = payload.id;
        const isOfflineId = typeof originalId === "string" && originalId.startsWith("offline_");
        if (isOfflineId) {
          delete payload.id;
          delete payload.createdAt;
          delete payload.updatedAt;
        }

        // Execute the server request
        let response;
        const storeName = getStoreNameFromUrl(item.url);

        if (item.method === "POST") {
          response = await axiosInstance.post(item.url, payload);
          
          if (response.data?.success && isOfflineId && storeName) {
            const serverItem = response.data.data;
            idMap.set(originalId, serverItem.id);

            // Update local database: delete temp and store server record
            await offlineDB.delete(storeName, originalId);
            await offlineDB.put(storeName, serverItem);
          }
        } else if (item.method === "PUT" || item.method === "PATCH") {
          // If the ID in the URL is a temporary offline ID, replace it with the mapped real ID
          let syncUrl = item.url;
          if (isOfflineId && idMap.has(originalId)) {
            const realId = idMap.get(originalId);
            syncUrl = syncUrl.replace(originalId, realId!);
            payload.id = realId;
          }

          response = await axiosInstance.put(syncUrl, payload);
          if (response.data?.success && storeName) {
            await offlineDB.put(storeName, response.data.data);
          }
        } else if (item.method === "DELETE") {
          let syncUrl = item.url;
          if (isOfflineId && idMap.has(originalId)) {
            const realId = idMap.get(originalId);
            syncUrl = syncUrl.replace(originalId, realId!);
          }
          response = await axiosInstance.delete(syncUrl);
        }

        // Remove from offline queue
        if (item.id) {
          await offlineDB.deleteFromSyncQueue(item.id);
        }
        syncedCount++;
      }

      return { success: true, syncedCount };
    } catch (err: any) {
      console.error("Synchronization failed at item:", err);
      return { 
        success: false, 
        syncedCount, 
        error: err.response?.data?.message || err.message || "Failed to sync some items" 
      };
    } finally {
      this.isSyncing = false;
    }
  }
};

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
