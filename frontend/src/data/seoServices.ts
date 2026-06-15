/**
 * Programmatic SEO service definitions (combined).
 * Split across two source files to keep each maintainable; the landing page
 * imports the merged SERVICES array. Each entry drives /services/<slug> and
 * /services/<slug>/<citySlug>.
 */

import type { SeoService } from './seo.types';
import { SERVICES_A } from './seoServicesA';
import { SERVICES_B } from './seoServicesB';

export const SERVICES: SeoService[] = [...SERVICES_A, ...SERVICES_B];

export default SERVICES;
