// Valid review tags that match the backend validation
// These must match exactly with backend/src/middleware/validation/reviews.ts
export const VALID_REVIEW_TAGS = [
  'professional',
  'punctual', 
  'friendly',
  'skilled',
  'clean',
  'affordable',
  'quick',
  'thorough',
  'communicative',
  'reliable',
  'creative',
  'patient',
  'knowledgeable',
  'accommodating',
  'efficient'
] as const;

export type ReviewTag = typeof VALID_REVIEW_TAGS[number];

// Helper function to filter and validate tags
export const validateReviewTags = (tags: string[]): string[] => {
  return tags
    .map(tag => tag.toLowerCase().trim())
    .filter(tag => VALID_REVIEW_TAGS.includes(tag as ReviewTag));
};

/**
 * Map of tag keys to their i18n translation keys.
 * Use with the `t` function from useLanguage() to get translated display names.
 */
const TAG_TRANSLATION_KEYS: Record<string, string> = {
  professional: 'reviewTags.professional',
  punctual: 'reviewTags.punctual',
  friendly: 'reviewTags.friendly',
  skilled: 'reviewTags.skilled',
  clean: 'reviewTags.clean',
  affordable: 'reviewTags.goodValue',
  quick: 'reviewTags.fast',
  thorough: 'reviewTags.attentive',
  communicative: 'reviewTags.communicative',
  reliable: 'reviewTags.reliable',
  creative: 'reviewTags.creative',
  patient: 'reviewTags.patient',
  knowledgeable: 'reviewTags.knowledgeable',
  accommodating: 'reviewTags.experienced',
  efficient: 'reviewTags.recommended',
};

/**
 * Get the translated display name for a review tag.
 * @param tag - the tag identifier (e.g. 'professional')
 * @param t - translation function from useLanguage()
 * @returns translated tag name, or the tag itself as fallback
 */
export const getTagDisplayName = (tag: string, t: (key: string) => string): string => {
  const key = TAG_TRANSLATION_KEYS[tag.toLowerCase()];
  return key ? t(key) : tag;
};

/**
 * Get all review tags as translated display name pairs.
 * @param t - translation function from useLanguage()
 * @returns array of { tag, label } objects
 */
export const getTranslatedReviewTags = (t: (key: string) => string): { tag: ReviewTag; label: string }[] => {
  return VALID_REVIEW_TAGS.map(tag => ({
    tag,
    label: getTagDisplayName(tag, t),
  }));
};
