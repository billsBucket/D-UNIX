"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VolumeAlert, getRealTimeData, markAlertAsRead, clearAllAlerts, updateAlertSettings } from '@/lib/real-time-data';

interface VolumeAlertsProps {
  limit?: number;
}

export default function VolumeAlerts({ limit = 5 }: VolumeAlertsProps) {
  const [alerts, setAlerts] = useState<VolumeAlert[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState({
    alertThreshold: 5.0,
    alertEnabled: true
  });
  const [showSettings, setShowSettings] = useState(false);

  // Get alerts from real-time data
  useEffect(() => {
    const updateAlerts = () => {
      const data = getRealTimeData();
      setAlerts(data.alerts);
      setUnreadCount(data.alerts.filter(alert => !alert.read).length);
      setSettings({
        alertThreshold: data.settings.alertThreshold,
        alertEnabled: data.settings.alertEnabled
      });
    };

    // Initial update
    updateAlerts();

    // Set up interval to update alerts
    const intervalId = setInterval(updateAlerts, 5000);

    return () => clearInterval(intervalId);
  }, []);

  // Handle marking an alert as read
  const handleMarkAsRead = (alertId: string) => {
    markAlertAsRead(alertId);
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Handle clearing all alerts
  const handleClearAll = () => {
    clearAllAlerts();
    setAlerts([]);
    setUnreadCount(0);
  };

  // Handle threshold change
  const handleThresholdChange = (value: number) => {
    const newSettings = { ...settings, alertThreshold: value };
    setSettings(newSettings);
    updateAlertSettings(newSettings);
  };

  // Handle enabling/disabling alerts
  const handleToggleAlerts = () => {
    const newSettings = { ...settings, alertEnabled: !settings.alertEnabled };
    setSettings(newSettings);
    updateAlertSettings(newSettings);
  };

  // Display only unread alerts if not showing all
  const visibleAlerts = showAll ? alerts : alerts.filter(alert => !alert.read);

  // Limit the number of alerts displayed
  const displayedAlerts = expanded
    ? visibleAlerts
    : visibleAlerts.slice(0, limit);

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg uppercase font-mono">VOLUME ALERTS</h2>
          {unreadCount > 0 && (
            <div className="ml-2 px-2 py-0.5 bg-white/10 text-xs rounded">
              {unreadCount} NEW
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 text-xs font-mono"
            onClick={() => setShowSettings(!showSettings)}
          >
            SETTINGS
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 text-xs font-mono"
            onClick={handleClearAll}
          >
            CLEAR ALL
          </Button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-4 border border-white/10 p-3">
          <div className="text-xs uppercase font-mono mb-2">ALERT SETTINGS</div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs">Alert Threshold (%)</div>
            <div className="flex items-center space-x-2">
              {[1, 3, 5, 10, 15].map(value => (
                <Button
                  key={value}
                  variant="outline"
                  size="sm"
                  className={`px-2 py-0.5 text-xs font-mono ${
                    settings.alertThreshold === value ? 'bg-white/20' : 'bg-black'
                  }`}
                  onClick={() => handleThresholdChange(value)}
                >
                  {value}%
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs">Alerts Enabled</div>
            <Button
              variant="outline"
              size="sm"
              className={`px-2 py-0.5 text-xs font-mono ${
                settings.alertEnabled ? 'bg-[#4caf50]/20 text-[#4caf50]' : 'bg-[#f44336]/20 text-[#f44336]'
              }`}
              onClick={handleToggleAlerts}
            >
              {settings.alertEnabled ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {displayedAlerts.length > 0 ? (
        <div className="space-y-2">
          {displayedAlerts.map(alert => (
            <div
              key={alert.id}
              className={`border ${alert.read ? 'border-white/5' : 'border-white/20'} p-3 ${
                alert.read ? 'bg-black' : 'bg-black/40'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div
                    className={`w-2 h-2 rounded-full mr-2 ${
                      alert.isPositive ? 'bg-[#4caf50]' : 'bg-[#f44336]'
                    } ${!alert.read && 'animate-pulse'}`}
                  ></div>
                  <div className="text-sm font-mono">{alert.chainName}</div>
                </div>
                <div className="text-xs opacity-70">{formatTime(alert.timestamp)}</div>
              </div>
              <div className="mt-1">
                <div className="text-xs">
                  {alert.message}
                </div>
                <div className={`text-sm font-mono mt-1 ${
                  alert.isPositive ? 'text-[#4caf50]' : 'text-[#f44336]'
                }`}>
                  Volume: {alert.formattedVolume} ({alert.isPositive ? '+' : ''}{alert.changePercent.toFixed(1)}%)
                </div>
              </div>
              {!alert.read && (
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2 py-0.5 text-xs"
                    onClick={() => handleMarkAsRead(alert.id)}
                  >
                    DISMISS
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-sm opacity-70">
          {alerts.length === 0
            ? 'No volume alerts to display'
            : 'No unread alerts to display'}
        </div>
      )}

      {/* Show more/less controls */}
      {visibleAlerts.length > limit && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 text-xs font-mono"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'SHOW LESS' : `SHOW ${visibleAlerts.length - limit} MORE`}
          </Button>
        </div>
      )}

      {/* Toggle read/unread filter */}
      {alerts.length > 0 && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 text-xs font-mono"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'SHOW UNREAD ONLY' : 'SHOW ALL ALERTS'}
          </Button>
        </div>
      )}
    </div>
  );
}
