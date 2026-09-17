import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '../constants/theme';
import { formatPLN } from '../utils/currency';

type Props = {
  placeName: string;
  date: string;
  total: number;
};

export function ReceiptHeader({ placeName, date, total }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>PARAGON</Text>
      <Text style={styles.placeName}>{placeName}</Text>
      <Text style={styles.date}>{date}</Text>

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Suma rachunku</Text>
        <Text style={styles.totalValue}>{formatPLN(total)}</Text>
      </View>

      <View style={styles.dashedDivider} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.receiptSubtitle,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
  placeName: {
    ...typography.receiptTitle,
    color: colors.textPrimary,
  },
  date: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: spacing.lg,
  },
  totalLabel: {
    ...typography.itemMeta,
    color: colors.textSecondary,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.textPrimary,
  },
  dashedDivider: {
    marginTop: spacing.lg,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    borderStyle: 'dashed',
  },
});
