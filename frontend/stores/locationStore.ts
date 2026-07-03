/**
 * Location Store — auto-detect + manual override
 * ════════════════════════════════════════════════
 * Auto-detects city/state via expo-location on first launch.
 * User can manually override anytime. Persisted in AsyncStorage.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const LOC_KEY = 'echo_user_location';

export type UserLocation = {
  city: string;
  state: string;
  display: string; // "Seattle, WA"
};

const POPULAR_CITIES: UserLocation[] = [
  { city: 'Seattle', state: 'WA', display: 'Seattle, WA' },
  { city: 'Los Angeles', state: 'CA', display: 'Los Angeles, CA' },
  { city: 'New York', state: 'NY', display: 'New York, NY' },
  { city: 'Miami', state: 'FL', display: 'Miami, FL' },
  { city: 'Chicago', state: 'IL', display: 'Chicago, IL' },
  { city: 'Houston', state: 'TX', display: 'Houston, TX' },
  { city: 'Atlanta', state: 'GA', display: 'Atlanta, GA' },
  { city: 'San Francisco', state: 'CA', display: 'San Francisco, CA' },
  { city: 'Portland', state: 'OR', display: 'Portland, OR' },
  { city: 'Denver', state: 'CO', display: 'Denver, CO' },
  { city: 'Austin', state: 'TX', display: 'Austin, TX' },
  { city: 'Nashville', state: 'TN', display: 'Nashville, TN' },
  { city: 'Las Vegas', state: 'NV', display: 'Las Vegas, NV' },
  { city: 'Phoenix', state: 'AZ', display: 'Phoenix, AZ' },
  { city: 'Philadelphia', state: 'PA', display: 'Philadelphia, PA' },
  { city: 'San Diego', state: 'CA', display: 'San Diego, CA' },
  { city: 'Dallas', state: 'TX', display: 'Dallas, TX' },
  { city: 'Minneapolis', state: 'MN', display: 'Minneapolis, MN' },
  { city: 'Detroit', state: 'MI', display: 'Detroit, MI' },
  { city: 'Washington', state: 'DC', display: 'Washington, DC' },
  { city: 'Boston', state: 'MA', display: 'Boston, MA' },
  { city: 'New Orleans', state: 'LA', display: 'New Orleans, LA' },
  { city: 'Memphis', state: 'TN', display: 'Memphis, TN' },
];

interface LocationState {
  location: UserLocation | null;
  isDetecting: boolean;
  hasInitialized: boolean;
  popularCities: UserLocation[];
  initialize: () => Promise<void>;
  setLocation: (loc: UserLocation) => Promise<void>;
  searchCities: (query: string) => UserLocation[];
}

export const useLocationStore = create<LocationState>((set, get) => ({
  location: null,
  isDetecting: false,
  hasInitialized: false,
  popularCities: POPULAR_CITIES,

  initialize: async () => {
    const state = get();
    if (state.hasInitialized || state.isDetecting || state.location) return;
    set({ hasInitialized: true });
    // Check stored location first
    try {
      const stored = await AsyncStorage.getItem(LOC_KEY);
      if (stored) {
        set({ location: JSON.parse(stored), isDetecting: false });
        return;
      }
    } catch {}

    // Auto-detect via expo-location
    set({ isDetecting: true });
    try {
      let Location: any = null;
      try { Location = require('expo-location'); } catch {}

      if (Location && Platform.OS !== 'web') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          const [geo] = await Location.reverseGeocodeAsync({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          if (geo) {
            const loc: UserLocation = {
              city: geo.city || 'Unknown',
              state: geo.region || '',
              display: `${geo.city || 'Unknown'}${geo.region ? `, ${geo.region}` : ''}`,
            };
            await AsyncStorage.setItem(LOC_KEY, JSON.stringify(loc));
            set({ location: loc, isDetecting: false });
            return;
          }
        }
      }
    } catch {}

    // Fallback
    const fallback: UserLocation = { city: 'Seattle', state: 'WA', display: 'Seattle, WA' };
    set({ location: fallback, isDetecting: false });
  },

  setLocation: async (loc) => {
    await AsyncStorage.setItem(LOC_KEY, JSON.stringify(loc));
    set({ location: loc });
  },

  searchCities: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return POPULAR_CITIES.slice(0, 8);
    return POPULAR_CITIES.filter(c =>
      c.city.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q) ||
      c.display.toLowerCase().includes(q)
    ).slice(0, 8);
  },
}));
