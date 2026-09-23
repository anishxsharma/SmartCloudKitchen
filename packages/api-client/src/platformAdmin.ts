import { getSupabase } from './client';
import type { Organization } from '@smartcloudkitchen/types';

export interface OnboardOrganizationInput {
  orgName: string;
  locationName: string;
  timezone?: string;
  ownerEmail: string;
  ownerDisplayName: string;
}

/** Runs server-side via the onboard-organization Edge Function, which re-checks the caller is platform_admin itself — see invite-staff's own comment for why this isn't a plain client insert. */
export async function onboardOrganization(input: OnboardOrganizationInput): Promise<void> {
  const { error } = await getSupabase().functions.invoke('onboard-organization', { body: input });
  if (error) throw error;
}

/** platform_admin only — RLS (platform_admin_all_organizations) returns nothing for anyone else. */
export async function fetchOrganizations(): Promise<Organization[]> {
  const { data, error } = await getSupabase().from('organizations').select('*').order('name');
  if (error) throw error;
  return data ?? [];
}
