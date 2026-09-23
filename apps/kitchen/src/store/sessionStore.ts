import { create } from 'zustand';
import {
  consumeInviteSession,
  errorMessage,
  fetchLocations,
  fetchLocationsForOrg,
  fetchMyStaff,
  setOwnPassword,
  signInStaff,
  signOutStaff,
} from '@smartcloudkitchen/api-client';
import type { Location, Staff } from '@smartcloudkitchen/types';

/**
 * Real Supabase Auth session underneath — see api-client's signInStaff
 * (email+password bridge to the seeded dev accounts) and staff_own_row
 * RLS policy, which is what lets fetchMyStaff read back the signed-in
 * user's own row.
 */
interface SessionState {
  staff: Staff | null;
  loading: boolean;
  error: string | null;
  /**
   * Every location this session needs to display/switch between — an
   * owner's whole org (live query, replaces the old hardcoded mock-data
   * filter), or just a cook/manager's own single location. Loaded once
   * alongside staff rather than re-derived from a static array, so a
   * newly onboarded org's locations actually show up.
   */
  orgLocations: Location[];
  /** Owner-only location picker. null = "every location in the org". */
  selectedLocationId: string | null;
  /** True once an invite deep link's tokens have been exchanged for a session but before the new hire has set their own password. */
  awaitingNewPassword: boolean;

  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  selectLocation: (locationId: string | null) => void;
  beginPasswordSetup: (accessToken: string, refreshToken: string) => Promise<void>;
  completePasswordSetup: (password: string) => Promise<void>;
  /** Owner-only — refetches after createLocation() so a newly added location shows up without a re-login. */
  refreshOrgLocations: () => Promise<void>;
}

async function fetchLocationsForStaff(staff: Staff | null): Promise<Location[]> {
  if (!staff || staff.role === 'platform_admin') return [];
  if (staff.role === 'owner') return fetchLocationsForOrg(staff.org_id);
  return fetchLocations([staff.location_id]);
}

export const useSessionStore = create<SessionState>((set, get) => ({
  staff: null,
  loading: true,
  error: null,
  orgLocations: [],
  selectedLocationId: null,
  awaitingNewPassword: false,

  bootstrap: async () => {
    try {
      const staff = await fetchMyStaff();
      const orgLocations = await fetchLocationsForStaff(staff);
      set({ staff, orgLocations, loading: false });
    } catch (err) {
      set({ loading: false, error: errorMessage(err) });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInStaff(email, password);
      const staff = await fetchMyStaff();
      const orgLocations = await fetchLocationsForStaff(staff);
      set({ staff, orgLocations, loading: false, selectedLocationId: null });
    } catch (err) {
      set({ loading: false, error: errorMessage(err) });
    }
  },

  signOut: async () => {
    await signOutStaff();
    set({ staff: null, orgLocations: [] });
  },

  selectLocation: (locationId) => set({ selectedLocationId: locationId }),

  beginPasswordSetup: async (accessToken, refreshToken) => {
    set({ loading: true, error: null });
    try {
      await consumeInviteSession(accessToken, refreshToken);
      set({ awaitingNewPassword: true, loading: false });
    } catch (err) {
      set({ loading: false, error: errorMessage(err) });
    }
  },

  completePasswordSetup: async (password) => {
    set({ loading: true, error: null });
    try {
      await setOwnPassword(password);
      const staff = await fetchMyStaff();
      const orgLocations = await fetchLocationsForStaff(staff);
      set({ staff, orgLocations, loading: false, awaitingNewPassword: false });
    } catch (err) {
      set({ loading: false, error: errorMessage(err) });
    }
  },

  refreshOrgLocations: async () => {
    const orgLocations = await fetchLocationsForStaff(get().staff);
    set({ orgLocations });
  },
}));

export function useCurrentStaff(): Staff | null {
  return useSessionStore((s) => s.staff);
}

export function useOrgLocations(): Location[] {
  return useSessionStore((s) => s.orgLocations);
}

/** Looks up a location's name from the session's already-loaded orgLocations — replaces the old LOCATIONS.find(...) mock-data lookups. */
export function useLocationName(locationId: string | null | undefined): string {
  const orgLocations = useSessionStore((s) => s.orgLocations);
  if (!locationId) return '';
  return orgLocations.find((l) => l.id === locationId)?.name ?? '';
}

export function useVisibleLocationIds(): string[] {
  const staff = useSessionStore((s) => s.staff);
  const orgLocations = useSessionStore((s) => s.orgLocations);
  const selectedLocationId = useSessionStore((s) => s.selectedLocationId);
  if (!staff) return [];
  if (staff.role === 'platform_admin') return []; // belongs to no org/location
  if (staff.role !== 'owner') return [staff.location_id];
  const orgLocationIds = orgLocations.map((l) => l.id);
  return selectedLocationId ? [selectedLocationId] : orgLocationIds;
}

export function canManageMenuAndStock(staff: Staff | null): boolean {
  return staff?.role === 'kitchen_manager' || staff?.role === 'owner';
}
