import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, spacing } from '../../theme/tokens';
import { Text } from '../ui';
import type { InsiderFeedbackCategory, InsiderFeedbackSeverity, InsiderFeedbackAttachment, InsiderMission } from '../../types/insider';

const categories: InsiderFeedbackCategory[] = ['bug', 'design_issue', 'confusing_experience', 'missing_feature', 'performance_issue', 'accessibility_issue', 'enhancement_idea', 'positive_feedback'];
const severities: InsiderFeedbackSeverity[] = ['cosmetic', 'minor', 'major', 'critical'];

export function InsiderFeedbackForm({ onSubmit, missions = [] }: { onSubmit: (payload: any) => void; missions?: InsiderMission[] }) {
  const [category, setCategory] = useState<InsiderFeedbackCategory>('bug');
  const [severity, setSeverity] = useState<InsiderFeedbackSeverity>('minor');
  const [title, setTitle] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [expected, setExpected] = useState('');
  const [trying, setTrying] = useState('');
  const [attachments, setAttachments] = useState<InsiderFeedbackAttachment[]>([]);
  const [missionId, setMissionId] = useState<string | undefined>(undefined);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...result.assets.map((asset, index) => ({ id: `media-${Date.now()}-${index}`, uri: asset.uri, type: asset.type === 'video' ? 'video' : 'photo', fileName: asset.fileName ?? undefined } as InsiderFeedbackAttachment)),
        ...prev,
      ]);
    }
  };

  const disabled = !title.trim() || !whatHappened.trim();

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Submit Visual Feedback</Text>
      <Text style={styles.body}>Attach screenshots, photos, screen recordings, or videos. ECHO AI triages category, severity, device context, and screen clues before staff review.</Text>
      {missions.length > 0 && (
        <>
          <Text style={styles.subhead}>Connect to a mission</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            <Chip label="General feedback" active={!missionId} onPress={() => setMissionId(undefined)} />
            {missions.map((item) => <Chip key={item.id} label={item.title} active={missionId === item.id} onPress={() => setMissionId(item.id)} />)}
          </ScrollView>
        </>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {categories.map((item) => <Chip key={item} label={item.replace(/_/g, ' ')} active={category === item} onPress={() => setCategory(item)} />)}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {severities.map((item) => <Chip key={item} label={item} active={severity === item} onPress={() => setSeverity(item)} />)}
      </ScrollView>
      <Field placeholder="Short title" value={title} onChangeText={setTitle} />
      <Field placeholder="What were you trying to do?" value={trying} onChangeText={setTrying} multiline />
      <Field placeholder="What happened?" value={whatHappened} onChangeText={setWhatHappened} multiline />
      <Field placeholder="What did you expect?" value={expected} onChangeText={setExpected} multiline />
      <TouchableOpacity style={styles.upload} onPress={pickMedia} activeOpacity={0.8}>
        <Ionicons name="images-outline" size={18} color={colors.echoBlue} />
        <Text style={styles.uploadText}>Add photos / video / screen recording</Text>
        <Text style={styles.count}>{attachments.length}</Text>
      </TouchableOpacity>
      <TouchableOpacity disabled={disabled} style={[styles.submit, disabled && { opacity: 0.45 }]} onPress={() => {
        onSubmit({ missionId, category, severity, title, whatWereYouTryingToDo: trying, whatHappened, whatExpected: expected, reproducibility: 'not_sure', attachments });
        setTitle(''); setTrying(''); setWhatHappened(''); setExpected(''); setAttachments([]);
      }}>
        <Text style={styles.submitText}>Submit Feedback</Text>
      </TouchableOpacity>
      <Text style={styles.finePrint}>{Platform.OS === 'web' ? 'Web upload uses browser media picker.' : 'Mobile upload uses native media picker.'} Personal details should be blurred before submitting sensitive screenshots.</Text>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity onPress={onPress} style={[styles.chip, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></TouchableOpacity>;
}

function Field(props: any) {
  return <TextInput {...props} placeholderTextColor="rgba(255,255,255,0.32)" style={[styles.input, props.multiline && styles.multiline]} />;
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  title: { color: '#FFF', fontSize: 18, fontWeight: '900' },
  body: { color: 'rgba(255,255,255,0.62)', fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 12 },
  subhead: { color: 'rgba(255,255,255,0.48)', fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
  chipRow: { gap: 8, paddingVertical: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', backgroundColor: 'rgba(255,255,255,0.04)' },
  chipActive: { backgroundColor: 'rgba(32,199,255,0.16)', borderColor: 'rgba(32,199,255,0.30)' },
  chipText: { color: 'rgba(255,255,255,0.58)', fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF' },
  input: { minHeight: 46, borderRadius: 14, paddingHorizontal: 14, color: '#FFF', backgroundColor: 'rgba(15,17,21,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', marginTop: 10 },
  multiline: { minHeight: 86, paddingTop: 14, textAlignVertical: 'top' },
  upload: { marginTop: 12, minHeight: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10, backgroundColor: 'rgba(32,199,255,0.08)', borderWidth: 1, borderColor: 'rgba(32,199,255,0.18)' },
  uploadText: { color: '#FFF', fontSize: 13, fontWeight: '800', flex: 1 },
  count: { color: colors.echoBlue, fontSize: 13, fontWeight: '900' },
  submit: { marginTop: 14, height: 48, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  submitText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
  finePrint: { color: 'rgba(255,255,255,0.42)', fontSize: 11, lineHeight: 16, marginTop: 10 },
});
