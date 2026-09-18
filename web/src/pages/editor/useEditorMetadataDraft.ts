import type { MapMeta } from "@bobby/model";
import { onBeforeUnmount, reactive, watch } from "vue";

export interface EditorMetadataValue {
  name: string;
  author?: string;
  note?: string;
}

export const EDITOR_METADATA_DEBOUNCE_MS = 200;

export function useEditorMetadataDraft(options: {
  source: () => Readonly<MapMeta>;
  apply: (value: EditorMetadataValue) => void;
  enabled?: () => boolean;
}) {
  const metadata = reactive({ name: "", author: "", note: "" });
  let timer: ReturnType<typeof setTimeout> | null = null;

  watch(
    options.source,
    (source) => {
      const next = metadataValue(source);
      if (sameMetadata(next, metadataValue(metadata))) return;
      cancelPending();
      metadata.name = next.name;
      metadata.author = next.author ?? "";
      metadata.note = next.note ?? "";
    },
    { immediate: true, deep: true },
  );

  watch(
    metadata,
    () => {
      if (options.enabled && !options.enabled()) return;
      if (sameMetadata(metadataValue(metadata), metadataValue(options.source())))
        return;
      if (timer !== null) clearTimeout(timer);
      timer = setTimeout(flush, EDITOR_METADATA_DEBOUNCE_MS);
    },
    { deep: true },
  );

  function flush(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    if (options.enabled && !options.enabled()) return;
    const next = metadataValue(metadata);
    if (sameMetadata(next, metadataValue(options.source()))) return;
    options.apply(next);
  }

  function cancelPending(): void {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  }

  onBeforeUnmount(flush);

  return { metadata, flushMetadata: flush };
}

export function metadataValue(source: {
  name: string;
  author?: string;
  note?: string;
}): EditorMetadataValue {
  return {
    name: source.name,
    ...(source.author ? { author: source.author } : {}),
    ...(source.note ? { note: source.note } : {}),
  };
}

function sameMetadata(
  left: EditorMetadataValue,
  right: EditorMetadataValue,
): boolean {
  return (
    left.name === right.name &&
    left.author === right.author &&
    left.note === right.note
  );
}
