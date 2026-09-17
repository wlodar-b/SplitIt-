import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssignPeopleSheet } from '../components/AssignPeopleSheet';
import { ManagePeopleSheet } from '../components/ManagePeopleSheet';
import { ReceiptHeader } from '../components/ReceiptHeader';
import { ReceiptItemRow } from '../components/ReceiptItemRow';
import { SummaryFooter } from '../components/SummaryFooter';
import { colors, spacing, typography } from '../constants/theme';
import { useReceiptStore } from '../store/useReceiptStore';
import type { ReceiptItem } from '../types';

const FOOTER_RESERVED_SPACE = 190;

export default function ReceiptScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sheetRef = useRef<BottomSheet>(null);
  const peopleSheetRef = useRef<BottomSheet>(null);
  const [activeItem, setActiveItem] = useState<ReceiptItem | null>(null);

  const hasHydrated = useReceiptStore((s) => s.hasHydrated);
  const placeName = useReceiptStore((s) => s.placeName);
  const date = useReceiptStore((s) => s.date);
  const items = useReceiptStore((s) => s.items);
  const people = useReceiptStore((s) => s.people);
  const historyCount = useReceiptStore((s) => s.history.length);
  const togglePersonOnItem = useReceiptStore((s) => s.togglePersonOnItem);
  const addPerson = useReceiptStore((s) => s.addPerson);
  const removePerson = useReceiptStore((s) => s.removePerson);

  // Re-derive the active item live from the store so the sheet reflects
  // toggles immediately (store is the single source of truth).
  const liveActiveItem = useMemo(
    () => (activeItem ? items.find((i) => i.id === activeItem.id) ?? null : null),
    [activeItem, items]
  );

  // Wartości pochodne liczymy przez useMemo z surowego stanu (items/people).
  // Selektor zwracający nowy obiekt przy każdym wywołaniu (np. s.getTotalsByPerson())
  // powodowałby nieskończoną pętlę re-renderów ("getSnapshot should be cached").
  const { totalsByPerson, receiptTotal, unassignedCount, unassignedTotal } = useMemo(() => {
    const totals: Record<string, number> = {};
    people.forEach((p) => (totals[p.id] = 0));

    let total = 0;
    let unassignedCnt = 0;
    let unassignedSum = 0;

    items.forEach((item) => {
      total += item.price;
      const n = item.assignedPersonIds.length;
      if (n === 0) {
        unassignedCnt += 1;
        unassignedSum += item.price;
        return;
      }
      const share = item.price / n;
      item.assignedPersonIds.forEach((id) => {
        totals[id] = (totals[id] ?? 0) + share;
      });
    });

    return {
      totalsByPerson: totals,
      receiptTotal: total,
      unassignedCount: unassignedCnt,
      unassignedTotal: unassignedSum,
    };
  }, [items, people]);

  const handleOpenItem = (item: ReceiptItem) => {
    setActiveItem(item);
    sheetRef.current?.snapToIndex(0);
  };

  // Dopóki store nie wczyta się z AsyncStorage, nie pokazujemy nic — inaczej
  // przez ułamek sekundy widać "domyślne" dane, które za moment się zastąpią.
  if (!hasHydrated) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>SplitIt!</Text>
        <View style={styles.topBarActions}>
          <Pressable
            onPress={() => peopleSheetRef.current?.snapToIndex(0)}
            style={styles.historyButton}
          >
            <Text style={styles.historyButtonText}>Osoby</Text>
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>{people.length}</Text>
            </View>
          </Pressable>
          <Pressable onPress={() => router.push('/history')} style={styles.historyButton}>
            <Text style={styles.historyButtonText}>Historia</Text>
            {historyCount > 0 && (
              <View style={styles.historyBadge}>
                <Text style={styles.historyBadgeText}>{historyCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <ReceiptHeader placeName={placeName} date={date} total={receiptTotal} />
        }
        renderItem={({ item }) => (
          <ReceiptItemRow item={item} people={people} onPress={handleOpenItem} />
        )}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: FOOTER_RESERVED_SPACE + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      />

      <SummaryFooter
        people={people}
        totalsByPerson={totalsByPerson}
        unassignedCount={unassignedCount}
        unassignedTotal={unassignedTotal}
        onPressSummary={() => router.push('/summary')}
      />

      <AssignPeopleSheet
        ref={sheetRef}
        item={liveActiveItem}
        people={people}
        onTogglePerson={togglePersonOnItem}
      />

      <ManagePeopleSheet
        ref={peopleSheetRef}
        people={people}
        onAddPerson={addPerson}
        onRemovePerson={removePerson}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textTertiary,
    letterSpacing: 0.3,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  historyButtonText: {
    ...typography.itemMeta,
    color: colors.textSecondary,
  },
  historyBadge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  historyBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
