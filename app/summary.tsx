import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonAvatar } from '../components/PersonAvatar';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useReceiptStore } from '../store/useReceiptStore';
import { formatPLN } from '../utils/currency';
import type { Person, ReceiptItem } from '../types';

type BreakdownLine = {
  item: ReceiptItem;
  share: number;
  splitCount: number;
};

type PersonBreakdown = {
  person: Person;
  total: number;
  lines: BreakdownLine[];
};

export default function SummaryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Surowe dane ze store — pochodne wartości liczymy lokalnie w useMemo,
  // żeby uniknąć re-renderów w kółko (patrz komentarz w app/index.tsx).
  const items = useReceiptStore((s) => s.items);
  const people = useReceiptStore((s) => s.people);
  const placeName = useReceiptStore((s) => s.placeName);
  const archiveCurrentReceipt = useReceiptStore((s) => s.archiveCurrentReceipt);

  const { breakdowns, unassignedItems, receiptTotal } = useMemo(() => {
    const byPerson = new Map<string, PersonBreakdown>();
    people.forEach((person) => byPerson.set(person.id, { person, total: 0, lines: [] }));

    let total = 0;
    const unassigned: ReceiptItem[] = [];

    items.forEach((item) => {
      total += item.price;
      const splitCount = item.assignedPersonIds.length;

      if (splitCount === 0) {
        unassigned.push(item);
        return;
      }

      const share = item.price / splitCount;
      item.assignedPersonIds.forEach((personId) => {
        const entry = byPerson.get(personId);
        if (!entry) return;
        entry.total += share;
        entry.lines.push({ item, share, splitCount });
      });
    });

    return {
      breakdowns: Array.from(byPerson.values()),
      unassignedItems: unassigned,
      receiptTotal: total,
    };
  }, [items, people]);

  const handleFinish = () => {
    Alert.alert(
      'Zakończyć rachunek?',
      'Ten paragon trafi do historii, a na ekranie głównym zacznie się nowy.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Zakończ i zapisz',
          style: 'default',
          onPress: () => {
            archiveCurrentReceipt();
            router.replace('/');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Prezentacja jako modal wysuwany od dołu — ustawione tylko dla tego ekranu. */}
      <Stack.Screen options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />

      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Podsumowanie</Text>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeButton}
          hitSlop={8}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>{placeName} · suma rachunku</Text>
          <Text style={styles.totalValue}>{formatPLN(receiptTotal)}</Text>
        </View>

        {unassignedItems.length > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>
              {unassignedItems.length}{' '}
              {unassignedItems.length === 1 ? 'pozycja' : 'pozycje'} bez przypisania
            </Text>
            {unassignedItems.map((item) => (
              <View key={item.id} style={styles.warningItemRow}>
                <Text style={styles.warningItemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.warningItemPrice}>{formatPLN(item.price)}</Text>
              </View>
            ))}
          </View>
        )}

        {breakdowns.map(({ person, total, lines }) => (
          <View key={person.id} style={styles.personCard}>
            <View style={styles.personHeader}>
              <View style={styles.personHeaderLeft}>
                <PersonAvatar name={person.name} color={person.color} size={40} />
                <Text style={styles.personName} numberOfLines={1}>
                  {person.name}
                </Text>
              </View>
              <Text style={styles.personTotal}>{formatPLN(total)}</Text>
            </View>

            {lines.length === 0 ? (
              <Text style={styles.emptyText}>Brak przypisanych pozycji.</Text>
            ) : (
              <View style={styles.itemsList}>
                {lines.map(({ item, share, splitCount }) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                      {splitCount > 1 && (
                        <Text style={styles.itemSplitBadge}> ÷{splitCount}</Text>
                      )}
                    </Text>
                    <Text style={styles.itemShare}>{formatPLN(share)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={[styles.finishBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable onPress={handleFinish}>
          <LinearGradient
            colors={colors.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finishGradient}
          >
            <Text style={styles.finishText}>Zakończ i zapisz do historii</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </View>
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
    paddingVertical: spacing.lg,
  },
  headerSpacer: {
    width: 32,
  },
  headerTitle: {
    ...typography.sheetTitle,
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  totalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  totalLabel: {
    ...typography.itemMeta,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.textPrimary,
    marginTop: 4,
  },
  warningCard: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,92,122,0.25)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    ...typography.itemMeta,
    color: colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
  },
  warningItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  warningItemName: {
    ...typography.itemMeta,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  warningItemPrice: {
    ...typography.itemMeta,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  personCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  personHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  personHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  personName: {
    ...typography.sheetTitle,
    fontSize: 16,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flexShrink: 1,
  },
  personTotal: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    color: colors.accentSecondary,
  },
  emptyText: {
    ...typography.itemMeta,
    color: colors.textTertiary,
    marginTop: spacing.md,
  },
  itemsList: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
    paddingTop: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  itemName: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  itemSplitBadge: {
    color: colors.textTertiary,
  },
  itemShare: {
    ...typography.itemMeta,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  finishBar: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
  },
  finishGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    paddingVertical: spacing.md + 2,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
