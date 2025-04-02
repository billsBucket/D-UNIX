"use client";

import React, { useState, useEffect } from 'react';
import Navbar from "@/components/navbar";
import AppSkeleton from "@/components/app-skeleton";
import { Button } from '@/components/ui/button';
import AlertRules from '@/components/alert-rules';
import SoundNotification from '@/components/sound-notification';
import MobileNotifications from '@/components/mobile-notifications';
import VolumeAlerts from '@/components/volume-alerts';
import TokenPriceAlerts from '@/components/token-price-alerts';
import AlertHistoryAnalytics from '@/components/alert-history-analytics';
import ExternalIntegrationsManager from '@/components/external-integrations-manager';
import PatternDetection from '@/components/pattern-detection';
import { initializeRealTimeData } from '@/lib/real-time-data';
import { initializeSamplePriceAlerts } from '@/lib/token-price-alert';
import { initializeSampleIntegrations } from '@/lib/external-integrations';
import SoundSettingsPanel from '@/components/sound-settings';

// Define tabs
type AlertTab = 'alerts' | 'rules' | 'sound' | 'mobile' | 'price-alerts' | 'analytics' | 'integrations' | 'patterns';

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<AlertTab>('alerts');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize all alert subsystems
  useEffect(() => {
    // Start the real-time data service
    const cleanup = initializeRealTimeData();

    // Initialize sample price alerts for the demo
    initializeSamplePriceAlerts();

    // Initialize sample external integrations for the demo
    initializeSampleIntegrations();

    setIsInitialized(true);

    return () => {
      cleanup();
    };
  }, []);

  // Handle tab change
  const handleTabChange = (tab: AlertTab) => {
    setActiveTab(tab);
  };

  return (
    <AppSkeleton>
      <main className="min-h-screen bg-black text-white">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-mono mb-2">ALERTS</h1>
            <p className="text-white/60">Manage your alerts and notifications</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alert settings section */}
            <div>
              <h1 className="text-3xl font-mono uppercase tracking-widest border-b border-white/10 pb-3 mb-6">ALERT SETTINGS</h1>

              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
                <Button
                  variant="outline"
                  className={`text-xs font-mono ${activeTab === 'alerts' ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => handleTabChange('alerts')}
                >
                  RECENT ALERTS
                </Button>
                <Button
                  variant="outline"
                  className={`text-xs font-mono ${activeTab === 'price-alerts' ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => handleTabChange('price-alerts')}
                >
                  PRICE ALERTS
                </Button>
                <Button
                  variant="outline"
                  className={`text-xs font-mono ${activeTab === 'patterns' ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => handleTabChange('patterns')}
                >
                  PATTERN DETECTION
                </Button>
                <Button
                  variant="outline"
                  className={`text-xs font-mono ${activeTab === 'analytics' ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => handleTabChange('analytics')}
                >
                  ALERT ANALYTICS
                </Button>
                <Button
                  variant="outline"
                  className={`text-xs font-mono ${activeTab === 'rules' ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => handleTabChange('rules')}
                >
                  ALERT RULES
                </Button>
                <Button
                  variant="outline"
                  className={`text-xs font-mono ${activeTab === 'integrations' ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => handleTabChange('integrations')}
                >
                  EXTERNAL INTEGRATIONS
                </Button>
                <Button
                  variant="outline"
                  className={`text-xs font-mono ${activeTab === 'sound' ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => handleTabChange('sound')}
                >
                  SOUND NOTIFICATIONS
                </Button>
                <Button
                  variant="outline"
                  className={`text-xs font-mono ${activeTab === 'mobile' ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => handleTabChange('mobile')}
                >
                  MOBILE NOTIFICATIONS
                </Button>
              </div>

              {/* Alert Content Area */}
              <div className="space-y-6">
                {!isInitialized && (
                  <div className="text-center py-12 text-white/50">
                    Initializing alert system...
                  </div>
                )}

                {isInitialized && (
                  <>
                    {activeTab === 'alerts' && (
                      <div>
                        <div className="text-xl font-mono uppercase mb-4">Recent Volume Alerts</div>
                        <VolumeAlerts limit={10} />
                      </div>
                    )}

                    {activeTab === 'price-alerts' && (
                      <div>
                        <div className="text-xl font-mono uppercase mb-4">Token Price Alerts</div>
                        <TokenPriceAlerts />
                      </div>
                    )}

                    {activeTab === 'patterns' && (
                      <div>
                        <div className="text-xl font-mono uppercase mb-4">Pattern Detection</div>
                        <PatternDetection />
                      </div>
                    )}

                    {activeTab === 'analytics' && (
                      <div>
                        <div className="text-xl font-mono uppercase mb-4">Alert History & Analytics</div>
                        <AlertHistoryAnalytics />
                      </div>
                    )}

                    {activeTab === 'rules' && (
                      <div>
                        <div className="mb-6">
                          <div className="text-xl font-mono uppercase mb-1">Alert Rules</div>
                          <div className="text-sm opacity-70 mb-4">
                            Customize which events trigger alerts and how you want to be notified about them
                          </div>
                          <AlertRules />
                        </div>
                      </div>
                    )}

                    {activeTab === 'integrations' && (
                      <div>
                        <div className="text-xl font-mono uppercase mb-4">External Integrations</div>
                        <ExternalIntegrationsManager />
                      </div>
                    )}

                    {activeTab === 'sound' && (
                      <div>
                        <div className="text-xl font-mono uppercase mb-1">Sound Notification Settings</div>
                        <div className="text-sm opacity-70 mb-4">
                          Configure how and when sound alerts play when important events occur
                        </div>
                        <SoundNotification />
                      </div>
                    )}

                    {activeTab === 'mobile' && (
                      <div>
                        <div className="text-xl font-mono uppercase mb-1">Mobile Push Notifications</div>
                        <div className="text-sm opacity-70 mb-4">
                          Register mobile devices to receive push notifications when you're away from the platform
                        </div>
                        <MobileNotifications />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Sound settings section */}
            <div>
              <h2 className="text-xl font-mono mb-4">NOTIFICATION SOUNDS</h2>
              <SoundSettingsPanel />
            </div>
          </div>

          {/* Status Indicator */}
          <div className="mt-8 border-t border-white/10 pt-4 flex justify-between items-center">
            <div className="text-xs opacity-70">
              Alert system status: {isInitialized ? (
                <span className="text-[#4caf50]">OPERATIONAL</span>
              ) : (
                <span className="text-[#f44336]">INITIALIZING</span>
              )}
            </div>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${isInitialized ? 'bg-[#4caf50]' : 'bg-[#f44336]'} ${isInitialized && 'animate-pulse'}`}></div>
              <div className="text-xs opacity-70">
                {isInitialized ? 'LIVE MONITORING' : 'STARTING UP'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppSkeleton>
  );
}
