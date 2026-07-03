import { Alert, Linking, Platform } from 'react-native';
import type { Event } from '../types';

const formatDateForGoogle = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const buildGoogleCalendarUrl = (event: Event) => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    location: `${event.venue_name}, ${event.venue_address}`,
    dates: `${formatDateForGoogle(event.start_time)}/${formatDateForGoogle(event.end_time)}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

const buildAppleCalendarUrl = (event: Event) => {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `UID:${event.id}@echo-access`,
    `DTSTAMP:${formatDateForGoogle(new Date().toISOString())}`,
    `DTSTART:${formatDateForGoogle(event.start_time)}`,
    `DTEND:${formatDateForGoogle(event.end_time)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.venue_name}, ${event.venue_address}`,
    `DESCRIPTION:${event.description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\n');
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
};

async function openFirstAvailable(urls: string[]) {
  for (const url of urls) {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return true;
    }
  }
  return false;
}

export async function openDirections(address: string) {
  const encoded = encodeURIComponent(address);
  const appleUrls = ['maps://?q=' + encoded, 'http://maps.apple.com/?q=' + encoded];
  const googleUrls = Platform.select({
    ios: [`comgooglemaps://?q=${encoded}`, `https://www.google.com/maps/search/?api=1&query=${encoded}`],
    android: [`https://www.google.com/maps/search/?api=1&query=${encoded}`],
    default: [`https://www.google.com/maps/search/?api=1&query=${encoded}`],
  }) || [];

  Alert.alert('Open directions', 'Choose your maps app.', [
    {
      text: 'Apple Maps',
      onPress: async () => {
        const opened = await openFirstAvailable(appleUrls);
        if (!opened) Alert.alert('Apple Maps unavailable', 'Apple Maps could not be opened on this device.');
      },
    },
    {
      text: 'Google Maps',
      onPress: async () => {
        const opened = await openFirstAvailable(googleUrls);
        if (!opened) Alert.alert('Google Maps unavailable', 'Google Maps could not be opened on this device.');
      },
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export async function addToCalendar(event: Event, provider: 'apple' | 'google') {
  const url = provider === 'google' ? buildGoogleCalendarUrl(event) : buildAppleCalendarUrl(event);
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Calendar unavailable',
      provider === 'apple'
        ? 'Apple Calendar could not be opened on this device.'
        : 'Google Calendar could not be opened on this device.'
    );
  }
}
