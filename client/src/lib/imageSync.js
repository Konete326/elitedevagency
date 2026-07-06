import { getDatabase } from '../db/database';
import { useAuthStore } from '../store/useAuthStore';

let syncIntervalId = null;
let isSyncing = false;

export const startImageSync = () => {
  if (syncIntervalId) return;

  const runSync = async () => {
    if (isSyncing) return;
    
    const token = useAuthStore.getState().token;
    if (!token) return;

    try {
      isSyncing = true;
      const db = await getDatabase();
      const collections = ['products', 'categories'];
      const apiURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      for (const colName of collections) {
        const docsToSync = await db[colName]
          .find({
            selector: {
              imageSynced: false
            }
          })
          .exec();

        for (const doc of docsToSync) {
          if (!doc.image || doc.image.startsWith('http')) {
            await doc.patch({
              imageSynced: true
            });
            continue;
          }

          try {
            const response = await fetch(`${apiURL}/media/upload`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ image: doc.image })
            });

            const result = await response.json();
            if (response.ok && result.success && result.data?.url) {
              await doc.patch({
                image: result.data.url,
                imageSynced: true,
                isSynced: false,
                updatedAt: new Date().toISOString()
              });
            }
          } catch {
          }
        }
      }
    } catch {
    } finally {
      isSyncing = false;
    }
  };

  runSync();
  syncIntervalId = setInterval(runSync, 10000);
};

export const stopImageSync = () => {
  if (syncIntervalId) {
    clearInterval(syncIntervalId);
    syncIntervalId = null;
  }
};
