import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../constants/theme';
import { getInitials } from '../utils/currency';

type Props = {
  name: string;
  color: string;
  size?: number;
  selected?: boolean;
  overlap?: boolean; // gdy avatar jest w "stosie" pod pozycją paragonu
};

export function PersonAvatar({ name, color, size = 28, selected, overlap }: Props) {
  const fontSize = Math.max(10, size * 0.36);

  return (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          marginLeft: overlap ? -size * 0.28 : 0,
          borderWidth: selected ? 2 : overlap ? 2 : 0,
          borderColor: selected ? colors.textPrimary : colors.background,
        },
      ]}
    >
      <LinearGradient
        colors={[lighten(color), color]}
        style={[styles.gradient, { borderRadius: size / 2 }]}
      >
        <Text style={[styles.initials, { fontSize }]} numberOfLines={1}>
          {getInitials(name)}
        </Text>
      </LinearGradient>
    </View>
  );
}

// Delikatnie rozjaśnia kolor hex, żeby zrobić subtelny gradient na avatarze.
function lighten(hex: string, amount = 0.25): string {
  const c = hex.replace('#', '');
  const r = Math.min(255, parseInt(c.substring(0, 2), 16) + 255 * amount);
  const g = Math.min(255, parseInt(c.substring(2, 4), 16) + 255 * amount);
  const b = Math.min(255, parseInt(c.substring(4, 6), 16) + 255 * amount);
  return `rgb(${r | 0}, ${g | 0}, ${b | 0})`;
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
