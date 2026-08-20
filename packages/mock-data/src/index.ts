import type { Location, Organization } from '@smartcloudkitchen/types';

/**
 * What's left once the real Supabase project is wired in — see
 * supabase/seed.sql for the matching catalog data (same ids) and
 * scripts/seed-staff.ts for the matching Auth users. Brands, menu items,
 * stock, and orders all come from live queries now (packages/api-client);
 * this file only keeps the handful of ids/labels that are genuinely
 * static reference data, not content a manager could change.
 */

export const ORG: Organization = { id: '11111111-0000-0000-0000-000000000001', name: 'SmartCloudKitchen' };

export const LOCATIONS: Location[] = [
  { id: '11111111-0000-0000-0000-000000000010', org_id: ORG.id, name: 'HSR Kitchen 04', timezone: 'Asia/Kolkata' },
  { id: '11111111-0000-0000-0000-000000000020', org_id: ORG.id, name: 'Indiranagar Kitchen 02', timezone: 'Asia/Kolkata' },
];

/**
 * Which kitchen serves a given customer app session — resolved from their
 * delivery address in the real app (see the build plan's address model);
 * fixed here since there's no real address flow yet.
 */
export const CUSTOMER_LOCATION_ID = LOCATIONS[0].id;

/**
 * Dev-only bridge to real Supabase Auth sessions on the seeded staff
 * accounts (scripts/seed-staff.ts) — stands in for PIN entry until that's
 * built (see the build plan's Auth section). Not a real credential store;
 * these accounts only exist on the dev project.
 */
export const DEV_STAFF_CREDENTIALS = [
  { email: 'ravi@staff.smartcloudkitchen.dev', display_name: 'Ravi K.', role: 'line_cook' as const },
  { email: 'ayesha@staff.smartcloudkitchen.dev', display_name: 'Ayesha N.', role: 'kitchen_manager' as const },
  { email: 'deepak@staff.smartcloudkitchen.dev', display_name: 'Deepak S.', role: 'line_cook' as const },
  { email: 'meera@staff.smartcloudkitchen.dev', display_name: 'Meera R.', role: 'owner' as const },
];
export const DEV_STAFF_PASSWORD = 'sck-dev-staff-2026';
