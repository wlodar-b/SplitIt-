import BottomSheet from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssignPeopleSheet } from '../components/AssignPeopleSheet';
import { ManagePeopleSheet } from '../components/ManagePeopleSheet';
import { ReceiptHeader } from '../components/ReceiptHeader';
import { ReceiptItemRow } from '../components/ReceiptItemRow';
import { SummaryFooter } from '../components/SummaryFooter';
import { colors, spacing, typography } from '../constants/theme';
import { useReceiptStore } from '../store/useReceiptStore';
import { splitAmountFair } from '../utils/split';
import type { ReceiptItem } from '../types';

const FOOTER_RESERVED_SPACE = 190;

export default function SplitScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const sheetRef = useRef<BottomSheet>(null);
  const peopleSheetRef = useRef<BottomSheet>(null);
  const [activeItem, setActiveItem] = useState<ReceiptItem | null>(null);

  const placeName = useReceiptStore((s) => s.placeName);
  const date = useReceiptStore((s) => s.date);
  const items = useReceiptStore((s) => s.items);
  const people = useReceiptStore((s) => s.people);
  const togglePersonOnItem = useReceiptStore((s) => s.togglePersonOnItem);
  const addPerson = useReceiptStore((s) => s.addPerson);
  const removePerson = useReceiptStore((s) => s.removePerson);

  // Aktywną pozycję czytamy na żywo ze store, żeby sheet od razu widział zmiany.
  const liveActiveItem = useMemo(
    () => (activeItem ? items.find((i) => i.id === activeItem.id) ?? null : null),
    [activeItem, items]
  );

  // Wartości pochodne liczymy przez useMemo z surowego stanu (items/people).
  // Selektor zwracający nowy obiekt przy każdym wywołaniu powodowałby
  // nieskończoną pętlę re-renderów ("getSnapshot should be cached").
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
      const shares = splitAmountFair(item.price, item.assignedPersonIds);
      item.assignedPersonIds.forEach((id) => {
        totals[id] = (totals[id] ?? 0) + (shares[id] ?? 0);
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.topBarTitle}>Kto co jadł?</Text>
        <Pressable
          onPress={() => peopleSheetRef.current?.snapToIndex(0)}
          style={styles.peopleButton}
        >
          <Text style={styles.peopleButtonText}>Osoby</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{people.length}</Text>
          </View>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <ReceiptHeader
            placeName={placeName || 'Rachunek'}
            date={date}
            total={receiptTotal}
          />
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.sm,
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
  topBarTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  peopleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  peopleButtonText: {
    ...typography.itemMeta,
    color: colors.textSecondary,
  },
  badge: {
    marginLeft: 6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
