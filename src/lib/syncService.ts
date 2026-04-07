import { supabase } from '@/integrations/supabase/client';
import { Script } from './types';

function getPendingSyncKey(userId: string) {
  return `scriptcraft_pending_sync_${userId}`;
}

function getScriptsKey(userId: string) {
  return `scriptcraft_scripts_${userId}`;
}

// Local storage helpers (user-scoped)
function getLocalScripts(userId: string): Script[] {
  const data = localStorage.getItem(getScriptsKey(userId));
  return data ? JSON.parse(data) : [];
}

function saveLocalScripts(scripts: Script[], userId: string) {
  localStorage.setItem(getScriptsKey(userId), JSON.stringify(scripts));
}

function markPendingSync(userId: string, scriptId: string) {
  const pending = getPendingSyncIds(userId);
  if (!pending.includes(scriptId)) {
    pending.push(scriptId);
    localStorage.setItem(getPendingSyncKey(userId), JSON.stringify(pending));
  }
}

function removePendingSync(userId: string, scriptId: string) {
  const pending = getPendingSyncIds(userId).filter(id => id !== scriptId);
  localStorage.setItem(getPendingSyncKey(userId), JSON.stringify(pending));
}

export function getPendingSyncIds(userId?: string): string[] {
  if (!userId) return [];
  const data = localStorage.getItem(getPendingSyncKey(userId));
  return data ? JSON.parse(data) : [];
}

// Cloud operations
export async function fetchCloudScripts(userId: string): Promise<Script[]> {
  const { data, error } = await (supabase as any)
    .from('scripts')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;

  return (data || []).map((row: any) => ({
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
  const { error } = await (supabase as any)
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
  const { error } = await (supabase as any)
    .from('scripts')
    .delete()
    .eq('id', scriptId);

  if (error) throw error;
}

// Offline-aware operations
export function saveScriptOfflineAware(script: Script, isOnline: boolean, userId?: string) {
  if (!userId) return;
  // Always save locally under user's key
  const scripts = getLocalScripts(userId);
  const idx = scripts.findIndex(s => s.id === script.id);
  if (idx >= 0) scripts[idx] = script;
  else scripts.unshift(script);
  saveLocalScripts(scripts, userId);

  if (isOnline) {
    saveCloudScript(userId, script).catch(() => {
      markPendingSync(userId, script.id);
    });
  } else {
    markPendingSync(userId, script.id);
  }
}

export function deleteScriptOfflineAware(scriptId: string, isOnline: boolean, userId?: string) {
  if (!userId) return;
  const scripts = getLocalScripts(userId).filter(s => s.id !== scriptId);
  saveLocalScripts(scripts, userId);
  removePendingSync(userId, scriptId);

  if (isOnline) {
    deleteCloudScript(scriptId).catch(() => {});
  }
}

export async function syncPendingScripts(userId: string): Promise<number> {
  const pending = getPendingSyncIds(userId);
  if (pending.length === 0) return 0;

  const scripts = getLocalScripts(userId);
  let synced = 0;

  for (const id of pending) {
    const script = scripts.find(s => s.id === id);
    if (script) {
      try {
        await saveCloudScript(userId, script);
        removePendingSync(userId, id);
        synced++;
      } catch {
        // Will retry next time
      }
    } else {
      removePendingSync(userId, id);
    }
  }

  return synced;
}

export async function mergeCloudAndLocal(userId: string): Promise<Script[]> {
  const local = getLocalScripts(userId);

  try {
    const cloud = await fetchCloudScripts(userId);

    const merged = new Map<string, Script>();

    for (const s of cloud) merged.set(s.id, s);

    for (const s of local) {
      const existing = merged.get(s.id);
      if (!existing || new Date(s.updatedAt) > new Date(existing.updatedAt)) {
        merged.set(s.id, s);
        saveCloudScript(userId, s).catch(() => markPendingSync(userId, s.id));
      }
    }

    const result = Array.from(merged.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    saveLocalScripts(result, userId);
    return result;
  } catch {
    return local;
  }
}
