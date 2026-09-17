import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../constants/theme';
import { useReceiptStore } from '../store/useReceiptStore';
import { formatPLN } from '../utils/currency';

/** Zamienia wpisany tekst ("12,50") na liczbę; zwraca null dla śmieci. */
function parsePriceInput(raw: string): number | null {
  const normalized = raw.replace(/\s/g, '').replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const placeName = useReceiptStore((s) => s.placeName);
  const items = useReceiptStore((s) => s.items);
  const setPlaceName = useReceiptStore((s) => s.setPlaceName);
  const updateItem = useReceiptStore((s) => s.updateItem);
  const removeItem = useReceiptStore((s) => s.removeItem);
  const addItem = useReceiptStore((s) => s.addItem);

  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const total = items.reduce((sum, item) => sum + item.price, 0);
  const canContinue = items.length > 0;

  const handleAdd = () => {
    const price = parsePriceInput(newPrice);
    if (!newName.trim() || price === null) return;
    addItem(newName.trim(), price);
    setNewName('');
    setNewPrice('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Sprawdź paragon</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Popraw to, co odczytaliśmy — dobre ceny teraz oszczędzą kłótni przy stole.
        </Text>

        <TextInput
          value={placeName}
          onChangeText={setPlaceName}
          placeholder="Nazwa lokalu (opcjonalnie)"
          placeholderTextColor={colors.textTertiary}
          style={styles.placeInput}
        />

        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <TextInput
              value={item.name}
              onChangeText={(text) => updateItem(item.id, { name: text })}
              placeholder="Nazwa pozycji"
              placeholderTextColor={colors.textTertiary}
              style={styles.itemNameInput}
            />
            <TextInput
              defaultValue={item.price.toFixed(2).replace('.', ',')}
              onChangeText={(text) => {
                const price = parsePriceInput(text);
                if (price !== null) updateItem(item.id, { price });
              }}
              keyboardType="decimal-pad"
              placeholder="0,00"
              placeholderTextColor={colors.textTertiary}
              style={styles.itemPriceInput}
            />
            <Pressable onPress={() => removeItem(item.id)} style={styles.removeButton} hitSlop={8}>
              <Text style={styles.removeButtonText}>✕</Text>
            </Pressable>
          </View>
        ))}

        {items.length === 0 && (
          <Text style={styles.emptyText}>
            Brak pozycji. Dodaj pierwszą poniżej.
          </Text>
        )}

        <View style={styles.addCard}>
          <Text style={styles.addLabel}>Dodaj pozycję</Text>
          <View style={styles.addRow}>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="np. Pizza Margherita"
              placeholderTextColor={colors.textTertiary}
              style={styles.addNameInput}
              returnKeyType="next"
            />
            <TextInput
              value={newPrice}
              onChangeText={setNewPrice}
              placeholder="0,00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
              style={styles.addPriceInput}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <Pressable
              onPress={handleAdd}
              disabled={!newName.trim() || parsePriceInput(newPrice) === null}
              style={[
                styles.addButton,
                (!newName.trim() || parsePriceInput(newPrice) === null) && styles.disabled,
              ]}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>
            {items.length} {items.length === 1 ? 'pozycja' : 'pozycji'}
          </Text>
          <Text style={styles.totalValue}>{formatPLN(total)}</Text>
        </View>

        <Pressable onPress={() => router.push('/people')} disabled={!canContinue}>
          <LinearGradient
            colors={colors.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.continueButton, !canContinue && styles.disabled]}
          >
            <Text style={styles.continueText}>Dalej — kto przy stole?</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: colors.textSecondary,
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  headerTitle: {
    ...typography.sheetTitle,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 32,
  },
  hint: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  placeInput: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  itemNameInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    paddingVertical: spacing.sm,
  },
  itemPriceInput: {
    width: 80,
    textAlign: 'right',
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: spacing.sm,
  },
  removeButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
  },
  removeButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    ...typography.itemMeta,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  addCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.backgroundElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  addLabel: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  addNameInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: 15,
  },
  addPriceInput: {
    width: 76,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: 15,
    textAlign: 'right',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -2,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: spacing.md,
  },
  totalLabel: {
    ...typography.itemMeta,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    paddingVertical: spacing.md + 2,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
});
