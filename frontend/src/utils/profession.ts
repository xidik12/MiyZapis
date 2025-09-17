import { TFunction } from '@/contexts/LanguageContext';

// Map common slugs/labels to translation keys
const PROFESSION_MAP: Record<string, string> = {
  'barber': 'profession.barber',
  'nail-technician': 'profession.nailTechnician',
  'nail technician': 'profession.nailTechnician',
  'event-planner': 'profession.eventPlanner',
  'event planner': 'profession.eventPlanner',
  'driver': 'profession.driver',
  'chauffeur': 'profession.driver',
  'florist': 'profession.florist',
  'electrician': 'profession.electrician',
  'lawyer': 'profession.lawyer',
};

export function translateProfession(label: string | undefined | null, t: TFunction): string {
  if (!label) return '';
  const norm = String(label).trim().toLowerCase();
  const key = PROFESSION_MAP[norm];
  if (key) {
    return t(key) || label;
  }
  // Try replacing underscores/hyphens
  const hyphen = norm.replace(/_/g, '-');
  const key2 = PROFESSION_MAP[hyphen];
  if (key2) return t(key2) || label;
  return label;
}

