/**
 * What's left once the real Supabase project is wired in — see
 * supabase/seed.sql for the matching catalog data (same ids) and
 * scripts/seed-staff.ts for the matching Auth users. Brands, menu items,
 * stock, orders, and now organizations/locations too all come from live
 * queries (packages/api-client's fetchOrganizations/fetchLocationsForOrg/
 * fetchAllLocations) — this platform is multi-tenant, so a hardcoded
 * single org/location list here would hide every business onboarded
 * after this file was written. Only genuinely static dev-fixture data
 * (the seeded staff accounts) is left.
 */

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
