"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  MobileDevice,
  getMobileDevices,
  saveMobileDevice,
  removeMobileDevice
} from '@/lib/real-time-data';

interface MobileNotificationsProps {
  onDevicesUpdated?: () => void;
}

export default function MobileNotifications({ onDevicesUpdated }: MobileNotificationsProps) {
  const [devices, setDevices] = useState<MobileDevice[]>([]);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState<Partial<MobileDevice>>({
    name: '',
    token: '',
    enabled: true
  });

  // Load devices on mount
  useEffect(() => {
    const mobileDevices = getMobileDevices();
    setDevices(mobileDevices);
  }, []);

  // Handle adding a new device
  const handleAddDevice = () => {
    if (!newDevice.name || !newDevice.token) return;

    const device: MobileDevice = {
      id: `device-${Date.now()}`,
      name: newDevice.name,
      token: newDevice.token,
      enabled: true
    };

    saveMobileDevice(device);
    setDevices([...devices, device]);
    setNewDevice({ name: '', token: '', enabled: true });
    setShowAddDevice(false);

    if (onDevicesUpdated) onDevicesUpdated();
  };

  // Handle removing a device
  const handleRemoveDevice = (deviceId: string) => {
    removeMobileDevice(deviceId);
    setDevices(devices.filter(d => d.id !== deviceId));

    if (onDevicesUpdated) onDevicesUpdated();
  };

  // Handle toggling a device enabled state
  const handleToggleDevice = (deviceId: string) => {
    const updatedDevices = devices.map(device => {
      if (device.id === deviceId) {
        const updatedDevice = { ...device, enabled: !device.enabled };
        saveMobileDevice(updatedDevice);
        return updatedDevice;
      }
      return device;
    });

    setDevices(updatedDevices);
    if (onDevicesUpdated) onDevicesUpdated();
  };

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg uppercase font-mono">MOBILE NOTIFICATIONS</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-mono"
            onClick={() => setShowQRCode(!showQRCode)}
          >
            {showQRCode ? 'HIDE QR' : 'SHOW QR'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs font-mono"
            onClick={() => setShowAddDevice(!showAddDevice)}
          >
            {showAddDevice ? 'CANCEL' : 'ADD DEVICE'}
          </Button>
        </div>
      </div>

      {/* QR Code Section */}
      {showQRCode && (
        <div className="border border-white/10 p-4 mb-4 text-center">
          <div className="text-xs mb-2">SCAN QR CODE WITH D-UNIX MOBILE APP</div>
          <div className="bg-white p-6 inline-block mx-auto">
            {/* This would be an actual QR code in a real implementation */}
            <div className="w-48 h-48 bg-black grid grid-cols-5 grid-rows-5">
              {/* Simulate QR code pattern */}
              <div className="col-span-1 row-span-1 bg-white"></div>
              <div className="col-span-3 row-span-1 bg-white"></div>
              <div className="col-span-1 row-span-1 bg-white"></div>
              <div className="col-span-1 row-span-3 bg-white"></div>
              <div className="col-span-3 row-span-3 grid grid-cols-3 grid-rows-3">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className={`${Math.random() > 0.5 ? 'bg-white' : 'bg-black'}`}></div>
                ))}
              </div>
              <div className="col-span-1 row-span-3 bg-white"></div>
              <div className="col-span-1 row-span-1 bg-white"></div>
              <div className="col-span-3 row-span-1 bg-white"></div>
              <div className="col-span-1 row-span-1 bg-white"></div>
            </div>
          </div>
          <div className="text-xs mt-2 opacity-70">App Store / Play Store Download Links</div>
          <div className="mt-4 flex justify-center space-x-4">
            <button className="px-4 py-2 border border-white/20 text-xs">APP STORE</button>
            <button className="px-4 py-2 border border-white/20 text-xs">PLAY STORE</button>
          </div>
        </div>
      )}

      {/* Add Device Form */}
      {showAddDevice && (
        <div className="border border-white/10 p-4 mb-4">
          <div className="text-xs mb-4">ADD NEW MOBILE DEVICE</div>
          <div className="space-y-3">
            <div>
              <div className="text-xs mb-1">DEVICE NAME</div>
              <input
                type="text"
                value={newDevice.name}
                onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })}
                placeholder="e.g. iPhone 15 Pro"
                className="w-full bg-black border border-white/20 p-2 text-sm"
              />
            </div>
            <div>
              <div className="text-xs mb-1">DEVICE TOKEN</div>
              <div className="flex">
                <input
                  type="text"
                  value={newDevice.token}
                  onChange={(e) => setNewDevice({ ...newDevice, token: e.target.value })}
                  placeholder="Paste device token here"
                  className="flex-1 bg-black border border-white/20 p-2 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2 text-xs"
                  onClick={() => setNewDevice({ ...newDevice, token: `fcm-${Math.random().toString(36).substring(2, 15)}` })}
                >
                  GENERATE
                </Button>
              </div>
              <div className="text-xs mt-1 opacity-70">
                In a real app, this would be provided by the mobile app after installation
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-xs font-mono"
                onClick={handleAddDevice}
                disabled={!newDevice.name || !newDevice.token}
              >
                ADD DEVICE
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Device List */}
      <div>
        <div className="text-xs mb-2">REGISTERED DEVICES</div>
        {devices.length === 0 ? (
          <div className="text-center py-8 border border-white/10 text-white/50">
            No mobile devices registered
          </div>
        ) : (
          <div className="space-y-2">
            {devices.map(device => (
              <div
                key={device.id}
                className={`border ${device.enabled ? 'border-white/20' : 'border-white/5'} p-3 ${
                  device.enabled ? 'bg-black/40' : 'bg-black'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-mono">{device.name}</div>
                    <div className="text-xs opacity-70 mt-1 truncate max-w-xs">
                      Token: {device.token.substring(0, 15)}...
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className={`px-2 py-1 text-xs font-mono border ${
                        device.enabled ? 'border-[#4caf50] text-[#4caf50]' : 'border-[#f44336] text-[#f44336]'
                      }`}
                      onClick={() => handleToggleDevice(device.id)}
                    >
                      {device.enabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono text-[#f44336] border-[#f44336]"
                      onClick={() => handleRemoveDevice(device.id)}
                    >
                      REMOVE
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs opacity-70">
        <p>
          Push notifications allow you to receive alerts on your mobile device when significant volume
          changes occur, even when you're away from the D-UNIX platform.
        </p>
        <p className="mt-2">
          Install the D-UNIX mobile app, scan the QR code, and stay informed about market movements on the go.
        </p>
      </div>
    </div>
  );
}
