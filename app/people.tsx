import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PersonAvatar } from '../components/PersonAvatar';
import { colors, personColorPalette, radius, spacing, typography } from '../constants/theme';
import { useReceiptStore } from '../store/useReceiptStore';
import type { Person } from '../types';

export default function PeopleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const people = useReceiptStore((s) => s.people);
  const addPerson = useReceiptStore((s) => s.addPerson);
  const removePerson = useReceiptStore((s) => s.removePerson);

  const [name, setName] = useState('');

  const nextColor = useMemo(() => {
    const used = new Set(people.map((p) => p.color));
    return (
      personColorPalette.find((c) => !used.has(c)) ??
      personColorPalette[people.length % personColorPalette.length]
    );
  }, [people]);

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addPerson(trimmed);
    setName('');
  };

  const handleRemove = (person: Person) => {
    Alert.alert('Usunąć osobę?', `${person.name} zniknie ze wszystkich pozycji.`, [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => removePerson(person.id) },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Kto przy stole?</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: spacing.xxl,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.hint}>
          Dodaj wszystkich, którzy dzielą ten rachunek. Osoby zapamiętujemy na następne
          wyjścia.
        </Text>

        <View style={styles.addRow}>
          <PersonAvatar name={name || '?'} color={nextColor} size={40} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Imię"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            autoCapitalize="words"
          />
          <Pressable
            onPress={handleAdd}
            disabled={!name.trim()}
            style={[styles.addButton, !name.trim() && styles.disabled]}
          >
            <Text style={styles.addButtonText}>Dodaj</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Przy stole ({people.length})</Text>

        {people.length === 0 ? (
          <Text style={styles.emptyText}>Nikogo jeszcze nie ma — dodaj pierwszą osobę.</Text>
        ) : (
          people.map((person) => (
            <View key={person.id} style={styles.personRow}>
              <View style={styles.personLeft}>
                <PersonAvatar name={person.name} color={person.color} size={36} />
                <Text style={styles.personName} numberOfLines={1}>
                  {person.name}
                </Text>
              </View>
              <Pressable onPress={() => handleRemove(person)} hitSlop={8}>
                <Text style={styles.removeText}>Usuń</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <Pressable onPress={() => router.push('/split')} disabled={people.length === 0}>
          <LinearGradient
            colors={colors.accentGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.continueButton, people.length === 0 && styles.disabled]}
          >
            <Text style={styles.continueText}>Dalej — podziel rachunek</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: spacing.lg,
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
  hint: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    color: colors.textPrimary,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionLabel: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.itemMeta,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  personLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  personName: {
    marginLeft: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  removeText: {
    ...typography.itemMeta,
    color: colors.danger,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.divider,
    backgroundColor: colors.background,
  },
  continueButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.round,
    paddingVertical: spacing.md + 2,
  },
  continueText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.4,
  },
});
