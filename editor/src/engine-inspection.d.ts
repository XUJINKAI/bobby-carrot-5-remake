import '@bobby/engine';
declare module '@bobby/engine' {
  interface TileDefinitionInspection {
    /** DAT provenance is supplied by @bobby/dat at UI boundaries, never by Engine gameplay definitions. */
    source?: { datHexIds?: string[]; confidence: 'confirmed' | 'inferred' };
  }
}
