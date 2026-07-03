import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radii } from '../../theme/tokens';
import { Text, Button, Glass } from '../ui';

interface DateRangeCalendarProps {
  onSelect: (start: Date, end: Date) => void;
  onClose: () => void;
}

export function DateRangeCalendar({ onSelect, onClose }: DateRangeCalendarProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const today = new Date();

  const handleDayPress = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleApply = () => {
    if (startDate && endDate) onSelect(startDate, endDate);
    onClose();
  };

  const renderMonth = (monthOffset: number) => {
    const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const firstDay = month.getDay();
    const days = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(month.getFullYear(), month.getMonth(), i));
    }

    const monthName = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
      <View key={monthOffset} style={styles.month}>
        <Text variant="title" style={styles.monthTitle}>{monthName}</Text>
        <View style={styles.weekdays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <Text key={i} variant="caption" color="textTertiary" style={styles.weekday}>{d}</Text>
          ))}
        </View>
        <View style={styles.days}>
          {days.map((date, i) => {
            if (!date) return <View key={i} style={styles.day} />;
            const isStart = startDate && date.toDateString() === startDate.toDateString();
            const isEnd = endDate && date.toDateString() === endDate.toDateString();
            const isInRange = startDate && endDate && date > startDate && date < endDate;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.day, isInRange && styles.dayInRange, (isStart || isEnd) && styles.daySelected]}
                onPress={() => handleDayPress(date)}
              >
                <Text style={{ color: isStart || isEnd ? colors.bg : isInRange ? colors.accent : colors.text }}>
                  {date.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="title">Select Dates</Text>
        <TouchableOpacity onPress={onClose}><Text color="accent">Cancel</Text></TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll}>
        {[0, 1, 2].map(renderMonth)}
      </ScrollView>
      <View style={styles.footer}>
        <Button title="Clear" variant="outline" onPress={() => { setStartDate(null); setEndDate(null); }} style={{ flex: 1, marginRight: 8 }} />
        <Button title="Apply" onPress={handleApply} disabled={!startDate || !endDate} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: colors.divider },
  scroll: { flex: 1 },
  month: { padding: 20 },
  monthTitle: { marginBottom: 16, color: colors.text },
  weekdays: { flexDirection: 'row', marginBottom: 8 },
  weekday: { flex: 1, textAlign: 'center' },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  daySelected: { backgroundColor: colors.accent, borderRadius: radii.pill },
  dayInRange: { backgroundColor: colors.surface2 },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: colors.divider },
});
