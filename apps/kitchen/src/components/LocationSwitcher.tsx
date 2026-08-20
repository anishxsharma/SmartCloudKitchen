import { ScrollView, Pressable, StyleSheet, Text } from 'react-native';
import { LOCATIONS } from '@smartcloudkitchen/mock-data';
import { kitchen, type } from '@smartcloudkitchen/design-tokens';
import { useCurrentStaff, useSessionStore } from '../store/sessionStore';

/** Only rendered for owners — line cooks and managers belong to one kitchen. */
export function LocationSwitcher() {
  const staff = useCurrentStaff();
  const selected = useSessionStore((s) => s.selectedLocationId);
  const selectLocation = useSessionStore((s) => s.selectLocation);
  if (staff?.role !== 'owner') return null;

  const orgLocations = LOCATIONS.filter((l) => l.org_id === staff.org_id);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.wrap}>
      <Chip label="All locations" active={selected === null} onPress={() => selectLocation(null)} />
      {orgLocations.map((loc) => (
        <Chip key={loc.id} label={loc.name} active={selected === loc.id} onPress={() => selectLocation(loc.id)} />
      ))}
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? '#2A2419' : kitchen.surface, borderColor: active ? '#5B4A22' : kitchen.borderSoft }]}
    >
      <Text style={[styles.chipLabel, { color: active ? kitchen.accent : kitchen.textSoft }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, gap: 8 },
  chip: { height: 36, paddingHorizontal: 13, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 12 },
});
