import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '../constants/theme';
import { formatPLN } from '../utils/currency';
import { shareRange } from '../utils/split';
import type { Person, ReceiptItem } from '../types';
import { PersonAvatar } from './PersonAvatar';

type Props = {
  item: ReceiptItem | null;
  people: Person[];
  onTogglePerson: (itemId: string, personId: string) => void;
};

export const AssignPeopleSheet = forwardRef<BottomSheet, Props>(
  ({ item, people, onTogglePerson }, ref) => {
    const snapPoints = useMemo(() => ['55%'], []);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.6}
        />
      ),
      []
    );

    if (!item) return null;

    const assignedCount = item.assignedPersonIds.length;
    const range = assignedCount > 0 ? shareRange(item.price, assignedCount) : null;

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <BottomSheetView style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>{formatPLN(item.price)}</Text>
            </View>

            {assignedCount > 0 && range && (
              <View style={styles.shareBadge}>
                <Text style={styles.shareBadgeValue}>
                  {range.uneven
                    ? `${formatPLN(range.min)}–${formatPLN(range.max)}`
                    : formatPLN(range.min)}
                </Text>
                <Text style={styles.shareBadgeLabel}>/ os.</Text>
              </View>
            )}
          </View>

          <Text style={styles.sectionLabel}>Kto płaci za tę pozycję?</Text>

          <View style={styles.peopleGrid}>
            {people.map((person) => {
              const selected = item.assignedPersonIds.includes(person.id);
              return (
                <Pressable
                  key={person.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onTogglePerson(item.id, person.id);
                  }}
                  style={[styles.personChip, selected && styles.personChipSelected]}
                >
                  <PersonAvatar name={person.name} color={person.color} size={40} selected={selected} />
                  <Text style={[styles.personName, selected && styles.personNameSelected]} numberOfLines={1}>
                    {person.name}
                  </Text>
                  {selected && (
                    <View style={styles.checkDot}>
                      <Text style={styles.checkDotText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {assignedCount === 0 && (
            <Text style={styles.hint}>Zaznacz przynajmniej jedną osobę.</Text>
          )}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

AssignPeopleSheet.displayName = 'AssignPeopleSheet';

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  handleIndicator: {
    backgroundColor: colors.textTertiary,
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    ...typography.sheetTitle,
    color: colors.textPrimary,
  },
  itemPrice: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  shareBadge: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  shareBadgeValue: {
    color: colors.accentSecondary,
    fontWeight: '700',
    fontSize: 15,
  },
  shareBadgeLabel: {
    color: colors.textTertiary,
    fontSize: 10,
    marginTop: 1,
  },
  sectionLabel: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  peopleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  personChip: {
    width: 84,
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    position: 'relative',
  },
  personChipSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(108,108,229,0.12)',
  },
  personName: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  personNameSelected: {
    color: colors.textPrimary,
  },
  checkDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDotText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  hint: {
    marginTop: spacing.lg,
    color: colors.danger,
    fontSize: 12,
    textAlign: 'center',
  },
});
