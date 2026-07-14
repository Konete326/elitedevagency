import { replicateRxCollection } from 'rxdb/plugins/replication';
import { useAuthStore } from '../store/useAuthStore';
import { toast } from 'sonner';

let activeReplications = {};

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
        return {
          documents: result.data.documents,
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
  replicationState.active$.subscribe((active) => {
    if (active) {
      toastId = toast.loading(`Syncing ${collectionName}...`, { id: toastId || undefined });
    } else {
      if (toastId) {
        toast.success(`${collectionName} sync complete`, { id: toastId });
        toastId = null;
      }
    }
  });

  replicationState.error$.subscribe((err) => {
    if (toastId) {
      toast.error(`${collectionName} sync error: ${err.message || err}`, { id: toastId });
      toastId = null;
    } else {
      toast.error(`${collectionName} sync error: ${err.message || err}`);
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
