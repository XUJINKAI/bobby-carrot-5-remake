export interface CatalogStore<Key, Value> {
  load(key: Key, loader: () => Promise<Value>): Promise<Value>;
}

type CatalogEntry<Value> =
  | { status: "loading"; promise: Promise<Value> }
  | { status: "ready"; value: Value };

export function createCatalogStore<Key, Value>(): CatalogStore<Key, Value> {
  const entries = new Map<Key, CatalogEntry<Value>>();

  return {
    async load(key: Key, loader: () => Promise<Value>): Promise<Value> {
      const cached = entries.get(key);
      if (cached?.status === "ready") return cached.value;
      if (cached?.status === "loading") return cached.promise;

      const promise = loader();
      entries.set(key, { status: "loading", promise });

      try {
        const value = await promise;
        const current = entries.get(key);
        if (current?.status === "loading" && current.promise === promise) {
          entries.set(key, { status: "ready", value });
        }
        return value;
      } catch (error) {
        const current = entries.get(key);
        if (current?.status === "loading" && current.promise === promise) {
          entries.delete(key);
        }
        throw error;
      }
    },
  };
}
