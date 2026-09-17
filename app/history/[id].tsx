import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonAvatar } from '../../components/PersonAvatar';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useReceiptStore } from '../../store/useReceiptStore';
import { formatPLN } from '../../utils/currency';
import type { Person, ReceiptItem } from '../../types';

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

export default function HistoryDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const archived = useReceiptStore((s) => s.history.find((r) => r.id === id));

  const { breakdowns, unassignedItems } = useMemo(() => {
    if (!archived) return { breakdowns: [] as PersonBreakdown[], unassignedItems: [] as ReceiptItem[] };

    const byPerson = new Map<string, PersonBreakdown>();
    archived.peopleSnapshot.forEach((person) =>
      byPerson.set(person.id, { person, total: 0, lines: [] })
    );

    const unassigned: ReceiptItem[] = [];

    archived.items.forEach((item) => {
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

    return { breakdowns: Array.from(byPerson.values()), unassignedItems: unassigned };
  }, [archived]);

  if (!archived) {
    return (
      <View style={[styles.container, styles.emptyState, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Nie znaleziono tego paragonu.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {archived.placeName}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>
            {archived.date} · zapisano {new Date(archived.savedAt).toLocaleDateString('pl-PL')}
          </Text>
          <Text style={styles.totalValue}>{formatPLN(archived.total)}</Text>
        </View>

        {unassignedItems.length > 0 && (
          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>
              {unassignedItems.length}{' '}
              {unassignedItems.length === 1 ? 'pozycja była' : 'pozycje były'} bez przypisania
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
              <Text style={styles.emptyItemsText}>Brak przypisanych pozycji.</Text>
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
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerSpacer: {
    width: 32,
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
  emptyItemsText: {
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.itemMeta,
    color: colors.textSecondary,
  },
});
