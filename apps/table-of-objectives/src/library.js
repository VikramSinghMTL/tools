// Every table lives in this browser's localStorage, one key per table, so two tabs editing
// different tables never overwrite each other.
const TABLE_PREFIX = 'table-of-objectives:table:';
const CURRENT_KEY = 'table-of-objectives:current';
// Before v2 the app kept a single auto-saved table under this key.
const LEGACY_KEY = 'table-of-objectives';
const VERIFY_MODE_KEY = 'table-of-objectives:verify-mode';
const ACCEPTED_VERBS_KEY = 'table-of-objectives:accepted-verbs';
// Also read by the inline script in index.html.
const THEME_KEY = 'table-of-objectives:theme';

export function createTable(content = {}) {
  return {
    id: crypto.randomUUID(),
    title: content.title ?? '',
    description: content.description ?? '',
    glos: content.glos ?? [],
    // Keys of Verify notes the user has dismissed (see verify.js).
    dismissed: content.dismissed ?? [],
    updatedAt: Date.now(),
  };
}

export const isEmptyTable = (table) => !table.title && !table.description && table.glos.length === 0;

export const isTableKey = (key) => key?.startsWith(TABLE_PREFIX) || key === CURRENT_KEY;

// Parses a backup file: { title, description, glos }, or a bare array of GLOs from before v2.
export function parseBackup(json) {
  const data = JSON.parse(json);

  if (Array.isArray(data)) {
    return { title: '', description: '', glos: data };
  }

  if (!data || !Array.isArray(data.glos)) {
    throw new Error('this is not a Table of Objectives backup file.');
  }

  return {
    title: String(data.title ?? ''),
    description: String(data.description ?? ''),
    glos: data.glos,
    dismissed: Array.isArray(data.dismissed) ? data.dismissed.filter((key) => typeof key === 'string') : [],
  };
}

export function toBackup(table) {
  return JSON.stringify(
    { title: table.title, description: table.description, glos: table.glos, dismissed: table.dismissed ?? [] },
    null,
    2
  );
}

export function readTables() {
  const tables = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key.startsWith(TABLE_PREFIX)) continue;

    try {
      const table = JSON.parse(localStorage.getItem(key));
      table.dismissed ??= [];
      tables.push(table);
    } catch {
      // Leave an unreadable entry in place rather than deleting someone's data.
    }
  }

  return tables;
}

export function readCurrentId() {
  return localStorage.getItem(CURRENT_KEY);
}

export function writeCurrentId(id) {
  localStorage.setItem(CURRENT_KEY, id);
}

// Tables nobody has typed into are not kept.
export function writeTable(table) {
  if (isEmptyTable(table)) {
    localStorage.removeItem(TABLE_PREFIX + table.id);
  } else {
    localStorage.setItem(TABLE_PREFIX + table.id, JSON.stringify(table));
  }
}

export function deleteTable(id) {
  localStorage.removeItem(TABLE_PREFIX + id);
}

// Moves the pre-v2 single auto-saved table into the library, once.
export function migrateLegacyTable() {
  const legacy = localStorage.getItem(LEGACY_KEY);
  if (legacy === null) return;

  try {
    const table = createTable(parseBackup(legacy));
    writeTable(table);
    writeCurrentId(table.id);
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // Unreadable: leave it where it is.
  }
}

export function readVerifyMode() {
  return localStorage.getItem(VERIFY_MODE_KEY) === 'on';
}

export function writeVerifyMode(on) {
  localStorage.setItem(VERIFY_MODE_KEY, on ? 'on' : 'off');
}

// Words the user has told Verify to treat as verbs. Shared by every table in this browser.
export function readAcceptedVerbs() {
  try {
    const verbs = JSON.parse(localStorage.getItem(ACCEPTED_VERBS_KEY));
    return Array.isArray(verbs) ? verbs : [];
  } catch {
    return [];
  }
}

export function writeAcceptedVerbs(verbs) {
  localStorage.setItem(ACCEPTED_VERBS_KEY, JSON.stringify(verbs));
}

// 'light' | 'dark' when the user picked one; null means follow the system setting.
export function readTheme() {
  const theme = localStorage.getItem(THEME_KEY);
  return theme === 'light' || theme === 'dark' ? theme : null;
}

export function writeTheme(theme) {
  if (theme) localStorage.setItem(THEME_KEY, theme);
  else localStorage.removeItem(THEME_KEY);
}
