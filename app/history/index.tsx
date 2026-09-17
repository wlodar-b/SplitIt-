import { useRouter } from 'expo-router';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonAvatar } from '../../components/PersonAvatar';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useReceiptStore } from '../../store/useReceiptStore';
import { formatPLN } from '../../utils/currency';
import type { ArchivedReceipt } from '../../types';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const history = useReceiptStore((s) => s.history);
  const deleteHistoryReceipt = useReceiptStore((s) => s.deleteHistoryReceipt);

  const handleDelete = (item: ArchivedReceipt) => {
    Alert.alert('Usunąć paragon?', `${item.placeName} · ${item.date}`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => deleteHistoryReceipt(item.id),
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Historia</Text>
        <View style={styles.headerSpacer} />
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🧾</Text>
          <Text style={styles.emptyTitle}>Brak zapisanych paragonów</Text>
          <Text style={styles.emptySubtitle}>
            Zakończ rachunek na ekranie podsumowania, żeby trafił tutaj.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: spacing.xl,
            paddingBottom: insets.bottom + spacing.xxl,
          }}
          renderItem={({ item }) => {
            const uniquePeople = item.peopleSnapshot.filter((person) =>
              item.items.some((i) => i.assignedPersonIds.includes(person.id))
            );

            return (
              <Pressable
                onPress={() => router.push(`/history/${item.id}`)}
                style={styles.card}
              >
                <View style={styles.cardTopRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardPlace} numberOfLines={1}>
                      {item.placeName}
                    </Text>
                    <Text style={styles.cardDate}>{item.date}</Text>
                  </View>
                  <Text style={styles.cardTotal}>{formatPLN(item.total)}</Text>
                </View>

                <View style={styles.cardBottomRow}>
                  <View style={styles.avatarStack}>
                    {uniquePeople.map((person, index) => (
                      <PersonAvatar
                        key={person.id}
                        name={person.name}
                        color={person.color}
                        size={24}
                        overlap={index > 0}
                      />
                    ))}
                  </View>

                  <Pressable
                    onPress={() => handleDelete(item)}
                    style={styles.deleteButton}
                    hitSlop={8}
                  >
                    <Text style={styles.deleteButtonText}>Usuń</Text>
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  },
  headerSpacer: {
    width: 32,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.itemName,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardPlace: {
    ...typography.itemName,
    color: colors.textPrimary,
  },
  cardDate: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardTotal: {
    ...typography.itemPrice,
    color: colors.accentSecondary,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deleteButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  deleteButtonText: {
    ...typography.itemMeta,
    color: colors.danger,
  },
});
