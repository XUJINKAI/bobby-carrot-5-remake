import type { Locale } from "@bobby/i18n";

export interface SeoLocalizedText {
  readonly "zh-CN": string;
  readonly en: string;
}

export interface SeoDescriptor {
  readonly title: SeoLocalizedText;
  readonly description: SeoLocalizedText;
  readonly canonicalPath: string;
  readonly index: boolean;
}

export interface ResolvedSeoDescriptor {
  readonly title: string;
  readonly description: string;
  readonly canonicalPath: string;
  readonly index: boolean;
}

export interface AdventureChapterSeoInput {
  readonly id: string;
  readonly name: string;
  readonly description?: string | undefined;
}

export interface CollectionSeoInput {
  readonly id: string;
  readonly name: string;
  readonly description?: string | undefined;
}

export interface ExploreMapSeoInput {
  readonly id: string;
  readonly name?: string | undefined;
  readonly author?: string | undefined;
  readonly description?: string | undefined;
  readonly imported?: boolean | undefined;
}

export const ADVENTURE_SPECIAL_SCENES: Readonly<
  Record<string, Readonly<{ path: string; name: string }>>
>;

export function staticSeoDescriptor(path: string): SeoDescriptor | null;
export function adventureSceneSeoDescriptor(
  path: string,
  name: string,
): SeoDescriptor;
export function adventureLevelSeoDescriptor(
  path: string,
  id: string,
): SeoDescriptor;
export function adventureChapterSeoDescriptor(
  path: string,
  chapter?: AdventureChapterSeoInput,
): SeoDescriptor;
export function collectionSeoDescriptor(
  canonicalPath: string,
  collection?: CollectionSeoInput,
): SeoDescriptor;
export function exploreMapSeoDescriptor(
  path: string,
  map: ExploreMapSeoInput,
): SeoDescriptor;
export function notFoundSeoDescriptor(path: string): SeoDescriptor;
export function localizedSeoDescriptor(
  value: SeoDescriptor,
  locale: Locale,
): ResolvedSeoDescriptor;
export function bilingualSeoDescriptor(
  value: SeoDescriptor,
): ResolvedSeoDescriptor;
