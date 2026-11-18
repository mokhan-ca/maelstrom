const PREFIX = 'maelstrom:';

export function load(key, fallback, store = globalThis.localStorage) {
  try {
    const raw = store.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value, store = globalThis.localStorage) {
  try {
    store.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
