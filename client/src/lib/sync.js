import { replicateRxCollection } from 'rxdb/plugins/replication';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

let activeReplications = {};
let syncStatus = {};
let syncErrors = {};
let debounceTimeout = null;
let unifiedToastId = null;

const checkAllSyncComplete = () => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  
  debounceTimeout = setTimeout(() => {
    const collectionNames = Object.keys(syncStatus);
    if (collectionNames.length === 0) return;
    
    const isAnySyncing = collectionNames.some(name => syncStatus[name] === 'syncing');
    
    const now = Date.now();
    const lastSuccess = localStorage.getItem('last_sync_success_time');
    const isWithinHour = lastSuccess && (now - Number(lastSuccess) < 3600000);

    if (isAnySyncing) {
      if (!unifiedToastId && !isWithinHour) {
        unifiedToastId = toast.loading("Syncing business data...", { id: 'unified-sync-toast' });
      }
      return;
    }
    
    const errors = [];
    collectionNames.forEach(name => {
      if (syncStatus[name] === 'error' && syncErrors[name]) {
        errors.push(syncErrors[name]);
      }
    });
    
    if (errors.length > 0) {
      toast.error(`Sync complete. (Warning: ${errors.join(', ')})`, { id: 'unified-sync-toast' });
    } else {
      if (!isWithinHour) {
        toast.success("Sync complete! All business data is up to date.", { id: 'unified-sync-toast' });
        localStorage.setItem('last_sync_success_time', String(now));
      } else {
        toast.dismiss('unified-sync-toast');
      }
    }
    unifiedToastId = null;
  }, 1500);
};

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

  syncStatus[collectionName] = 'idle';

  replicationState.active$.subscribe((active) => {
    if (active) {
      syncStatus[collectionName] = 'syncing';
      delete syncErrors[collectionName];
    } else {
      if (syncStatus[collectionName] !== 'error') {
        syncStatus[collectionName] = 'idle';
      }
    }
    checkAllSyncComplete();
  });

  replicationState.error$.subscribe((err) => {
    syncStatus[collectionName] = 'error';
    const cleanMsg = err.message || err.toString() || 'connection timed out';
    const displayName = collectionName.charAt(0).toUpperCase() + collectionName.slice(1);
    syncErrors[collectionName] = `${displayName} ${cleanMsg.includes('timeout') || cleanMsg.includes('timed out') ? 'connection timed out' : cleanMsg}`;
    checkAllSyncComplete();
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
