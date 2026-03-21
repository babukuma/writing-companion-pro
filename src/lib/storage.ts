import { Script } from './types';

const SCRIPTS_KEY = 'scriptcraft_scripts';
const AUTH_KEY = 'scriptcraft_auth';

export function getScripts(): Script[] {
  const data = localStorage.getItem(SCRIPTS_KEY);
  return data ? JSON.parse(data) : [];
}

export function saveScripts(scripts: Script[]) {
  localStorage.setItem(SCRIPTS_KEY, JSON.stringify(scripts));
}

export function getScript(id: string): Script | undefined {
  return getScripts().find(s => s.id === id);
}

export function saveScript(script: Script) {
  const scripts = getScripts();
  const idx = scripts.findIndex(s => s.id === script.id);
  if (idx >= 0) scripts[idx] = script;
  else scripts.unshift(script);
  saveScripts(scripts);
}

export function deleteScript(id: string) {
  saveScripts(getScripts().filter(s => s.id !== id));
}

export function createScript(title: string): Script {
  const script: Script = {
    id: crypto.randomUUID(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elements: [{ id: crypto.randomUUID(), type: 'scene-heading', content: '' }],
  };
  saveScript(script);
  return script;
}

export function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function setLoggedIn(value: boolean) {
  localStorage.setItem(AUTH_KEY, value ? 'true' : '');
}
