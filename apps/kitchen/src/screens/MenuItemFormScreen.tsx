import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createMenuItem, errorMessage, updateMenuItem, uploadMenuItemPhoto } from '@smartcloudkitchen/api-client';
import type { Station } from '@smartcloudkitchen/types';
import { kitchen, minTapTarget, type } from '@smartcloudkitchen/design-tokens';
import { useKitchenStore } from '../store/kitchenStore';

const STATIONS: Station[] = ['WOK', 'GRILL', 'FRY', 'OVEN'];

export function MenuItemFormScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const editingId: string | undefined = route.params?.itemId;

  const items = useKitchenStore((s) => s.items);
  const itemCosts = useKitchenStore((s) => s.itemCosts);
  const menuBrandId = useKitchenStore((s) => s.menuBrandId);
  const refreshItems = useKitchenStore((s) => s.refreshItems);

  const editing = editingId ? items.find((i) => i.id === editingId) : undefined;
  // cost_cents isn't on MenuItem itself (org-scoped separately — see 0016); the store loads it
  // alongside items in the same fetch, so it's already available by the time this screen mounts.
  const editingCostCents = editingId ? itemCosts[editingId] : undefined;

  const [name, setName] = useState(editing?.name ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [priceRupees, setPriceRupees] = useState(editing ? String(editing.price_cents / 100) : '');
  const [costRupees, setCostRupees] = useState(editingCostCents != null ? String(editingCostCents / 100) : '');
  const [station, setStation] = useState<Station>(editing?.station ?? 'WOK');
  const [prepMinutes, setPrepMinutes] = useState(editing ? String(editing.prep_minutes) : '');
  const [photoUri, setPhotoUri] = useState<string | null>(editing?.image_url ?? null);
  const [pickedLocalUri, setPickedLocalUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photo access needed', 'Allow photo library access to add a dish photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      aspect: [4, 3],
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPickedLocalUri(result.assets[0].uri);
    }
  }

  async function save() {
    const priceCents = Math.round(Number(priceRupees) * 100);
    const costCents = Math.round(Number(costRupees) * 100);
    const prep = Number(prepMinutes);

    if (!name.trim()) return Alert.alert('Name required');
    if (!Number.isFinite(priceCents) || priceCents <= 0) return Alert.alert('Enter a valid price');
    if (!Number.isFinite(costCents) || costCents < 0) return Alert.alert('Enter a valid cost');
    if (!Number.isFinite(prep) || prep <= 0) return Alert.alert('Enter a valid prep time');

    setSaving(true);
    try {
      const id =
        editing?.id ??
        (
          await createMenuItem({
            brandId: menuBrandId,
            name: name.trim(),
            description: description.trim() || null,
            priceCents,
            costCents,
            station,
            prepMinutes: prep,
          })
        ).id;

      if (editing) {
        await updateMenuItem(id, {
          name: name.trim(),
          description: description.trim() || null,
          price_cents: priceCents,
          cost_cents: costCents,
          station,
          prep_minutes: prep,
        });
      }

      if (pickedLocalUri) {
        const url = await uploadMenuItemPhoto(id, pickedLocalUri);
        await updateMenuItem(id, { image_url: url });
      }

      await refreshItems();
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not save', errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: kitchen.bg }} contentContainerStyle={styles.wrap}>
      <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
        <Text style={styles.back}>← MENU</Text>
      </Pressable>
      <Text style={styles.title}>{editing ? 'Edit dish' : 'Add dish'}</Text>

      <Pressable onPress={pickPhoto} style={styles.photoBox}>
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} />
        ) : (
          <Text style={styles.photoLabel}>Tap to add a photo</Text>
        )}
      </Pressable>

      <Field label="Name">
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Butter Chicken Bowl" placeholderTextColor={kitchen.textFaint} />
      </Field>

      <Field label="Description">
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Slow-simmered tomato gravy, charred thigh..."
          placeholderTextColor={kitchen.textFaint}
          multiline
        />
      </Field>

      <View style={styles.row}>
        <Field label="Price (₹)" style={{ flex: 1 }}>
          <TextInput style={styles.input} value={priceRupees} onChangeText={setPriceRupees} keyboardType="numeric" placeholder="340" placeholderTextColor={kitchen.textFaint} />
        </Field>
        <Field label="Cost (₹)" style={{ flex: 1 }}>
          <TextInput style={styles.input} value={costRupees} onChangeText={setCostRupees} keyboardType="numeric" placeholder="128" placeholderTextColor={kitchen.textFaint} />
        </Field>
      </View>

      <Field label="Prep time (min)">
        <TextInput style={styles.input} value={prepMinutes} onChangeText={setPrepMinutes} keyboardType="numeric" placeholder="14" placeholderTextColor={kitchen.textFaint} />
      </Field>

      <Field label="Station">
        <View style={styles.stationRow}>
          {STATIONS.map((s) => {
            const active = s === station;
            return (
              <Pressable
                key={s}
                onPress={() => setStation(s)}
                style={[styles.stationChip, { backgroundColor: active ? '#2A2419' : kitchen.surface, borderColor: active ? '#5B4A22' : kitchen.borderSoft }]}
              >
                <Text style={[styles.stationLabel, { color: active ? kitchen.accent : kitchen.textSoft }]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>
      </Field>

      <Pressable disabled={saving} onPress={save} style={[styles.saveBtn, saving && { opacity: 0.6 }]}>
        {saving ? <ActivityIndicator color="#191510" /> : <Text style={styles.saveLabel}>{editing ? 'Save changes' : 'Add dish'}</Text>}
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 16 },
  back: { fontFamily: type.mono, fontWeight: '600', fontSize: 12, letterSpacing: 0.8, color: kitchen.textSoft },
  title: { fontFamily: type.display, fontWeight: '700', fontSize: 22, color: kitchen.text },
  photoBox: { height: 160, borderRadius: 16, backgroundColor: kitchen.surface, borderWidth: 1, borderColor: kitchen.borderSoft, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  photoLabel: { fontFamily: type.display, fontWeight: '500', fontSize: 13, color: kitchen.textFaint },
  fieldLabel: { fontFamily: type.mono, fontWeight: '600', fontSize: 10, letterSpacing: 1, color: kitchen.textFaint },
  input: { minHeight: minTapTarget, borderRadius: 12, borderWidth: 1, borderColor: kitchen.borderSoft, backgroundColor: kitchen.surface, paddingHorizontal: 14, color: kitchen.text, fontFamily: type.display, fontSize: 15 },
  multiline: { minHeight: 80, paddingTop: 14, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 12 },
  stationRow: { flexDirection: 'row', gap: 8 },
  stationChip: { flex: 1, height: 44, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stationLabel: { fontFamily: type.display, fontWeight: '600', fontSize: 12 },
  saveBtn: { minHeight: 60, borderRadius: 16, backgroundColor: kitchen.accent, alignItems: 'center', justifyContent: 'center' },
  saveLabel: { fontFamily: type.display, fontWeight: '700', fontSize: 16, color: '#191510' },
});
