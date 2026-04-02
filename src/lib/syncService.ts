import { supabase } from '@/integrations/supabase/client';
import { Script } from './types';

const PENDING_SYNC_KEY = 'scriptcraft_pending_sync';
const SCRIPTS_KEY = 'scriptcraft_scripts';

// Local storage helpers
function getLocalScripts(): Script[] {
  const data = localStorage.getItem(SCRIPTS_KEY);
  return data ? JSON.parse(data) : [];
}

function saveLocalScripts(scripts: Script[]) {
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

function markPendingSync(scriptId: string) {
  const pending = getPendingSyncIds();
  if (!pending.includes(scriptId)) {
    pending.push(scriptId);
    localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
  }
}

function removePendingSync(scriptId: string) {
  const pending = getPendingSyncIds().filter(id => id !== scriptId);
  localStorage.setItem(PENDING_SYNC_KEY, JSON.stringify(pending));
}

export function getPendingSyncIds(): string[] {
  const data = localStorage.getItem(PENDING_SYNC_KEY);
  return data ? JSON.parse(data) : [];
}

// Cloud operations
export async function fetchCloudScripts(userId: string): Promise<Script[]> {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    authorName: row.author_name || undefined,
    contactInfo: row.contact_info || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    elements: row.elements as any,
  }));
}

export async function saveCloudScript(userId: string, script: Script) {
  const { error } = await supabase
    .from('scripts')
    .upsert({
      id: script.id,
      user_id: userId,
      title: script.title,
      author_name: script.authorName || null,
      contact_info: script.contactInfo || null,
      elements: script.elements as any,
      updated_at: script.updatedAt,
      created_at: script.createdAt,
    }, { onConflict: 'id' });

  if (error) throw error;
}

export async function deleteCloudScript(scriptId: string) {
  const { error } = await supabase
    .from('scripts')
    .delete()
    .eq('id', scriptId);

  if (error) throw error;
}

// Offline-aware operations
export function saveScriptOfflineAware(script: Script, isOnline: boolean, userId?: string) {
  // Always save locally
  const scripts = getLocalScripts();
  const idx = scripts.findIndex(s => s.id === script.id);
  if (idx >= 0) scripts[idx] = script;
  else scripts.unshift(script);
  saveLocalScripts(scripts);

  if (isOnline && userId) {
    saveCloudScript(userId, script).catch(() => {
      markPendingSync(script.id);
    });
  } else {
    markPendingSync(script.id);
  }
}

export function deleteScriptOfflineAware(scriptId: string, isOnline: boolean) {
  const scripts = getLocalScripts().filter(s => s.id !== scriptId);
  saveLocalScripts(scripts);
  removePendingSync(scriptId);

  if (isOnline) {
    deleteCloudScript(scriptId).catch(() => {});
  }
}

export async function syncPendingScripts(userId: string): Promise<number> {
  const pending = getPendingSyncIds();
  if (pending.length === 0) return 0;

  const scripts = getLocalScripts();
  let synced = 0;

  for (const id of pending) {
    const script = scripts.find(s => s.id === id);
    if (script) {
      try {
        await saveCloudScript(userId, script);
        removePendingSync(id);
        synced++;
      } catch {
        // Will retry next time
      }
    } else {
      removePendingSync(id);
    }
  }

  return synced;
}

export async function mergeCloudAndLocal(userId: string): Promise<Script[]> {
  const local = getLocalScripts();

  try {
    const cloud = await fetchCloudScripts(userId);

    // Merge: cloud wins if newer, local wins if newer
    const merged = new Map<string, Script>();

    for (const s of cloud) merged.set(s.id, s);

    for (const s of local) {
      const existing = merged.get(s.id);
      if (!existing || new Date(s.updatedAt) > new Date(existing.updatedAt)) {
        merged.set(s.id, s);
        // Push local-newer to cloud
        saveCloudScript(userId, s).catch(() => markPendingSync(s.id));
      }
    }

    const result = Array.from(merged.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    saveLocalScripts(result);
    return result;
  } catch {
    // Offline - return local
    return local;
  }
}
