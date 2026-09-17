import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, personColorPalette, radius, spacing, typography } from '../constants/theme';
import type { Person } from '../types';
import { PersonAvatar } from './PersonAvatar';

type Props = {
  people: Person[];
  onAddPerson: (name: string) => void;
  onRemovePerson: (personId: string) => void;
};

export const ManagePeopleSheet = forwardRef<BottomSheet, Props>(
  ({ people, onAddPerson, onRemovePerson }, ref) => {
    const snapPoints = useMemo(() => ['65%'], []);
    const [name, setName] = useState('');

    const usedColors = useMemo(() => new Set(people.map((p) => p.color)), [people]);
    const nextColor = useMemo(
      () =>
        personColorPalette.find((c) => !usedColors.has(c)) ??
        personColorPalette[people.length % personColorPalette.length],
      [usedColors, people.length]
    );

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
      ),
      []
    );

    const handleAdd = () => {
      const trimmed = name.trim();
      if (!trimmed) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onAddPerson(trimmed);
      setName('');
    };

    const handleRemove = (person: Person) => {
      Alert.alert('Usunąć osobę?', `${person.name} zostanie usunięta ze wszystkich pozycji.`, [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onRemovePerson(person.id);
          },
        },
      ]);
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
      >
        {/*
          Uwaga: całość musi być JEDNYM BottomSheetScrollView, a nie
          BottomSheetView + BottomSheetScrollView jako rodzeństwo — BottomSheetView
          renderuje się z position:"absolute" (żeby biblioteka mogła zmierzyć jego
          wysokość), więc dwa osobne komponenty nakładały się na siebie i przechwytywały
          dotknięcia nawzajem (stąd "najazd" na input i niedziałający przycisk "Dodaj").
        */}
        <BottomSheetScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Osoby</Text>

          <View style={styles.addRow}>
            <View style={styles.previewAvatar}>
              <PersonAvatar name={name || '?'} color={nextColor} size={36} />
            </View>
            <BottomSheetTextInput
              value={name}
              onChangeText={setName}
              placeholder="Imię nowej osoby"
              placeholderTextColor={colors.textTertiary}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleAdd}
            />
            <Pressable
              onPress={handleAdd}
              disabled={!name.trim()}
              style={[styles.addButton, !name.trim() && styles.addButtonDisabled]}
            >
              <Text style={styles.addButtonText}>Dodaj</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Na paragonie ({people.length})</Text>

          {people.length === 0 ? (
            <Text style={styles.emptyText}>Brak osób — dodaj kogoś powyżej.</Text>
          ) : (
            people.map((person) => (
              <View key={person.id} style={styles.personRow}>
                <View style={styles.personRowLeft}>
                  <PersonAvatar name={person.name} color={person.color} size={36} />
                  <Text style={styles.personName} numberOfLines={1}>
                    {person.name}
                  </Text>
                </View>
                <Pressable onPress={() => handleRemove(person)} style={styles.removeButton} hitSlop={8}>
                  <Text style={styles.removeButtonText}>Usuń</Text>
                </Pressable>
              </View>
            ))
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    );
  }
);

ManagePeopleSheet.displayName = 'ManagePeopleSheet';

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
  title: {
    ...typography.sheetTitle,
    color: colors.textPrimary,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  previewAvatar: {
    // wrapper zapewnia stabilny rozmiar podczas animacji zmiany inicjałów
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.textPrimary,
    fontSize: 15,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  addButtonDisabled: {
    opacity: 0.4,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  sectionLabel: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  emptyText: {
    ...typography.itemMeta,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderColor: colors.divider,
  },
  personRowLeft: {
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
  removeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  removeButtonText: {
    ...typography.itemMeta,
    color: colors.danger,
  },
});
