import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '../constants/theme';
import type { DraftItem } from '../store/useReceiptStore';
import { useReceiptStore } from '../store/useReceiptStore';
import { isGeminiConfigured, recognizeReceiptWithGemini } from '../utils/geminiReceipt';
import { getOcrAvailability, recognizeTextFromImage } from '../utils/ocr';
import { guessPlaceName, parseReceiptText } from '../utils/receiptParser';

type Engine =
  | { type: 'gemini' }
  | { type: 'on-device' }
  | { type: 'none'; reason: string };

function resolveEngine(): Engine {
  if (isGeminiConfigured()) return { type: 'gemini' };
  const onDevice = getOcrAvailability();
  if (onDevice.available) return { type: 'on-device' };
  return {
    type: 'none',
    reason:
      'Brak skonfigurowanego OCR. Dodaj EXPO_PUBLIC_GEMINI_API_KEY w pliku .env (Google AI Studio) albo zbuduj development build z on-device OCR.',
  };
}

export default function ScanScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const setItemsFromDraft = useReceiptStore((s) => s.setItemsFromDraft);
  const setPlaceName = useReceiptStore((s) => s.setPlaceName);
  const setLastPhotoUri = useReceiptStore((s) => s.setLastPhotoUri);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoMime, setPhotoMime] = useState('image/jpeg');
  const [busy, setBusy] = useState(false);

  const engine = resolveEngine();

  const pickImage = async (source: 'camera' | 'library') => {
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Brak uprawnień',
        source === 'camera'
          ? 'Potrzebujemy dostępu do aparatu, żeby zrobić zdjęcie paragonu.'
          : 'Potrzebujemy dostępu do zdjęć, żeby wybrać paragon.'
      );
      return;
    }

    // base64 potrzebne dla Gemini (wysyłamy zdjęcie inline w requeście REST).
    const options: ImagePicker.ImagePickerOptions = {
      quality: 0.7,
      base64: engine.type === 'gemini',
    };

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const asset = result.assets[0];
    setPhotoUri(asset.uri);
    setLastPhotoUri(asset.uri);
    setPhotoBase64(asset.base64 ?? null);
    setPhotoMime(asset.mimeType ?? 'image/jpeg');

    if (engine.type !== 'none') {
      await runOcr(asset.uri, asset.base64 ?? null, asset.mimeType ?? 'image/jpeg');
    }
  };

  const runOcr = async (uri: string, base64: string | null, mimeType: string) => {
    setBusy(true);
    try {
      let drafts: DraftItem[];
      let place = '';

      if (engine.type === 'gemini') {
        if (!base64) throw new Error('MISSING_BASE64');
        const result = await recognizeReceiptWithGemini(base64, mimeType);
        drafts = result.items;
        place = result.placeName;
      } else if (engine.type === 'on-device') {
        const text = await recognizeTextFromImage(uri);
        drafts = parseReceiptText(text);
        place = guessPlaceName(text);
      } else {
        drafts = [];
      }

      if (drafts.length === 0) {
        Alert.alert(
          'Nie rozpoznano pozycji',
          'Zdjęcie mogło być nieczytelne. Możesz poprawić pozycje ręcznie.'
        );
      }

      setItemsFromDraft(drafts);
      if (place) setPlaceName(place);
      router.replace('/verify');
    } catch (error) {
      console.warn('OCR error', error);
      Alert.alert(
        'Nie udało się odczytać paragonu',
        'Przejdź do ręcznej edycji i wpisz pozycje.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Skanuj paragon</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + spacing.xxl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {engine.type === 'none' && (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>OCR nieskonfigurowany</Text>
            <Text style={styles.noticeText}>{engine.reason}</Text>
            <Text style={styles.noticeText}>
              Zdjęcie możesz zrobić już teraz — posłuży jako podgląd przy ręcznym
              wpisywaniu pozycji.
            </Text>
          </View>
        )}

        {engine.type === 'gemini' && (
          <View style={styles.infoCard}>
            <Text style={styles.infoText}>✨ Rozpoznawanie: Gemini 3.6 Flash (chmura)</Text>
          </View>
        )}

        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderEmoji}>🧾</Text>
            <Text style={styles.placeholderText}>
              Zrób zdjęcie paragonu z góry, w dobrym świetle
            </Text>
          </View>
        )}

        {busy && (
          <View style={styles.busyRow}>
            <ActivityIndicator color={colors.accent} />
            <Text style={styles.busyText}>
              {engine.type === 'gemini' ? 'Gemini czyta paragon…' : 'Odczytuję tekst…'}
            </Text>
          </View>
        )}

        <Pressable
          onPress={() => pickImage('camera')}
          disabled={busy}
          style={[styles.primaryButton, busy && styles.disabled]}
        >
          <Text style={styles.primaryButtonText}>📷  Zrób zdjęcie</Text>
        </Pressable>

        <Pressable
          onPress={() => pickImage('library')}
          disabled={busy}
          style={[styles.secondaryButton, busy && styles.disabled]}
        >
          <Text style={styles.secondaryButtonText}>🖼️  Wybierz z galerii</Text>
        </Pressable>

        {engine.type !== 'none' && photoUri && !busy && (
          <Pressable
            onPress={() => runOcr(photoUri, photoBase64, photoMime)}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>🔁  Spróbuj odczytać ponownie</Text>
          </Pressable>
        )}

        <Pressable onPress={() => router.replace('/verify')} style={styles.ghostButton}>
          <Text style={styles.ghostButtonText}>Pomiń — wpiszę ręcznie</Text>
        </Pressable>
      </ScrollView>
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
  noticeCard: {
    backgroundColor: 'rgba(255,198,109,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,198,109,0.3)',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  noticeTitle: {
    ...typography.itemName,
    color: colors.warning,
  },
  noticeText: {
    ...typography.itemMeta,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: 'rgba(126,167,255,0.1)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(126,167,255,0.3)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    marginBottom: spacing.lg,
  },
  infoText: {
    ...typography.itemMeta,
    color: colors.accentSecondary,
    fontWeight: '700',
  },
  preview: {
    width: '100%',
    height: 280,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
  },
  placeholder: {
    height: 220,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  placeholderEmoji: {
    fontSize: 36,
    marginBottom: spacing.sm,
  },
  placeholderText: {
    ...typography.itemMeta,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  busyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  busyText: {
    ...typography.itemMeta,
    color: colors.textSecondary,
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.round,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radius.round,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  ghostButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ghostButtonText: {
    ...typography.itemMeta,
    color: colors.accentSecondary,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
