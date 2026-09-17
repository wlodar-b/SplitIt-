import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonAvatar } from '../components/PersonAvatar';
import { colors, radius, spacing, typography } from '../constants/theme';
import { useReceiptStore } from '../store/useReceiptStore';
import { formatPLN } from '../utils/currency';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const hasHydrated = useReceiptStore((s) => s.hasHydrated);
  const items = useReceiptStore((s) => s.items);
  const people = useReceiptStore((s) => s.people);
  const placeName = useReceiptStore((s) => s.placeName);
  const historyCount = useReceiptStore((s) => s.history.length);
  const startNewReceipt = useReceiptStore((s) => s.startNewReceipt);
  const loadDemoReceipt = useReceiptStore((s) => s.loadDemoReceipt);

  // Dopóki store nie wczyta się z AsyncStorage, nie renderujemy treści —
  // inaczej przez ułamek sekundy widać pusty stan zamiast zapisanego rachunku.
  if (!hasHydrated) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const hasDraft = items.length > 0;
  const draftTotal = items.reduce((sum, item) => sum + item.price, 0);

  const handleScan = () => {
    startNewReceipt();
    router.push('/scan');
  };

  const handleManual = () => {
    startNewReceipt();
    router.push('/verify');
  };

  const handleDemo = () => {
    loadDemoReceipt();
    router.push('/verify');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xxl,
        paddingHorizontal: spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.brand}>SplitIt!</Text>
      <Text style={styles.tagline}>Podziel rachunek w kilka dotknięć</Text>

      {hasDraft && (
        <Pressable onPress={() => router.push('/split')} style={styles.draftCard}>
          <View style={styles.draftHeader}>
            <Text style={styles.draftLabel}>RACHUNEK W TOKU</Text>
            <Text style={styles.draftTotal}>{formatPLN(draftTotal)}</Text>
          </View>
          <Text style={styles.draftPlace} numberOfLines={1}>
            {placeName || 'Bez nazwy'} · {items.length}{' '}
            {items.length === 1 ? 'pozycja' : 'pozycji'}
          </Text>
          {people.length > 0 && (
            <View style={styles.avatarRow}>
              {people.map((person, index) => (
                <PersonAvatar
                  key={person.id}
                  name={person.name}
                  color={person.color}
                  size={24}
                  overlap={index > 0}
                />
              ))}
            </View>
          )}
          <Text style={styles.draftCta}>Kontynuuj →</Text>
        </Pressable>
      )}

      <Pressable onPress={handleScan} style={styles.primaryWrapper}>
        <LinearGradient
          colors={colors.accentGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryCard}
        >
          <Text style={styles.primaryEmoji}>📷</Text>
          <Text style={styles.primaryTitle}>Zeskanuj paragon</Text>
          <Text style={styles.primarySubtitle}>
            Zrób zdjęcie, a my odczytamy pozycje
          </Text>
        </LinearGradient>
      </Pressable>

      <Pressable onPress={handleManual} style={styles.secondaryCard}>
        <Text style={styles.secondaryTitle}>✍️  Wpisz ręcznie</Text>
        <Text style={styles.secondarySubtitle}>Dodaj pozycje i ceny samodzielnie</Text>
      </Pressable>

      <Pressable onPress={handleDemo} style={styles.secondaryCard}>
        <Text style={styles.secondaryTitle}>🧪  Przykładowy paragon</Text>
        <Text style={styles.secondarySubtitle}>Szybki test bez wpisywania danych</Text>
      </Pressable>

      <View style={styles.divider} />

      <Pressable onPress={() => router.push('/history')} style={styles.linkRow}>
        <Text style={styles.linkText}>Historia rachunków</Text>
        <View style={styles.linkRight}>
          {historyCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{historyCount}</Text>
            </View>
          )}
          <Text style={styles.linkChevron}>›</Text>
        </View>
      </Pressable>
    </ScrollView>
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
  brand: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.8,
  },
  tagline: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.xxl,
  },
  draftCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.accent,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  draftLabel: {
    ...typography.itemMeta,
    color: colors.accentSecondary,
    letterSpacing: 0.5,
  },
  draftTotal: {
    ...typography.itemPrice,
    color: colors.textPrimary,
  },
  draftPlace: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
  },
  draftCta: {
    ...typography.itemMeta,
    color: colors.accentSecondary,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  primaryWrapper: {
    marginBottom: spacing.md,
  },
  primaryCard: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    minHeight: 150,
    justifyContent: 'flex-end',
  },
  primaryEmoji: {
    fontSize: 30,
    marginBottom: spacing.sm,
  },
  primaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  primarySubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  secondaryCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  secondaryTitle: {
    ...typography.itemName,
    color: colors.textPrimary,
  },
  secondarySubtitle: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.lg,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  linkText: {
    ...typography.itemName,
    color: colors.textPrimary,
  },
  linkRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  linkChevron: {
    color: colors.textTertiary,
    fontSize: 22,
    fontWeight: '700',
  },
});
