/**
 * CreateEventAI — AI Clarity Guardrail
 * ═════════════════════════════════════
 * Analyzes event description for clarity issues and suggests improvements.
 * Renders inline warnings when description may confuse potential attendees.
 */
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../../theme/hostTokens';
import { Text } from '../../ui';

type ClarityIssue = {
  type: 'vague' | 'missing_detail' | 'too_long' | 'no_issue';
  message: string;
  suggestion?: string;
};

/** Lightweight heuristic clarity check — production would use AI API */
function analyzeClarity(description: string): ClarityIssue {
  const trimmed = description.trim();

  if (trimmed.length > 1000) {
    return {
      type: 'too_long',
      message: 'Your description is quite long. Consider trimming for better readability.',
      suggestion: 'Focus on the top 3 things guests need to know.',
    };
  }

  const hasTime = /\d{1,2}(:\d{2})?\s*(am|pm|AM|PM)/i.test(trimmed);
  const hasLocation = /(at |@|venue|location|address)/i.test(trimmed);

  if (!hasTime && !hasLocation && trimmed.length < 80) {
    return {
      type: 'vague',
      message: 'Your description may be too brief. Guests want to know what to expect.',
      suggestion: 'Add details about atmosphere, lineup, dress code, or what makes this event special.',
    };
  }

  return { type: 'no_issue', message: '' };
}

interface AIClarityGuardrailProps {
  description: string;
}

export function AIClarityGuardrail({ description }: AIClarityGuardrailProps) {
  const [issue, setIssue] = useState<ClarityIssue>({ type: 'no_issue', message: '' });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(false);
    const timer = setTimeout(() => {
      setIssue(analyzeClarity(description));
    }, 500);
    return () => clearTimeout(timer);
  }, [description]);

  if (issue.type === 'no_issue' || dismissed) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Ionicons name="sparkles-outline" size={16} color={colors.accentAmber} />
        <Text style={styles.title}>AI Clarity Check</Text>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.message}>{issue.message}</Text>
      {issue.suggestion && (
        <Text style={styles.suggestion}>{issue.suggestion}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.15)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentAmber,
  },
  message: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  suggestion: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
