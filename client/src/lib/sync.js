import { replicateRxCollection } from 'rxdb/plugins/replication';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

let activeReplications = {};
const lastSyncToastTime = new Map();

export const startReplication = async (db, collectionName) => {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  if (activeReplications[collectionName]) {
    activeReplications[collectionName].cancel();
  }

  const collection = db[collectionName];
  if (!collection) return null;

  const apiURL = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000/api`;

  const replicationState = replicateRxCollection({
    collection,
    replicationIdentifier: `http-replication-${collectionName}`,
    push: {
      handler: async (changeRows) => {
        const response = await fetch(`${apiURL}/sync/push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ collection: collectionName, changeRows })
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Push failed');
        }
        return result.data;
      },
      batchSize: 50
    },
    pull: {
      handler: async (lastCheckpoint, batchSize) => {
        const checkpointStr = lastCheckpoint ? encodeURIComponent(JSON.stringify(lastCheckpoint)) : '';
        const response = await fetch(
          `${apiURL}/sync/pull?collection=${collectionName}&checkpoint=${checkpointStr}&limit=${batchSize}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Pull failed');
        }
        const allowedProperties = collection.schema.jsonSchema.properties;
        const sanitizedDocs = (result.data.documents || []).map((doc) => {
          const sanitized = {};
          for (const key in doc) {
            if (allowedProperties[key] !== undefined) {
              sanitized[key] = doc[key];
            }
          }
          return sanitized;
        });
        return {
          documents: sanitizedDocs,
          checkpoint: result.data.checkpoint
        };
      },
      batchSize: 50
    },
    live: true,
    retryTime: 5000,
    conflictHandler: async (input) => {
      const realTime = new Date(input.realMasterState.updatedAt).getTime();
      const newTime = new Date(input.newDocumentState.updatedAt).getTime();
      
      if (realTime > newTime) {
        return {
          resolvedDocumentState: input.realMasterState
        };
      }
      return {
        resolvedDocumentState: input.newDocumentState
      };
    }
  });

  let toastId = null;
  let isFirstSync = true;

  replicationState.active$.subscribe((active) => {
    if (active) {
      if (isFirstSync) {
        const msg = `Syncing ${collectionName}...`;
        const now = Date.now();
        const lastTime = lastSyncToastTime.get(msg);
        if (!lastTime || now - lastTime >= 300000) {
          lastSyncToastTime.set(msg, now);
          toastId = toast.loading(msg);
        }
      }
    } else {
      if (isFirstSync) {
        isFirstSync = false;
        const successMsg = `${collectionName} sync complete`;
        const now = Date.now();
        const lastTime = lastSyncToastTime.get(successMsg);
        if (toastId) {
          toast.success(successMsg, { id: toastId });
          lastSyncToastTime.set(successMsg, now);
          toastId = null;
        } else if (!lastTime || now - lastTime >= 300000) {
          toast.success(successMsg);
          lastSyncToastTime.set(successMsg, now);
        }
      }
    }
  });

  replicationState.error$.subscribe((err) => {
    const errorMsg = `${collectionName} sync error: ${err.message || err}`;
    const now = Date.now();
    const lastTime = lastSyncToastTime.get(errorMsg);
    if (!lastTime || now - lastTime >= 300000) {
      lastSyncToastTime.set(errorMsg, now);
      if (toastId) {
        toast.error(errorMsg, { id: toastId });
        toastId = null;
      } else {
        toast.error(errorMsg);
      }
    } else if (toastId) {
      toast.dismiss(toastId);
      toastId = null;
    }
  });

  activeReplications[collectionName] = replicationState;
  return replicationState;
};

export const stopAllReplications = () => {
  Object.keys(activeReplications).forEach((key) => {
    activeReplications[key].cancel();
    delete activeReplications[key];
  });
};
