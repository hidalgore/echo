import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert, TouchableOpacity } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, SCREEN_HORIZONTAL_PADDING } from '../../theme/hostTokens';
import { ProcessingStepList } from '../../components/host/FlyerUploadCard';
import type { ProcessingStep } from '../../types/hostEvents';
import { useHostStore } from '../../stores/hostStore';
import { logEvent } from '../../services/logging';
import { scanFlyerFromUri } from '../../services/flyerScanner';
import { useEventDraftStore } from '../../stores/eventDraftStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenBackButton } from '../../components/shared/ScreenBackButton';
const CONFIDENCE_THRESHOLD = 0.55;
const INITIAL_STEPS: ProcessingStep[] = [
  { id: '1', label: 'Reading flyer', status: 'pending' },
  { id: '2', label: 'Running text scan', status: 'pending' },
  { id: '3', label: 'Detecting title', status: 'pending' },
  { id: '4', label: 'Identifying date & time', status: 'pending' },
  { id: '5', label: 'Detecting venue', status: 'pending' },
  { id: '6', label: 'Preparing still media', status: 'pending' },
  { id: '7', label: 'Loading draft', status: 'pending' },
];

function to24Hour(input: string) {
  if (!input) return '';
  const match = input.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return '';
  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

export default function FlyerProcessingScreen() {
  const insets = useSafeAreaInsets();
  const { flyerUri } = useLocalSearchParams<{ flyerUri?: string }>();
  const { setActiveDraft } = useHostStore();
  const loadFromEventDraft = useEventDraftStore((state) => state.loadFromEvent);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;

    const mark = (index: number, status: ProcessingStep['status']) => {
      setSteps((prev) => prev.map((step, idx) => idx === index ? { ...step, status } : idx < index && step.status !== 'complete' ? { ...step, status: 'complete' } : step));
    };

    const run = async () => {
      try {
        if (!flyerUri) throw new Error('No flyer was selected.');
        logEvent('host.flyerProcessing', 'started', { flyerUri });

        let confidence = 0;
        let routeTarget: '/(host)/ai-enhance' | '/(host)/scan-error' = '/(host)/scan-error';

        for (let i = 0; i < INITIAL_STEPS.length; i += 1) {
          if (cancelled) return;
          mark(i, 'active');
          await new Promise((resolve) => { timer.current = setTimeout(resolve, i === 1 ? 900 : 350); });
          if (cancelled) return;

          if (i === 1) {
            const result = await scanFlyerFromUri(flyerUri);
            if (cancelled) return;
            const nextDraft = { ...result.draft, flyerImage: flyerUri, eventDetailMediaUri: flyerUri, eventDetailMediaType: 'image' as const, extractionConfidence: result.confidence };
            setActiveDraft(nextDraft);
            loadFromEventDraft({
              title: nextDraft.title,
              venue: nextDraft.venue,
              city: '',
              date: nextDraft.date,
              startTime: to24Hour(nextDraft.startTime),
              endTime: to24Hour(nextDraft.endTime || ''),
              ageRestriction: nextDraft.ageRequirement === '21+' ? '21+' : nextDraft.ageRequirement === '18+' ? '18+' : 'all_ages',
              description: nextDraft.description || nextDraft.suggestedDescription || '',
              coverImageUri: flyerUri,
              eventDetailMediaUri: flyerUri,
              eventDetailMediaType: 'image',
              ticketingModel: nextDraft.price > 0 ? 'paid' : 'free',
              tickets: [{ id: 'tier_1', name: 'General Admission', price: nextDraft.price || 0, quantity: nextDraft.capacity || 100, salesStart: '', salesEnd: '', accessTierId: 'general_admission' }],
              notes: result.rawText,
              categories: nextDraft.category && nextDraft.category !== 'Other' ? [nextDraft.category as never] : [],
            });

            confidence = result.confidence;
            routeTarget = result.confidence >= CONFIDENCE_THRESHOLD ? '/(host)/ai-enhance' : '/(host)/scan-error';
            logEvent('host.flyerProcessing', 'completed', { confidence: result.confidence, method: result.method, title: nextDraft.title, venue: nextDraft.venue });
          }

          mark(i, 'complete');
        }

        timer.current = setTimeout(() => {
          if (!cancelled) router.replace(routeTarget);
        }, confidence >= CONFIDENCE_THRESHOLD ? 350 : 120);
      } catch (e: any) {
        console.error(e);
        setError(e?.message || 'Flyer scan failed.');
        setSteps((prev) => prev.map((step, idx) => idx === 1 ? { ...step, status: 'error' } : step));
        Alert.alert('Flyer scan failed', e?.message || 'Please try another flyer image.');
      }
    };

    void run();
    return () => { cancelled = true; if (timer.current) clearTimeout(timer.current); };
  }, [flyerUri, loadFromEventDraft, setActiveDraft]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScreenBackButton variant="floating" style={{ position: 'absolute', top: insets.top + 8, left: 20, zIndex: 10 }} />
      <View style={styles.content}>
        <Text style={styles.title}>Scanning Flyer</Text>
        <Text style={styles.subtitle}>{error || 'Extracting event information and preparing a still Home cover...'}</Text>
        <View style={{ paddingHorizontal: 40 }}><ProcessingStepList steps={steps} /></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  backBtn: { position: 'absolute', top: 58, left: 20, zIndex: 10, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  content: { flex: 1, paddingHorizontal: SCREEN_HORIZONTAL_PADDING, paddingTop: 100 },
  title: { ...typography.displayLg, color: colors.textPrimary, marginBottom: 8, textAlign: 'center' },
  subtitle: { ...typography.bodyMd, color: colors.textTertiary, textAlign: 'center', marginBottom: 40 },
});
