import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/tokens';
import { useDynamicTheme } from '../../theme/dynamicTheme';
import { Text, Glass } from '../ui';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DatePillRowProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

const DATE_OPTIONS = [
  { id: 'today', label: 'Today' },
  { id: 'tomorrow', label: 'Tomorrow' },
  { id: 'weekend', label: 'This Weekend' },
  { id: 'pick', label: 'Pick Dates' },
];

// Date Range Calendar Picker
function CalendarPicker({ 
  visible, 
  onClose, 
  onSelectDateRange 
}: { 
  visible: boolean; 
  onClose: () => void; 
  onSelectDateRange: (startDate: Date, endDate: Date | null) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDayPress = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setSelectingEnd(true);
    } else if (selectingEnd) {
      // Select end date
      if (date < startDate) {
        // Swap if end is before start
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setSelectingEnd(false);
    }
  };

  const handleConfirm = () => {
    if (startDate) {
      onSelectDateRange(startDate, endDate);
      onClose();
    }
  };

  const handleClear = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectingEnd(false);
  };

  const isToday = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.getTime() === today.getTime();
  };

  const isStart = (day: number) => {
    if (!startDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.getTime() === startDate.getTime();
  };

  const isEnd = (day: number) => {
    if (!endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date.getTime() === endDate.getTime();
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date > startDate && date < endDate;
  };

  const isPast = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    date.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDateLabel = () => {
    if (!startDate) return 'Select start date';
    if (!endDate) return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → Select end date`;
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} → ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const renderDays = () => {
    const days = [];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    
    // Week day headers
    weekDays.forEach((day, i) => {
      days.push(
        <View key={`header-${i}`} style={styles.dayCell}>
          <Text variant="caption" color="textMuted">{day}</Text>
        </View>
      );
    });

    // Empty cells for start
    for (let i = 0; i < startingDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
      const past = isPast(day);
      const start = isStart(day);
      const end = isEnd(day);
      const inRange = isInRange(day);
      const todayDay = isToday(day);
      
      days.push(
        <TouchableOpacity 
          key={day} 
          style={[
            styles.dayCell,
            inRange && styles.inRangeCell,
            start && styles.startCell,
            end && styles.endCell,
            todayDay && !start && !end && styles.todayCell,
          ]}
          onPress={() => !past && handleDayPress(day)}
          disabled={past}
        >
          <Text 
            style={[
              styles.dayText,
              past && styles.pastDayText,
              todayDay && !start && !end && styles.todayText,
              (start || end) && styles.selectedText,
              inRange && styles.inRangeText,
            ]}
          >
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} activeOpacity={1} />
        
        <Glass style={styles.calendarCard}>
          {/* Header */}
          <View style={styles.calendarHeader}>
            <Text variant="eventTitle">Select Date Range</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close-outline" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Selected Range Display */}
          <View style={styles.rangeDisplay}>
            <Text variant="meta" color="accent">{formatDateLabel()}</Text>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back-outline" size={20} color={colors.text} />
            </TouchableOpacity>
            <Text variant="meta" style={{ fontWeight: '600' }}>{monthName}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward-outline" size={20} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Calendar Grid */}
          <View style={styles.calendarGrid}>
            {renderDays()}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
              <Text variant="meta" color="textMuted">Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmBtn, !startDate && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={!startDate}
            >
              <Text variant="actionText" style={{ color: colors.text }}>
                {startDate && !endDate ? 'SELECT SINGLE DATE' : 'APPLY DATES'}
              </Text>
            </TouchableOpacity>
          </View>
        </Glass>
      </View>
    </Modal>
  );
}

export function DatePillRow({ selectedDate, onDateChange }: DatePillRowProps) {
  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date | null } | null>(null);

  const handlePillPress = (id: string) => {
    if (id === 'pick') {
      setShowCalendar(true);
    } else {
      onDateChange(selectedDate === id ? '' : id);
      setDateRange(null);
    }
  };

  const handleDateRange = (start: Date, end: Date | null) => {
    setDateRange({ start, end });
    if (end) {
      onDateChange(`range:${start.toISOString()}:${end.toISOString()}`);
    } else {
      onDateChange(`custom:${start.toISOString()}`);
    }
  };

  const getDisplayLabel = () => {
    if (!dateRange) return null;
    const { start, end } = dateRange;
    if (!end) {
      return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {DATE_OPTIONS.map((option) => {
          const isActive = option.id === 'pick' 
            ? !!dateRange 
            : selectedDate === option.id && !dateRange;
          
          const label = option.id === 'pick' && dateRange 
            ? getDisplayLabel() 
            : option.label;

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => handlePillPress(option.id)}
              activeOpacity={0.7}
            >
              {option.id === 'pick' && (
                <Ionicons 
                  name="calendar-outline" 
                  size={16} 
                  color={isActive ? colors.bg : colors.text} 
                  style={{ marginRight: 4 }}
                />
              )}
              <Text 
                variant="meta" 
                style={{ color: isActive ? colors.bg : colors.text }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <CalendarPicker 
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onSelectDateRange={handleDateRange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 16, marginBottom: 20 },
  scrollContent: { paddingHorizontal: 16, gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
    minHeight: 40,
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  
  // Calendar Modal
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlayDim },
  calendarCard: { width: '100%', maxWidth: 340, borderRadius: 16, padding: 16 },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  closeBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  rangeDisplay: { alignItems: 'center', paddingVertical: 8, marginBottom: 8, backgroundColor: colors.surface2, borderRadius: 8 },
  monthNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navBtn: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 14, color: colors.text },
  pastDayText: { color: colors.textMuted },
  todayCell: { backgroundColor: colors.surface2, borderRadius: 16 },
  todayText: { color: colors.accent, fontWeight: '600' },
  startCell: { backgroundColor: colors.accent, borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  endCell: { backgroundColor: colors.accent, borderTopRightRadius: 16, borderBottomRightRadius: 16 },
  inRangeCell: { backgroundColor: 'rgba(139, 92, 246, 0.3)' },
  selectedText: { color: colors.bg, fontWeight: '600' },
  inRangeText: { color: colors.text },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  clearBtn: { paddingVertical: 12, paddingHorizontal: 16 },
  confirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 20, alignItems: 'center', backgroundColor: colors.accent },
  confirmBtnDisabled: { opacity: 0.5 },
});

export default DatePillRow;
