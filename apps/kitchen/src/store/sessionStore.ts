import { create } from 'zustand';
import { LOCATIONS, STAFF } from '@smartcloudkitchen/mock-data';
import type { Staff } from '@smartcloudkitchen/types';

/**
 * Stands in for real Supabase Auth (phone-OTP for customers, PIN for
 * staff — see the build plan's Auth section). A shared tablet in a real
 * kitchen has one person signed in per shift; this picks a fixture staff
 * row the same way a PIN entry would resolve to a `staff` row.
 */
interface SessionState {
  currentStaffId: string;
  /** Owner-only location picker. null = "every location in the org". */
  selectedLocationId: string | null;
  signIn: (staffId: string) => void;
  selectLocation: (locationId: string | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  currentStaffId: STAFF[0].id,
  selectedLocationId: null,
  signIn: (staffId) => set({ currentStaffId: staffId, selectedLocationId: null }),
  selectLocation: (locationId) => set({ selectedLocationId: locationId }),
}));

export function useCurrentStaff(): Staff {
  const id = useSessionStore((s) => s.currentStaffId);
  return STAFF.find((s) => s.id === id) ?? STAFF[0];
}

/** Every location id the current staff member is allowed to see right now. */
export function useVisibleLocationIds(): string[] {
  const staff = useCurrentStaff();
  const selected = useSessionStore((s) => s.selectedLocationId);
  if (staff.role !== 'owner') return [staff.location_id];
  const orgLocationIds = LOCATIONS.filter((l) => l.org_id === staff.org_id).map((l) => l.id);
  return selected ? [selected] : orgLocationIds;
}

export function canManageMenuAndStock(staff: Staff): boolean {
  return staff.role === 'kitchen_manager' || staff.role === 'owner';
}
