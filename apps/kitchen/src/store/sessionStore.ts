import { create } from 'zustand';
import { fetchMyStaff, signInStaff, signOutStaff } from '@smartcloudkitchen/api-client';
import { LOCATIONS } from '@smartcloudkitchen/mock-data';
import type { Staff } from '@smartcloudkitchen/types';

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
  /** Owner-only location picker. null = "every location in the org". */
  selectedLocationId: string | null;

  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  selectLocation: (locationId: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  staff: null,
  loading: true,
  error: null,
  selectedLocationId: null,

  bootstrap: async () => {
    try {
      const staff = await fetchMyStaff();
      set({ staff, loading: false });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInStaff(email, password);
      const staff = await fetchMyStaff();
      set({ staff, loading: false, selectedLocationId: null });
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : String(err) });
    }
  },

  signOut: async () => {
    await signOutStaff();
    set({ staff: null });
  },

  selectLocation: (locationId) => set({ selectedLocationId: locationId }),
}));

export function useCurrentStaff(): Staff | null {
  return useSessionStore((s) => s.staff);
}

export function useVisibleLocationIds(): string[] {
  const staff = useSessionStore((s) => s.staff);
  const selectedLocationId = useSessionStore((s) => s.selectedLocationId);
  if (!staff) return [];
  if (staff.role !== 'owner') return [staff.location_id];
  const orgLocationIds = LOCATIONS.filter((l) => l.org_id === staff.org_id).map((l) => l.id);
  return selectedLocationId ? [selectedLocationId] : orgLocationIds;
}

export function canManageMenuAndStock(staff: Staff | null): boolean {
  return staff?.role === 'kitchen_manager' || staff?.role === 'owner';
}
