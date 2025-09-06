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
