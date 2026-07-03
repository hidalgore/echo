import React from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import type { DonationSelection, NonprofitDonationCampaign } from '../../types/nonprofitDonation';
import { formatDonationCurrency, getCampaignProgressPercent, getCampaignStatus } from '../../services/donationCampaignService';

const SUCCESS = '#10B981';
const SUCCESS_SOFT = 'rgba(16,185,129,0.10)';
const SUCCESS_BORDER = 'rgba(16,185,129,0.18)';

type Props = {
  campaign?: NonprofitDonationCampaign | null;
  selection: DonationSelection;
  baseTotal?: number;
  onSelect: (selection: DonationSelection) => void;
  context?: 'single' | 'circle' | 'pay_for_all' | 'recipient';
};

export function DonationCard({ campaign, selection, baseTotal = 0, onSelect, context = 'single' }: Props) {
  const { colors: c } = useDynamicTheme();
  const [custom, setCustom] = React.useState('');
  if (!campaign) return null;

  const status = getCampaignStatus(campaign);
  const progress = getCampaignProgressPercent(campaign);
  const roundTarget = Math.ceil(baseTotal / 5) * 5 || 5;
  const roundUpAmount = Math.max(0, Math.round((roundTarget - baseTotal) * 100) / 100);
  const canRoundUp = roundUpAmount > 0.49;
  const selectedAmount = selection.amount;

  const contextCopy = context === 'circle'
    ? 'Your donation applies only to your ticket purchase.'
    : context === 'pay_for_all'
      ? 'This donation is added once to your full order. Guests are not charged.'
      : 'Donation is optional and separate from your ticket purchase.';

  return (
    <View style={[s.card, { backgroundColor: c.surface2, borderColor: c.accentSoft }]}>
      <View style={s.headerRow}>
        <View style={[s.iconWrap, { backgroundColor: c.accentSoft }]}><Ionicons name="heart-outline" size={18} color={c.accent} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: c.text }]}>Make an impact</Text>
          <Text style={[s.sub, { color: c.textTertiary }]}>Support this verified nonprofit's mission.</Text>
        </View>
        <View style={[s.verifiedPill, { backgroundColor: SUCCESS_SOFT, borderColor: SUCCESS_BORDER }]}>
          <Ionicons name="checkmark-circle" size={11} color={SUCCESS} />
          <Text style={[s.verifiedText, { color: SUCCESS }]}>Verified</Text>
        </View>
      </View>

      <Text style={[s.cause, { color: c.text }]}>{campaign.causeTitle}</Text>
      <Text style={[s.body, { color: c.textTertiary }]} numberOfLines={3}>{campaign.causeDescription}</Text>

      <View style={s.progressMetaRow}>
        <Text style={[s.progressText, { color: c.textSecondary }]}>{formatDonationCurrency(campaign.raisedAmount)} raised of {formatDonationCurrency(campaign.goalAmount)} goal</Text>
        <Text style={[s.statusText, { color: c.accent }]}>{status === 'goal_exceeded' ? 'Goal exceeded' : status === 'goal_reached' ? 'Goal reached' : `${progress}%`}</Text>
      </View>
      <View style={[s.progressTrack, { backgroundColor: c.hairline }]}>
        <View style={[s.progressFill, { width: `${Math.min(progress, 100)}%`, backgroundColor: c.accent }]} />
      </View>
      {(status === 'goal_reached' || status === 'goal_exceeded') ? (
        <Text style={[s.goalNote, { color: SUCCESS }]}>Goal reached. Donations remain open until event closeout.</Text>
      ) : null}

      <View style={s.amountRow}>
        <AmountPill label="No thanks" active={selectedAmount === 0} onPress={() => onSelect({ amount: 0, type: 'fixed' })} neutral c={c} />
        {canRoundUp ? <AmountPill label="Round up" sub={`+${formatDonationCurrency(roundUpAmount)}`} active={selection.type === 'round_up'} onPress={() => onSelect({ amount: roundUpAmount, type: 'round_up' })} c={c} /> : null}
        {campaign.suggestedAmounts.map((amount) => (
          <AmountPill key={amount} label={formatDonationCurrency(amount)} active={selectedAmount === amount && selection.type === 'fixed'} onPress={() => onSelect({ amount, type: 'fixed' })} c={c} />
        ))}
      </View>

      <View style={s.customRow}>
        <TextInput
          style={[s.customInput, { color: c.text, backgroundColor: c.bgCard, borderColor: c.border }]}
          value={custom}
          onChangeText={(value) => {
            setCustom(value);
            const amount = Number(value) || 0;
            onSelect({ amount, type: 'custom' });
          }}
          placeholder="Custom amount"
          placeholderTextColor={c.textMuted}
          keyboardType="numeric"
        />
        {selectedAmount > 0 ? (
          <View style={[s.selectedPill, { backgroundColor: SUCCESS_SOFT }]}>
            <Ionicons name="checkmark" size={12} color={SUCCESS} />
            <Text style={[s.selectedText, { color: SUCCESS }]}>{formatDonationCurrency(selectedAmount)} selected</Text>
          </View>
        ) : null}
      </View>

      <View style={s.trustRow}>
        <Ionicons name="receipt-outline" size={13} color={c.textMuted} />
        <Text style={[s.trustText, { color: c.textMuted }]}>{contextCopy} Receipt included · tracked separately.</Text>
      </View>
    </View>
  );
}

type PillColors = ReturnType<typeof useDynamicTheme>['colors'];

function AmountPill({ label, sub, active, neutral, onPress, c }: {
  label: string; sub?: string; active?: boolean; neutral?: boolean; onPress: () => void; c: PillColors;
}) {
  return (
    <TouchableOpacity
      style={[
        s.amountPill,
        { borderColor: c.accentSoft, backgroundColor: c.accentSoft },
        neutral && { borderColor: c.border, backgroundColor: c.bgCard },
        active && { backgroundColor: c.text, borderColor: c.text },
      ]}
      onPress={onPress}
      activeOpacity={0.84}
    >
      <Text style={[s.amountText, { color: c.accent }, neutral && { color: c.textTertiary }, active && { color: c.bg }]}>{label}</Text>
      {sub ? <Text style={[s.amountSub, { color: c.accent }, active && { color: c.bg }]}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { padding: 18, borderRadius: 24, borderWidth: 1, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  verifiedText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
  cause: { fontSize: 14, fontWeight: '800', marginTop: 4 },
  body: { fontSize: 12.5, lineHeight: 18 },
  progressMetaRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  progressText: { fontSize: 12, fontWeight: '700' },
  statusText: { fontSize: 12, fontWeight: '900' },
  progressTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  goalNote: { fontSize: 11.5, fontWeight: '700' },
  amountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  amountPill: { minHeight: 38, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  amountText: { fontSize: 12, fontWeight: '800' },
  amountSub: { fontSize: 10, fontWeight: '700', marginTop: 1 },
  customRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  customInput: { flex: 1, height: 42, borderRadius: 14, paddingHorizontal: 14, borderWidth: 1 },
  selectedPill: { flexDirection: 'row', gap: 4, alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 999 },
  selectedText: { fontSize: 11, fontWeight: '800' },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7, marginTop: 2 },
  trustText: { flex: 1, fontSize: 11.5, lineHeight: 16 },
});
