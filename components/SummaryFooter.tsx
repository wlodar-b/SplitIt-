import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '../constants/theme';
import { formatPLN } from '../utils/currency';
import type { Person } from '../types';
import { PersonAvatar } from './PersonAvatar';

type Props = {
  people: Person[];
  totalsByPerson: Record<string, number>;
  unassignedCount: number;
  unassignedTotal: number;
  onPressSummary: () => void;
};

export function SummaryFooter({
  people,
  totalsByPerson,
  unassignedCount,
  unassignedTotal,
  onPressSummary,
}: Props) {
  return (
    <View style={styles.wrapper}>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, styles.overlayTint]} />

      {unassignedCount > 0 && (
        <View style={styles.warningRow}>
          <View style={styles.warningDot} />
          <Text style={styles.warningText}>
            {unassignedCount} {unassignedCount === 1 ? 'pozycja' : 'pozycje'} bez przypisania ·{' '}
            {formatPLN(unassignedTotal)}
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {people.map((person) => (
          <Animated.View key={person.id} layout={LinearTransition} style={styles.personPill}>
            <PersonAvatar name={person.name} color={person.color} size={30} />
            <View style={styles.pillTextBlock}>
              <Text style={styles.pillName} numberOfLines={1}>
                {person.name}
              </Text>
              <Text style={styles.pillAmount}>{formatPLN(totalsByPerson[person.id] ?? 0)}</Text>
            </View>
          </Animated.View>
        ))}
      </ScrollView>

      <Pressable onPress={onPressSummary} style={styles.ctaWrapper}>
        <LinearGradient
          colors={colors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Text style={styles.ctaText}>Podsumuj</Text>
          <Text style={styles.ctaArrow}>›</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  overlayTint: {
    backgroundColor: 'rgba(11,12,16,0.55)',
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
    marginRight: spacing.sm,
  },
  warningText: {
    ...typography.itemMeta,
    color: colors.danger,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  personPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
  },
  pillTextBlock: {
    marginLeft: spacing.sm,
  },
  pillName: {
    ...typography.footerName,
    color: colors.textSecondary,
  },
  pillAmount: {
    ...typography.footerAmount,
    color: colors.textPrimary,
  },
  ctaWrapper: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    paddingVertical: spacing.md + 2,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  ctaArrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: spacing.xs,
    marginTop: -1,
  },
});
