"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { getRealTimeData, markAlertAsRead } from '@/lib/real-time-data';
import { VolumeAlert } from '@/lib/real-time-data';

export default function AlertBell() {
  const [alerts, setAlerts] = useState<VolumeAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get alerts from real-time data
  useEffect(() => {
    const updateAlerts = () => {
      const data = getRealTimeData();
      setAlerts(data.alerts);
      setUnreadCount(data.alerts.filter(alert => !alert.read).length);
    };

    // Initial update
    updateAlerts();

    // Set up interval to update alerts
    const intervalId = setInterval(updateAlerts, 3000);

    return () => clearInterval(intervalId);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle marking an alert as read
  const handleMarkAsRead = (alertId: string) => {
    markAlertAsRead(alertId);
    setAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Format time
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="w-8 h-8 p-0 flex items-center justify-center relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${unreadCount > 0 ? 'animate-pulse' : ''}`}
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#f44336] text-white text-[10px] flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto z-50 bg-black border border-white/20 shadow-lg">
          <div className="p-3 border-b border-white/10">
            <div className="flex justify-between items-center">
              <div className="text-sm font-mono">VOLUME ALERTS</div>
              <div className="text-xs opacity-70">
                {unreadCount} unread
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {alerts.length > 0 ? (
              <div>
                {alerts.slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className={`p-3 border-b border-white/5 ${
                      alert.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div
                          className={`w-2 h-2 rounded-full mr-2 ${
                            alert.isPositive ? 'bg-[#4caf50]' : 'bg-[#f44336]'
                          } ${!alert.read && 'animate-pulse'}`}
                        ></div>
                        <div className="text-xs font-mono">{alert.chainName}</div>
                      </div>
                      <div className="text-xs opacity-70">{formatTime(alert.timestamp)}</div>
                    </div>
                    <div className="mt-1 text-xs">
                      {alert.timeframe === '1h' ? 'Hourly' : '24h'} volume {alert.isPositive ? 'up' : 'down'} {Math.abs(alert.changePercent).toFixed(1)}%
                    </div>
                    {!alert.read && (
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2 py-0.5 text-[10px]"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(alert.id);
                          }}
                        >
                          DISMISS
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs opacity-70">
                No alerts to display
              </div>
            )}
          </div>

          <div className="p-2 border-t border-white/10">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/analytics'; // Navigate to analytics page
              }}
            >
              VIEW ALL ALERTS
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
