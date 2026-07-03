/**
 * HOST Promotion Composer
 * ═══════════════════════
 * Spec §5: Choose destination → Choose format → Generate → Preview → Publish/Export
 * Event-first: always starts from a live event object.
 */
import React, { useEffect, useState, useMemo } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../../theme/hostTokens';
import { Text } from '../../components/ui';
import { useSocialStore } from '../../stores/socialStore';
import { useEventStore } from '../../stores/eventStore';
import { getPromotionCapabilities } from '../../services/socialMock';
import { formatDate, formatTime } from '../../utils/format';
import type { SocialProvider, PromoFormat, PublishMode } from '../../types/social';

const STEPS = ['Destination', 'Format', 'Generate', 'Preview', 'Publish'];

const PROVIDER_META: Record<SocialProvider, { label: string; icon: string; color: string }> = {
  instagram: { label: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  facebook:  { label: 'Facebook',  icon: 'logo-facebook',  color: '#1877F2' },
  tiktok:    { label: 'TikTok',    icon: 'logo-tiktok',    color: '#010101' },
  x:         { label: 'X',         icon: 'logo-twitter',   color: '#1DA1F2' },
};

const FORMAT_META: Record<PromoFormat, { label: string; icon: string }> = {
  post:  { label: 'Feed Post',   icon: 'image-outline' },
  story: { label: 'Story',       icon: 'phone-portrait-outline' },
  reel:  { label: 'Reel / Short', icon: 'videocam-outline' },
};

export default function PromotionComposer() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const insets = useSafeAreaInsets();
  const { accounts, loadAccounts, currentPackage, createPackage, publish, isLoading, isPublishing, clearPackage } = useSocialStore();
  const { getEventById } = useEventStore();
  const event = eventId ? getEventById(eventId) : undefined;

  const [step, setStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<SocialProvider | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<PromoFormat | null>(null);

  useEffect(() => { loadAccounts(); return () => clearPackage(); }, []);

  const linkedAccounts = useMemo(() => accounts.filter(a => a.status === 'connected' || a.status === 'export_only'), [accounts]);

  const capabilities = useMemo(() => {
    if (!selectedProvider) return null;
    const acct = accounts.find(a => a.provider === selectedProvider);
    return getPromotionCapabilities(selectedProvider, acct?.status || 'not_linked');
  }, [selectedProvider, accounts]);

  const availableFormats = useMemo((): PromoFormat[] => {
    if (!capabilities) return [];
    const formats: PromoFormat[] = [];
    if (capabilities.canDirectPublishPost || capabilities.canExportPost) formats.push('post');
    if (capabilities.canDirectPublishStory || capabilities.canExportStory) formats.push('story');
    if (capabilities.canDirectPublishReel || capabilities.canExportReel) formats.push('reel');
    return formats;
  }, [capabilities]);

  const publishMode = useMemo((): PublishMode => {
    if (!capabilities || !selectedFormat) return 'copy_link';
    if (selectedFormat === 'post' && capabilities.canDirectPublishPost) return 'direct';
    if (selectedFormat === 'story' && capabilities.canDirectPublishStory) return 'direct';
    if (selectedFormat === 'reel' && capabilities.canDirectPublishReel) return 'direct';
    return 'export';
  }, [capabilities, selectedFormat]);

  const handleNext = async () => {
    if (step === 2 && selectedProvider && selectedFormat && eventId) {
      await createPackage(eventId, selectedProvider, selectedFormat);
      setStep(3);
    } else if (step === 4) {
      if (publishMode === 'direct') {
        await publish();
        Alert.alert('Published', 'Your promotion was published successfully!', [{ text: 'Done', onPress: () => router.back() }]);
      } else {
        if (currentPackage) {
          await Share.share({
            message: `${currentPackage.caption_text}\n\n${currentPackage.cta_link}`,
          });
        }
      }
    } else {
      setStep(s => s + 1);
    }
  };

  const canProceed = () => {
    if (step === 0) return !!selectedProvider;
    if (step === 1) return !!selectedFormat;
    if (step === 2) return true;
    if (step === 3) return !!currentPackage;
    return true;
  };

  const ctaLabel = () => {
    if (step < 2) return 'Continue';
    if (step === 2) return 'Generate Package';
    if (step === 3) return 'Review & Confirm';
    if (step === 4) return publishMode === 'direct' ? 'Publish Now' : publishMode === 'export' ? 'Export Package' : 'Copy Link';
    return 'Continue';
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => step > 0 ? setStep(s => s - 1) : router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Promote Event</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Step indicator */}
      <View style={s.stepRow}>
        {STEPS.map((label, i) => (
          <View key={i} style={s.stepItem}>
            <View style={[s.stepDot, i <= step && s.stepDotActive]} />
            <Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text>
          </View>
        ))}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={[s.scrollContent, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* Event header card */}
        {event && (
          <View style={s.eventCard}>
            <Image source={{ uri: event.image_url || `https://picsum.photos/seed/${event.id}/400/200` }} style={s.eventImage} />
            <View style={s.eventInfo}>
              <Text style={s.eventTitle} numberOfLines={1}>{event.title}</Text>
              <Text style={s.eventMeta}>{formatDate(event.start_time)} · {formatTime(event.start_time)}</Text>
              <Text style={s.eventVenue}>{event.venue_name}</Text>
            </View>
          </View>
        )}

        {/* Step 0: Choose destination */}
        {step === 0 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Choose destination</Text>
            <Text style={s.stepBody}>Select where you want to promote this event.</Text>
            {linkedAccounts.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="link-outline" size={36} color="rgba(255,255,255,0.25)" />
                <Text style={s.emptyTitle}>No linked accounts</Text>
                <Text style={s.emptyBody}>Link social accounts to promote this event.</Text>
                <TouchableOpacity style={s.linkBtn} onPress={() => router.push('/(host)/social-settings')}>
                  <Text style={s.linkBtnText}>Link social accounts</Text>
                </TouchableOpacity>
              </View>
            ) : (
              linkedAccounts.map(acct => {
                const meta = PROVIDER_META[acct.provider];
                const selected = selectedProvider === acct.provider;
                return (
                  <TouchableOpacity
                    key={acct.id}
                    style={[s.optionRow, selected && s.optionSelected]}
                    onPress={() => setSelectedProvider(acct.provider)}
                    activeOpacity={0.82}
                  >
                    <View style={[s.optionIcon, { backgroundColor: `${meta.color}18` }]}>
                      <Ionicons name={meta.icon as never} size={22} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.optionLabel}>{meta.label}</Text>
                      <Text style={s.optionSub}>{acct.handle}</Text>
                    </View>
                    {acct.status === 'export_only' && (
                      <View style={s.exportBadge}><Text style={s.exportBadgeText}>Export only</Text></View>
                    )}
                    <View style={[s.radio, selected && s.radioSelected]}>
                      {selected && <View style={s.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* Step 1: Choose format */}
        {step === 1 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Choose format</Text>
            <Text style={s.stepBody}>Available formats for {selectedProvider ? PROVIDER_META[selectedProvider].label : ''}.</Text>
            {availableFormats.map(fmt => {
              const meta = FORMAT_META[fmt];
              const selected = selectedFormat === fmt;
              const canDirect = capabilities && (
                fmt === 'post' ? capabilities.canDirectPublishPost :
                fmt === 'story' ? capabilities.canDirectPublishStory :
                capabilities.canDirectPublishReel
              );
              return (
                <TouchableOpacity
                  key={fmt}
                  style={[s.optionRow, selected && s.optionSelected]}
                  onPress={() => setSelectedFormat(fmt)}
                  activeOpacity={0.82}
                >
                  <View style={[s.optionIcon, { backgroundColor: 'rgba(32,199,255,0.10)' }]}>
                    <Ionicons name={meta.icon as never} size={22} color={colors.accentCyan} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.optionLabel}>{meta.label}</Text>
                    <Text style={s.optionSub}>{canDirect ? 'Ready to publish' : 'Export / native handoff'}</Text>
                  </View>
                  <View style={[s.radio, selected && s.radioSelected]}>
                    {selected && <View style={s.radioInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Step 2: Generate */}
        {step === 2 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Generate promotion</Text>
            <Text style={s.stepBody}>
              ECHO will build a promotion package from your event data, brand assets, and selected format. Tap generate to continue.
            </Text>
            <View style={s.genPreview}>
              <Ionicons name="sparkles-outline" size={28} color={colors.accentCyan} />
              <Text style={s.genLabel}>
                {selectedFormat ? FORMAT_META[selectedFormat].label : ''} for{' '}
                {selectedProvider ? PROVIDER_META[selectedProvider].label : ''}
              </Text>
              <Text style={s.genSub}>Event data + brand assets + caption</Text>
            </View>
          </View>
        )}

        {/* Step 3: Preview */}
        {step === 3 && currentPackage && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>Preview</Text>
            <Text style={s.stepBody}>Review your promotion before sending.</Text>

            {/* Asset preview */}
            <View style={s.previewCard}>
              {currentPackage.asset_urls[0] && (
                <Image source={{ uri: currentPackage.asset_urls[0] }} style={s.previewImage} />
              )}
              <View style={s.previewCaption}>
                <Text style={s.captionLabel}>Caption</Text>
                <Text style={s.captionText}>{currentPackage.caption_text}</Text>
                <View style={s.hashtagRow}>
                  {currentPackage.hashtags.map(h => (
                    <Text key={h} style={s.hashtagText}>{h}</Text>
                  ))}
                </View>
                <View style={s.linkRow}>
                  <Ionicons name="link-outline" size={14} color={colors.accentCyan} />
                  <Text style={s.linkText}>{currentPackage.cta_link}</Text>
                </View>
              </View>
            </View>
            <Text style={s.publishModeNote}>
              {publishMode === 'direct' ? 'This will publish directly to your account.' : 'This will be exported for you to share.'}
            </Text>
          </View>
        )}

        {/* Step 4: Confirm & Publish/Export */}
        {step === 4 && (
          <View style={s.stepContent}>
            <Text style={s.stepTitle}>
              {publishMode === 'direct' ? 'Ready to publish' : 'Ready to export'}
            </Text>
            <Text style={s.stepBody}>
              {publishMode === 'direct'
                ? `Your ${selectedFormat} will be published to ${selectedProvider ? PROVIDER_META[selectedProvider].label : ''} now.`
                : `Your promotion package will be exported. You can share it via the native app or save the media and caption.`
              }
            </Text>
            <View style={s.confirmChecks}>
              <ConfirmRow icon="image-outline" text={`Format: ${selectedFormat ? FORMAT_META[selectedFormat].label : ''}`} />
              <ConfirmRow icon="globe-outline" text={`Platform: ${selectedProvider ? PROVIDER_META[selectedProvider].label : ''}`} />
              <ConfirmRow icon="text-outline" text="Caption included" />
              <ConfirmRow icon="link-outline" text="Event link attached" />
              <ConfirmRow icon="pricetag-outline" text={`${currentPackage?.hashtags.length || 0} hashtags`} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={[s.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.ctaBtn, !canProceed() && s.ctaBtnDisabled]}
          onPress={handleNext}
          disabled={!canProceed() || isLoading || isPublishing}
          activeOpacity={0.88}
        >
          {(isLoading || isPublishing) ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={s.ctaText}>{ctaLabel()}</Text>
              <Ionicons name={step === 4 && publishMode === 'direct' ? 'send' : 'arrow-forward'} size={18} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ConfirmRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={s.confirmRow}>
      <Ionicons name={icon as never} size={16} color="#10B981" />
      <Text style={s.confirmText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 12,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },

  stepRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.10)' },
  stepDotActive: { backgroundColor: colors.accentCyan },
  stepLabel: { fontSize: 9, fontWeight: '600', color: 'rgba(255,255,255,0.25)', letterSpacing: 0.5 },
  stepLabelActive: { color: colors.accentCyan },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },

  eventCard: {
    flexDirection: 'row', gap: 14, padding: 14,
    borderRadius: radius.xl, marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  eventImage: { width: 64, height: 64, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)' },
  eventInfo: { flex: 1, justifyContent: 'center', gap: 2 },
  eventTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  eventMeta: { color: 'rgba(255,255,255,0.50)', fontSize: 12 },
  eventVenue: { color: 'rgba(255,255,255,0.40)', fontSize: 12 },

  stepContent: { gap: 12 },
  stepTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  stepBody: { color: 'rgba(255,255,255,0.50)', fontSize: 14, lineHeight: 21, marginBottom: 8 },

  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: radius.xl, marginBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  optionSelected: { borderColor: 'rgba(32,199,255,0.40)', backgroundColor: 'rgba(32,199,255,0.06)' },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  optionSub: { color: 'rgba(255,255,255,0.40)', fontSize: 12, marginTop: 2 },
  exportBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
    backgroundColor: 'rgba(99,102,241,0.15)', marginRight: 8,
  },
  exportBadgeText: { fontSize: 10, fontWeight: '700', color: '#6366F1' },
  radio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.accentCyan },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accentCyan },

  genPreview: {
    alignItems: 'center', gap: 12, padding: 32, borderRadius: radius.xl,
    backgroundColor: 'rgba(32,199,255,0.04)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.12)',
    marginTop: 8,
  },
  genLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  genSub: { color: 'rgba(255,255,255,0.40)', fontSize: 13 },

  previewCard: {
    borderRadius: radius.xl, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  previewImage: { width: '100%', height: 260, backgroundColor: 'rgba(255,255,255,0.05)' },
  previewCaption: { padding: 16, gap: 10 },
  captionLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 0.8 },
  captionText: { color: colors.textPrimary, fontSize: 14, lineHeight: 21 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  hashtagText: { color: colors.accentCyan, fontSize: 13, fontWeight: '600' },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  linkText: { color: 'rgba(255,255,255,0.45)', fontSize: 12 },

  publishModeNote: {
    color: 'rgba(255,255,255,0.40)', fontSize: 13, textAlign: 'center', marginTop: 12,
    fontStyle: 'italic',
  },

  confirmChecks: { gap: 12, marginTop: 8 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  confirmText: { color: colors.textPrimary, fontSize: 14 },

  emptyState: {
    alignItems: 'center', gap: 10, padding: 32, borderRadius: radius.xl,
    backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  emptyBody: { color: 'rgba(255,255,255,0.40)', fontSize: 13, textAlign: 'center' },
  linkBtn: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: radius.pill,
    backgroundColor: colors.accentCyan, marginTop: 8,
  },
  linkBtnText: { color: colors.bg, fontSize: 14, fontWeight: '700' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
  },
  ctaBtn: {
    height: 56, borderRadius: radius.pill, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accentCyan,
  },
  ctaBtnDisabled: { opacity: 0.35 },
  ctaText: { color: '#FFF', fontSize: 17, fontWeight: '700' },
});
