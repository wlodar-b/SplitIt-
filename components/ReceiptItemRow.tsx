import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors, radius, spacing, typography } from '../constants/theme';
import { formatPLN } from '../utils/currency';
import { shareRange } from '../utils/split';
import type { Person, ReceiptItem } from '../types';
import { PersonAvatar } from './PersonAvatar';

type Props = {
  item: ReceiptItem;
  people: Person[];
  onPress: (item: ReceiptItem) => void;
};

export function ReceiptItemRow({ item, people, onPress }: Props) {
  const scale = useSharedValue(1);
  const assignedPeople = people.filter((p) => item.assignedPersonIds.includes(p.id));
  const isUnassigned = assignedPeople.length === 0;
  const range = isUnassigned
    ? null
    : shareRange(item.price, assignedPeople.length);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPressIn={() => {
          scale.value = withSpring(0.97, { damping: 18, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 18, stiffness: 300 });
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item);
        }}
        style={[styles.card, isUnassigned && styles.cardUnassigned]}
      >
        <View style={styles.topRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            {assignedPeople.length > 1 && range && (
              <Text style={styles.splitMeta}>
                {range.uneven
                  ? `${formatPLN(range.min)}–${formatPLN(range.max)} / os. × ${assignedPeople.length}`
                  : `${formatPLN(range.min)} / os. × ${assignedPeople.length}`}
              </Text>
            )}
          </View>
          <Text style={styles.price}>{formatPLN(item.price)}</Text>
        </View>

        <View style={styles.bottomRow}>
          {isUnassigned ? (
            <View style={styles.unassignedPill}>
              <View style={styles.unassignedDot} />
              <Text style={styles.unassignedText}>Kto płaci?</Text>
            </View>
          ) : (
            <View style={styles.avatarStack}>
              {assignedPeople.map((p, index) => (
                <PersonAvatar key={p.id} name={p.name} color={p.color} size={24} overlap={index > 0} />
              ))}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardUnassigned: {
    borderColor: 'rgba(255,92,122,0.25)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nameBlock: {
    flex: 1,
    marginRight: spacing.md,
  },
  name: {
    ...typography.itemName,
    color: colors.textPrimary,
  },
  splitMeta: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  price: {
    ...typography.itemPrice,
    color: colors.textPrimary,
  },
  bottomRow: {
    marginTop: spacing.md,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unassignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.dangerSoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.round,
  },
  unassignedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
    marginRight: 6,
  },
  unassignedText: {
    ...typography.itemMeta,
    color: colors.danger,
  },
});
