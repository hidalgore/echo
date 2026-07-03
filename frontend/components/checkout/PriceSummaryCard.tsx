/**
 * PriceSummaryCard
 * Breakdown: Subtotal → Service fee (10%) → Sales tax (8.5%) → Total
 * Three modes: single | circle (user pays 1) | pay_all (user pays all)
 */

import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../ui';

type Props = {
  quantity: number;
  purchaseMode: 'single' | 'circle' | 'pay_all';
  unitPrice: number;
  feeRate?: number;
  taxRate?: number;
};

const fmt = (n: number) => `$${n.toFixed(2)}`;

export function PriceSummaryCard({
  quantity,
  purchaseMode,
  unitPrice,
  feeRate = 0.10,
  taxRate = 0.085,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  // ── Circle: user pays 1 ticket only ─────────────────────────────────
  const circleSubtotal = unitPrice;
  const circleFee      = Math.round(circleSubtotal * feeRate * 100) / 100;
  const circleTax      = Math.round(circleSubtotal * taxRate * 100) / 100;
  const circleTotal    = circleSubtotal + circleFee + circleTax;

  // ── Pay all ──────────────────────────────────────────────────────────
  const allSubtotal = unitPrice * quantity;
  const allFee      = Math.round(allSubtotal * feeRate * 100) / 100;
  const allTax      = Math.round(allSubtotal * taxRate * 100) / 100;
  const allTotal    = allSubtotal + allFee + allTax;

  // ── Single ───────────────────────────────────────────────────────────
  const singleSubtotal = unitPrice;
  const singleFee      = Math.round(singleSubtotal * feeRate * 100) / 100;
  const singleTax      = Math.round(singleSubtotal * taxRate * 100) / 100;
  const singleTotal    = singleSubtotal + singleFee + singleTax;

  const isCircle  = purchaseMode === 'circle';
  const isPayAll  = purchaseMode === 'pay_all';

  const subtotal = isPayAll ? allSubtotal  : isCircle ? circleSubtotal : singleSubtotal;
  const fee      = isPayAll ? allFee       : isCircle ? circleFee      : singleFee;
  const tax      = isPayAll ? allTax       : isCircle ? circleTax      : singleTax;
  const total    = isPayAll ? allTotal     : isCircle ? circleTotal    : singleTotal;

  const totalLabel = isPayAll ? 'Total due now' : isCircle ? 'Due now' : 'Total';

  return (
    <View style={s.card}>
      {/* ── Collapsed: total row + expand toggle ── */}
      <TouchableOpacity
        style={s.totalRow}
        onPress={() => setExpanded(v => !v)}
        activeOpacity={0.75}
      >
        <View style={s.totalLeft}>
          <Text style={s.totalLabel}>{totalLabel}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color="rgba(255,255,255,0.45)"
            style={{ marginLeft: 4, marginTop: 1 }}
          />
        </View>
        <Text style={s.totalAmount}>{fmt(total)}</Text>
      </TouchableOpacity>

      {/* ── Expandable breakdown ── */}
      {expanded && (
        <View style={s.breakdown}>
          <BreakdownRow
            label={isPayAll ? `${quantity} × ${fmt(unitPrice)}` : `Ticket (${fmt(unitPrice)})`}
            value={fmt(subtotal)}
          />
          <BreakdownRow label={`Service fee (${Math.round(feeRate * 100)}%)`} value={fmt(fee)} />
          <BreakdownRow label={`Sales tax (${Math.round(taxRate * 100)}%)`} value={fmt(tax)} />
          <View style={s.bdivider} />
          <BreakdownRow label={totalLabel} value={fmt(total)} bold />
        </View>
      )}

      {/* ── Circle note ── */}
      {isCircle && (
        <Text style={s.note}>
          Friends claim and pay for their own tickets after checkout
        </Text>
      )}
    </View>
  );
}

function BreakdownRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={s.brow}>
      <Text style={[s.blabel, bold && s.blabelBold]}>{label}</Text>
      <Text style={[s.bvalue, bold && s.bvalueBold]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginHorizontal: 20,
    gap: 0,
  },
  // Total row
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 36,
  },
  totalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.70)',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Breakdown
  breakdown: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    gap: 10,
  },
  brow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.52)',
  },
  blabelBold: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.80)',
  },
  bvalue: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.70)',
  },
  bvalueBold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bdivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 2,
  },
  // Note
  note: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.38)',
    marginTop: 12,
    lineHeight: 17,
  },
});
