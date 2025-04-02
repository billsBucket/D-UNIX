"use client";

export type SoundType = 'default' | 'transaction' | 'price' | 'system' | 'volume';

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
  muteTimeStart: number; // Hour of day to start muting (0-23)
  muteTimeEnd: number; // Hour of day to end muting (0-23)
  enabledSounds: {
    [key in SoundType]: boolean;
  };
}

const DEFAULT_SOUND_SETTINGS: SoundSettings = {
  enabled: true,
  volume: 0.7,
  muteTimeStart: 22, // 10 PM
  muteTimeEnd: 8, // 8 AM
  enabledSounds: {
    default: true,
    transaction: true,
    price: true,
    system: true,
    volume: true
  }
};

const SOUND_STORAGE_KEY = 'dunix-sound-settings';

// Sound instances cache
const soundCache: { [key in SoundType]?: HTMLAudioElement } = {};

/**
 * Get sound settings from local storage
 */
export const getSoundSettings = (): SoundSettings => {
  if (typeof window === 'undefined') return DEFAULT_SOUND_SETTINGS;

  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    if (!stored) return DEFAULT_SOUND_SETTINGS;

    const settings = JSON.parse(stored) as SoundSettings;
    // Ensure all fields exist (in case we've updated the settings structure)
    return {
      ...DEFAULT_SOUND_SETTINGS,
      ...settings,
      enabledSounds: {
        ...DEFAULT_SOUND_SETTINGS.enabledSounds,
        ...(settings.enabledSounds || {})
      }
    };
  } catch (error) {
    console.error('Failed to retrieve sound settings:', error);
    return DEFAULT_SOUND_SETTINGS;
  }
};

/**
 * Save sound settings to local storage
 */
export const saveSoundSettings = (settings: Partial<SoundSettings>): SoundSettings => {
  if (typeof window === 'undefined') return DEFAULT_SOUND_SETTINGS;

  const currentSettings = getSoundSettings();
  const newSettings: SoundSettings = {
    ...currentSettings,
    ...settings,
    enabledSounds: {
      ...currentSettings.enabledSounds,
      ...(settings.enabledSounds || {})
    }
  };

  try {
    localStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(newSettings));
    return newSettings;
  } catch (error) {
    console.error('Failed to save sound settings:', error);
    return currentSettings;
  }
};

/**
 * Check if sounds should be muted based on time
 */
const shouldMute = (): boolean => {
  const settings = getSoundSettings();
  if (!settings.enabled) return true;

  // Check if we're in the quiet hours
  const now = new Date();
  const hour = now.getHours();

  if (settings.muteTimeStart <= settings.muteTimeEnd) {
    // Simple case: e.g., mute between 10 PM (22) and 8 AM (8)
    return hour >= settings.muteTimeStart && hour < settings.muteTimeEnd;
  } else {
    // Wrapped case: e.g., mute between 10 PM (22) and 8 AM (8) next day
    return hour >= settings.muteTimeStart || hour < settings.muteTimeEnd;
  }
};

/**
 * Preload all sound files
 */
export const preloadSounds = (): void => {
  if (typeof window === 'undefined') return;

  const soundTypes: SoundType[] = ['default', 'transaction', 'price', 'system', 'volume'];

  soundTypes.forEach(type => {
    const audio = new Audio(`/sounds/notification-${type}.mp3`);
    audio.preload = 'auto';
    soundCache[type] = audio;
  });
};

/**
 * Play a notification sound
 */
export const playSound = (type: SoundType = 'default'): void => {
  if (typeof window === 'undefined') return;

  // Check settings
  const settings = getSoundSettings();
  if (!settings.enabled || !settings.enabledSounds[type] || shouldMute()) {
    return;
  }

  try {
    // Get or create the audio element
    let sound = soundCache[type];

    if (!sound) {
      sound = new Audio(`/sounds/notification-${type}.mp3`);
      soundCache[type] = sound;
    }

    // Reset to beginning (in case it was already playing)
    sound.currentTime = 0;
    sound.volume = settings.volume;

    // Play the sound
    sound.play().catch(error => {
      console.error(`Failed to play sound (${type}):`, error);
    });
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};

/**
 * Play a test sound
 */
export const playTestSound = (type: SoundType = 'default', volume: number = 0.7): void => {
  if (typeof window === 'undefined') return;

  try {
    const sound = new Audio(`/sounds/notification-${type}.mp3`);
    sound.volume = volume;
    sound.play().catch(error => {
      console.error(`Failed to play test sound (${type}):`, error);
    });
  } catch (error) {
    console.error('Failed to play test sound:', error);
  }
};

// Initialize by preloading sounds
if (typeof window !== 'undefined') {
  window.addEventListener('load', preloadSounds);
}
