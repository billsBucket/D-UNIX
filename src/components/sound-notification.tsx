"use client";

import React, { useEffect, useRef, useState } from 'react';
import { getSoundSettings, updateSoundSettings, playTestSound, AlertSeverity } from '@/lib/real-time-data';

// Audio files for notifications
const AUDIO_FILES = {
  beep: '/sounds/beep.mp3',
  chime: '/sounds/chime.mp3',
  alert: '/sounds/alert.mp3',
  notification: '/sounds/notification.mp3'
};

interface SoundNotificationProps {
  // Optional callback when sound settings are updated
  onSettingsUpdated?: () => void;
}

export default function SoundNotification({ onSettingsUpdated }: SoundNotificationProps) {
  // Get audio references for each sound type
  const audioRefs = {
    beep: useRef<HTMLAudioElement | null>(null),
    chime: useRef<HTMLAudioElement | null>(null),
    alert: useRef<HTMLAudioElement | null>(null),
    notification: useRef<HTMLAudioElement | null>(null),
  };

  // State for sound settings
  const [settings, setSettings] = useState({
    enabled: true,
    volume: 0.7,
    soundType: 'notification' as 'beep' | 'chime' | 'alert' | 'notification',
    playSoundForSeverity: AlertSeverity.High,
    muteTimeStart: 22,
    muteTimeEnd: 8,
  });

  // Load settings on mount
  useEffect(() => {
    const soundSettings = getSoundSettings();
    setSettings(soundSettings);
  }, []);

  // Handle toggling sound enabled/disabled
  const handleToggleSound = () => {
    const newSettings = { ...settings, enabled: !settings.enabled };
    setSettings(newSettings);
    updateSoundSettings(newSettings);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    const newSettings = { ...settings, volume };
    setSettings(newSettings);
    updateSoundSettings(newSettings);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  // Handle sound type change
  const handleSoundTypeChange = (type: 'beep' | 'chime' | 'alert' | 'notification') => {
    const newSettings = { ...settings, soundType: type };
    setSettings(newSettings);
    updateSoundSettings(newSettings);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  // Handle severity level change
  const handleSeverityChange = (severity: AlertSeverity) => {
    const newSettings = { ...settings, playSoundForSeverity: severity };
    setSettings(newSettings);
    updateSoundSettings(newSettings);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  // Handle mute time change
  const handleMuteTimeChange = (isStart: boolean, hour: number) => {
    const newSettings = {
      ...settings,
      [isStart ? 'muteTimeStart' : 'muteTimeEnd']: hour
    };
    setSettings(newSettings);
    updateSoundSettings(newSettings);
    if (onSettingsUpdated) onSettingsUpdated();
  };

  // Play test sound
  const handlePlayTest = () => {
    if (settings.enabled) {
      // Play the selected sound type
      const audioRef = audioRefs[settings.soundType];
      if (audioRef.current) {
        audioRef.current.volume = settings.volume;
        audioRef.current.play();
      }

      // Also call the API method (which in a real app would also play the sound)
      playTestSound();
    }
  };

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg uppercase font-mono">SOUND NOTIFICATIONS</h2>
        <button
          className={`px-2 py-1 text-xs font-mono border ${
            settings.enabled ? 'border-[#4caf50] text-[#4caf50]' : 'border-[#f44336] text-[#f44336]'
          }`}
          onClick={handleToggleSound}
        >
          {settings.enabled ? 'ENABLED' : 'DISABLED'}
        </button>
      </div>

      {/* Sound Settings */}
      <div className="space-y-4">
        {/* Volume Control */}
        <div className="flex items-center">
          <div className="w-1/3 text-xs">VOLUME</div>
          <div className="w-2/3 flex items-center">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.volume}
              onChange={handleVolumeChange}
              className="w-full mr-2"
              disabled={!settings.enabled}
            />
            <div className="text-xs w-10">{Math.round(settings.volume * 100)}%</div>
          </div>
        </div>

        {/* Sound Type */}
        <div>
          <div className="text-xs mb-2">SOUND TYPE</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(AUDIO_FILES).map((type) => (
              <button
                key={type}
                className={`px-2 py-1 text-xs font-mono border ${
                  settings.soundType === type ? 'bg-white/20' : 'bg-black'
                }`}
                onClick={() => handleSoundTypeChange(type as any)}
                disabled={!settings.enabled}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Minimum Severity */}
        <div>
          <div className="text-xs mb-2">MINIMUM SEVERITY</div>
          <div className="flex flex-wrap gap-2">
            {Object.values(AlertSeverity).map((severity) => (
              <button
                key={severity}
                className={`px-2 py-1 text-xs font-mono border ${
                  settings.playSoundForSeverity === severity
                    ? 'bg-white/20'
                    : 'bg-black'
                } ${
                  severity === AlertSeverity.Critical
                    ? 'border-[#f44336] text-[#f44336]'
                    : severity === AlertSeverity.High
                    ? 'border-[#ff9800] text-[#ff9800]'
                    : severity === AlertSeverity.Medium
                    ? 'border-[#f0b90b] text-[#f0b90b]'
                    : 'border-[#4caf50] text-[#4caf50]'
                }`}
                onClick={() => handleSeverityChange(severity)}
                disabled={!settings.enabled}
              >
                {severity.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <div className="text-xs mb-2">QUIET HOURS (NO SOUNDS)</div>
          <div className="flex items-center gap-2">
            <span className="text-xs">FROM</span>
            <select
              value={settings.muteTimeStart}
              onChange={(e) => handleMuteTimeChange(true, parseInt(e.target.value))}
              className="bg-black border border-white/20 text-xs p-1"
              disabled={!settings.enabled}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
            <span className="text-xs">TO</span>
            <select
              value={settings.muteTimeEnd}
              onChange={(e) => handleMuteTimeChange(false, parseInt(e.target.value))}
              className="bg-black border border-white/20 text-xs p-1"
              disabled={!settings.enabled}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Test Sound Button */}
        <div className="text-center pt-2">
          <button
            className="px-4 py-2 bg-black border border-white/20 text-xs font-mono"
            onClick={handlePlayTest}
            disabled={!settings.enabled}
          >
            TEST SOUND
          </button>
        </div>
      </div>

      {/* Hidden audio elements for each sound */}
      <audio
        ref={audioRefs.beep}
        src={AUDIO_FILES.beep}
        preload="auto"
      />
      <audio
        ref={audioRefs.chime}
        src={AUDIO_FILES.chime}
        preload="auto"
      />
      <audio
        ref={audioRefs.alert}
        src={AUDIO_FILES.alert}
        preload="auto"
      />
      <audio
        ref={audioRefs.notification}
        src={AUDIO_FILES.notification}
        preload="auto"
      />
    </div>
  );
}
