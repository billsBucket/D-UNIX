"use client";

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getSoundSettings, saveSoundSettings, playTestSound, SoundType, SoundSettings } from '@/lib/sound-manager';
import { Volume2, Volume1, VolumeX, Bell } from 'lucide-react';

export default function SoundSettingsPanel() {
  const [settings, setSettings] = useState<SoundSettings>(getSoundSettings());
  const [selectedTestSound, setSelectedTestSound] = useState<SoundType>('default');

  // Load settings on mount
  useEffect(() => {
    setSettings(getSoundSettings());
  }, []);

  // Handle toggling sound enabled
  const handleToggleEnabled = (enabled: boolean) => {
    const newSettings = { ...settings, enabled };
    setSettings(newSettings);
    saveSoundSettings(newSettings);
  };

  // Handle changing volume
  const handleVolumeChange = (value: number[]) => {
    const newSettings = { ...settings, volume: value[0] };
    setSettings(newSettings);
    saveSoundSettings(newSettings);
  };

  // Handle toggling specific sound types
  const handleToggleSoundType = (type: SoundType, enabled: boolean) => {
    const newSettings = {
      ...settings,
      enabledSounds: {
        ...settings.enabledSounds,
        [type]: enabled
      }
    };
    setSettings(newSettings);
    saveSoundSettings(newSettings);
  };

  // Handle changing mute times
  const handleMuteTimeChange = (startOrEnd: 'start' | 'end', value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < 0 || numValue > 23) return;

    const newSettings = {
      ...settings,
      muteTimeStart: startOrEnd === 'start' ? numValue : settings.muteTimeStart,
      muteTimeEnd: startOrEnd === 'end' ? numValue : settings.muteTimeEnd
    };

    setSettings(newSettings);
    saveSoundSettings(newSettings);
  };

  // Handle testing a sound
  const handleTestSound = () => {
    playTestSound(selectedTestSound, settings.volume);
  };

  // Format hour for display (24h format with leading zero)
  const formatHour = (hour: number) => {
    return hour.toString().padStart(2, '0') + ':00';
  };

  // Sound type labels for display
  const soundTypeLabels: Record<SoundType, string> = {
    default: 'Default Notification',
    transaction: 'Transaction Completed',
    price: 'Price Alert',
    system: 'System Notification',
    volume: 'Volume Alert'
  };

  return (
    <Card className="w-full max-w-md bg-black border border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Sound Settings
        </CardTitle>
        <CardDescription>
          Customize notification sounds and alerts
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main sound toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="sound-enabled" className="flex items-center gap-2">
            {settings.enabled ?
              <Volume2 className="h-5 w-5" /> :
              <VolumeX className="h-5 w-5 text-muted-foreground" />
            }
            Enable notification sounds
          </Label>
          <Switch
            id="sound-enabled"
            checked={settings.enabled}
            onCheckedChange={handleToggleEnabled}
          />
        </div>

        {/* Volume slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Volume1 className="h-5 w-5" />
              Volume
            </Label>
            <span className="text-sm text-muted-foreground">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>
          <Slider
            disabled={!settings.enabled}
            value={[settings.volume]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
          />
        </div>

        {/* Quiet hours */}
        <div className="space-y-2">
          <Label className="block">Quiet Hours (No sounds)</Label>
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="mute-start" className="text-xs">From</Label>
                <Select
                  disabled={!settings.enabled}
                  value={settings.muteTimeStart.toString()}
                  onValueChange={(value) => handleMuteTimeChange('start', value)}
                >
                  <SelectTrigger id="mute-start" className="w-full">
                    <SelectValue placeholder="Start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 24}).map((_, i) => (
                      <SelectItem key={`start-${i}`} value={i.toString()}>
                        {formatHour(i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="mute-end" className="text-xs">To</Label>
                <Select
                  disabled={!settings.enabled}
                  value={settings.muteTimeEnd.toString()}
                  onValueChange={(value) => handleMuteTimeChange('end', value)}
                >
                  <SelectTrigger id="mute-end" className="w-full">
                    <SelectValue placeholder="End time" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({length: 24}).map((_, i) => (
                      <SelectItem key={`end-${i}`} value={i.toString()}>
                        {formatHour(i)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Sound type toggles */}
        <div className="space-y-3">
          <Label className="block">Notification Sounds</Label>
          {(Object.keys(settings.enabledSounds) as SoundType[]).map(type => (
            <div key={type} className="flex items-center justify-between">
              <Label htmlFor={`sound-${type}`} className="flex-1 cursor-pointer">
                {soundTypeLabels[type]}
              </Label>
              <Switch
                id={`sound-${type}`}
                checked={settings.enabledSounds[type] && settings.enabled}
                disabled={!settings.enabled}
                onCheckedChange={(checked) => handleToggleSoundType(type, checked)}
              />
            </div>
          ))}
        </div>

        {/* Test sound */}
        <div className="space-y-2">
          <Label className="block">Test Sound</Label>
          <div className="flex gap-2">
            <Select
              disabled={!settings.enabled}
              value={selectedTestSound}
              onValueChange={(value) => setSelectedTestSound(value as SoundType)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select sound type" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(settings.enabledSounds) as SoundType[]).map(type => (
                  <SelectItem key={type} value={type}>
                    {soundTypeLabels[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!settings.enabled}
              variant="outline"
              onClick={handleTestSound}
            >
              Play
            </Button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Changes are saved automatically
        </p>
      </CardFooter>
    </Card>
  );
}
