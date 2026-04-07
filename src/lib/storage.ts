import { Script } from './types';

const AUTH_KEY = 'scriptcraft_auth';

function getScriptsKey(userId?: string): string {
  return userId ? `scriptcraft_scripts_${userId}` : 'scriptcraft_scripts';
}

export function getScripts(userId?: string): Script[] {
  const data = localStorage.getItem(getScriptsKey(userId));
  return data ? JSON.parse(data) : [];
}

export function saveScripts(scripts: Script[], userId?: string) {
  localStorage.setItem(getScriptsKey(userId), JSON.stringify(scripts));
}

export function getScript(id: string, userId?: string): Script | undefined {
  return getScripts(userId).find(s => s.id === id);
}

export function saveScript(script: Script, userId?: string) {
  const scripts = getScripts(userId);
  const idx = scripts.findIndex(s => s.id === script.id);
  if (idx >= 0) scripts[idx] = script;
  else scripts.unshift(script);
  saveScripts(scripts, userId);
}

export function deleteScript(id: string, userId?: string) {
  saveScripts(getScripts(userId).filter(s => s.id !== id), userId);
}

export function createScript(title: string, userId?: string): Script {
  const script: Script = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elements: [{ id: crypto.randomUUID(), type: 'scene-heading', content: '' }],
  };
  saveScript(script, userId);
  return script;
}

export function clearUserData() {
  // Clear all scriptcraft keys from localStorage
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('scriptcraft_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
}

export function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function setLoggedIn(value: boolean) {
  localStorage.setItem(AUTH_KEY, value ? 'true' : '');
}
