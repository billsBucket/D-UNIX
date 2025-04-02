"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCategory, AlertSeverity } from '@/lib/real-time-data';

// Pattern detection types
export enum PatternType {
  VolumeSpike = 'volume_spike',
  PriceReversal = 'price_reversal',
  MomentumBuildup = 'momentum_buildup',
  Support = 'support_level',
  Resistance = 'resistance_level',
  BullishDivergence = 'bullish_divergence',
  BearishDivergence = 'bearish_divergence',
  VolatilityContraction = 'volatility_contraction',
  VolatilityExpansion = 'volatility_expansion',
}

// Pattern filter settings
interface PatternFilter {
  id: string;
  name: string;
  type: PatternType;
  enabled: boolean;
  chainIds: number[];
  sensitivity: number; // 1-10 scale: higher = more sensitive detection
  lookbackPeriod: number; // How many data points to analyze
  minimumConfidence: number; // 0-100%: threshold for detection confidence
  alertSettings: {
    severity: AlertSeverity;
    notify: boolean;
    notifyExternally: boolean;
  };
}

// Mock detected pattern information
interface DetectedPattern {
  id: string;
  patternType: PatternType;
  chainId: number;
  chainName: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  confidence: number;
  timestamp: number;
  description: string;
  dataPoints: {
    timestamp: number;
    value: number;
  }[];
  read: boolean;
}

// Common chains (for selection dropdowns)
const COMMON_CHAINS = [
  { id: 1, name: 'Ethereum' },
  { id: 42161, name: 'Arbitrum' },
  { id: 137, name: 'Polygon' },
  { id: 10, name: 'Optimism' },
  { id: 56, name: 'BNB Chain' },
  { id: 8453, name: 'Base' },
  { id: 43114, name: 'Avalanche' },
];

export default function PatternDetection() {
  const [patternFilters, setPatternFilters] = useState<PatternFilter[]>([]);
  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[]>([]);
  const [activeTab, setActiveTab] = useState<'filters' | 'patterns'>('filters');
  const [showAddForm, setShowAddForm] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Form state for adding a new filter
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<PatternType>(PatternType.VolumeSpike);
  const [formSensitivity, setFormSensitivity] = useState(5);
  const [formLookback, setFormLookback] = useState(24);
  const [formConfidence, setFormConfidence] = useState(70);
  const [formChains, setFormChains] = useState<number[]>([1]); // Default to Ethereum
  const [formSeverity, setFormSeverity] = useState<AlertSeverity>(AlertSeverity.Medium);
  const [formNotify, setFormNotify] = useState(true);
  const [formExternal, setFormExternal] = useState(false);

  // Initialize with some pattern filters and simulated detections
  useEffect(() => {
    // Setup default filters
    const defaultFilters: PatternFilter[] = [
      {
        id: 'pattern-1',
        name: 'Volume Spike Detector',
        type: PatternType.VolumeSpike,
        enabled: true,
        chainIds: [1, 42161], // Ethereum and Arbitrum
        sensitivity: 7,
        lookbackPeriod: 24,
        minimumConfidence: 75,
        alertSettings: {
          severity: AlertSeverity.Medium,
          notify: true,
          notifyExternally: false,
        }
      },
      {
        id: 'pattern-2',
        name: 'Support Level Detection',
        type: PatternType.Support,
        enabled: true,
        chainIds: [1],
        sensitivity: 6,
        lookbackPeriod: 72,
        minimumConfidence: 80,
        alertSettings: {
          severity: AlertSeverity.Low,
          notify: true,
          notifyExternally: false,
        }
      },
      {
        id: 'pattern-3',
        name: 'Volatility Expansion Alert',
        type: PatternType.VolatilityExpansion,
        enabled: true,
        chainIds: [1, 137, 42161],
        sensitivity: 8,
        lookbackPeriod: 48,
        minimumConfidence: 65,
        alertSettings: {
          severity: AlertSeverity.High,
          notify: true,
          notifyExternally: true,
        }
      },
    ];

    setPatternFilters(defaultFilters);

    // Mock some detected patterns
    const mockDetections: DetectedPattern[] = [
      {
        id: 'detect-1',
        patternType: PatternType.VolumeSpike,
        chainId: 1,
        chainName: 'Ethereum',
        confidence: 82,
        timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
        description: 'Unusual volume increase detected on Ethereum network, 3.4x standard deviation from mean',
        dataPoints: [
          ...Array(12).fill(0).map((_, i) => ({
            timestamp: Date.now() - 1000 * 60 * 60 + (i * 1000 * 60 * 5),
            value: 100 + (i < 8 ? i * 5 : (i - 8) * 50)
          }))
        ],
        read: false
      },
      {
        id: 'detect-2',
        patternType: PatternType.Support,
        chainId: 1,
        chainName: 'Ethereum',
        tokenAddress: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
        tokenSymbol: 'ETH',
        confidence: 78,
        timestamp: Date.now() - 1000 * 60 * 120, // 2 hours ago
        description: 'ETH price approaching potential support level at $3,450',
        dataPoints: [
          ...Array(12).fill(0).map((_, i) => ({
            timestamp: Date.now() - 1000 * 60 * 240 + (i * 1000 * 60 * 20),
            value: 3500 - (i < 6 ? i * 10 : 50)
          }))
        ],
        read: true
      },
      {
        id: 'detect-3',
        patternType: PatternType.VolatilityExpansion,
        chainId: 42161,
        chainName: 'Arbitrum',
        confidence: 85,
        timestamp: Date.now() - 1000 * 60 * 15, // 15 minutes ago
        description: 'Significant increase in market volatility detected on Arbitrum',
        dataPoints: [
          ...Array(12).fill(0).map((_, i) => ({
            timestamp: Date.now() - 1000 * 60 * 60 + (i * 1000 * 60 * 5),
            value: 10 + (i < 6 ? i * 2 : Math.abs((i % 3) * 8 - 12))
          }))
        ],
        read: false
      }
    ];

    setDetectedPatterns(mockDetections);
  }, []);

  // Handle creating a new pattern filter
  const handleCreateFilter = () => {
    // Generate ID
    const newId = `pattern-${Date.now()}`;

    // Create filter object
    const newFilter: PatternFilter = {
      id: newId,
      name: formName || formatPatternType(formType),
      type: formType,
      enabled: true,
      chainIds: formChains,
      sensitivity: formSensitivity,
      lookbackPeriod: formLookback,
      minimumConfidence: formConfidence,
      alertSettings: {
        severity: formSeverity,
        notify: formNotify,
        notifyExternally: formExternal,
      }
    };

    // Add to filters
    setPatternFilters([...patternFilters, newFilter]);

    // Reset form
    resetForm();
  };

  // Reset add form
  const resetForm = () => {
    setShowAddForm(false);
    setFormName('');
    setFormType(PatternType.VolumeSpike);
    setFormSensitivity(5);
    setFormLookback(24);
    setFormConfidence(70);
    setFormChains([1]);
    setFormSeverity(AlertSeverity.Medium);
    setFormNotify(true);
    setFormExternal(false);
  };

  // Handle toggling filter enabled state
  const handleToggleFilter = (filterId: string) => {
    setPatternFilters(patternFilters.map(filter =>
      filter.id === filterId
        ? { ...filter, enabled: !filter.enabled }
        : filter
    ));
  };

  // Handle deleting a filter
  const handleDeleteFilter = (filterId: string) => {
    setPatternFilters(patternFilters.filter(filter => filter.id !== filterId));
  };

  // Handle marking pattern as read
  const handleMarkAsRead = (patternId: string) => {
    setDetectedPatterns(detectedPatterns.map(pattern =>
      pattern.id === patternId
        ? { ...pattern, read: true }
        : pattern
    ));
  };

  // Toggle chain selection
  const toggleChain = (chainId: number) => {
    if (formChains.includes(chainId)) {
      setFormChains(formChains.filter(id => id !== chainId));
    } else {
      setFormChains([...formChains, chainId]);
    }
  };

  // Format pattern type for display
  const formatPatternType = (type: PatternType): string => {
    switch(type) {
      case PatternType.VolumeSpike:
        return 'Volume Spike';
      case PatternType.PriceReversal:
        return 'Price Reversal';
      case PatternType.MomentumBuildup:
        return 'Momentum Buildup';
      case PatternType.Support:
        return 'Support Level';
      case PatternType.Resistance:
        return 'Resistance Level';
      case PatternType.BullishDivergence:
        return 'Bullish Divergence';
      case PatternType.BearishDivergence:
        return 'Bearish Divergence';
      case PatternType.VolatilityContraction:
        return 'Volatility Contraction';
      case PatternType.VolatilityExpansion:
        return 'Volatility Expansion';
      default:
        return type;
    }
  };

  // Format time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get pattern type icon/indicator
  const getPatternIcon = (type: PatternType) => {
    let bgColor = 'bg-white/20';
    let content = '•';

    switch(type) {
      case PatternType.VolumeSpike:
        bgColor = 'bg-[#2196f3]/30';
        content = '↑';
        break;
      case PatternType.PriceReversal:
        bgColor = 'bg-[#ff9800]/30';
        content = '↺';
        break;
      case PatternType.MomentumBuildup:
        bgColor = 'bg-[#9c27b0]/30';
        content = '↗';
        break;
      case PatternType.Support:
        bgColor = 'bg-[#4caf50]/30';
        content = '⊥';
        break;
      case PatternType.Resistance:
        bgColor = 'bg-[#f44336]/30';
        content = '⊤';
        break;
      case PatternType.BullishDivergence:
        bgColor = 'bg-[#4caf50]/30';
        content = '⇡';
        break;
      case PatternType.BearishDivergence:
        bgColor = 'bg-[#f44336]/30';
        content = '⇣';
        break;
      case PatternType.VolatilityContraction:
        bgColor = 'bg-[#ff9800]/30';
        content = '◆';
        break;
      case PatternType.VolatilityExpansion:
        bgColor = 'bg-[#f44336]/30';
        content = '◊';
        break;
    }

    return (
      <div className={`w-6 h-6 ${bgColor} flex items-center justify-center rounded-sm`}>
        <span className="text-xs">{content}</span>
      </div>
    );
  };

  // Render tiny line chart
  const renderMiniChart = (dataPoints: { timestamp: number; value: number }[]) => {
    if (!dataPoints.length) return null;

    const values = dataPoints.map(point => point.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;

    // Normalize values to 0-1 range for display
    const normalizedValues = values.map(v => (v - min) / (range || 1));

    return (
      <div className="h-7 w-20 flex items-end">
        {normalizedValues.map((value, index) => (
          <div
            key={index}
            className="w-full h-full flex-1 flex items-end"
          >
            <div
              className="w-1 bg-white/40"
              style={{
                height: `${Math.max(5, value * 100)}%`
              }}
            />
          </div>
        ))}
      </div>
    );
  };

  // Get unread count
  const unreadCount = detectedPatterns.filter(p => !p.read).length;

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg uppercase font-mono">PATTERN DETECTION</h2>
          {unreadCount > 0 && (
            <div className="ml-2 px-2 py-0.5 bg-white/10 text-xs rounded-sm">
              {unreadCount} NEW
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              className={`px-2 py-1 text-xs ${activeTab === 'filters' ? 'bg-white/10' : ''}`}
              onClick={() => setActiveTab('filters')}
            >
              FILTERS
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`px-2 py-1 text-xs ${activeTab === 'patterns' ? 'bg-white/10' : ''}`}
              onClick={() => setActiveTab('patterns')}
            >
              PATTERNS {unreadCount > 0 && `(${unreadCount})`}
            </Button>
          </div>
          {activeTab === 'filters' && (
            <Button
              variant="outline"
              size="sm"
              className="px-2 py-1 text-xs font-mono"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? 'CANCEL' : 'ADD FILTER'}
            </Button>
          )}
        </div>
      </div>

      {/* Add Filter Form */}
      {activeTab === 'filters' && showAddForm && (
        <div className="mb-6 p-4 border border-white/10 bg-black/30">
          <h3 className="text-sm uppercase font-mono mb-4">Add Pattern Detection Filter</h3>

          {/* Filter Name */}
          <div className="mb-4">
            <label className="block text-xs mb-2">Filter Name</label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="My Pattern Filter"
              className="bg-black border-white/20"
            />
            <div className="text-xs mt-1 opacity-60">
              Leave blank to use pattern type as name
            </div>
          </div>

          {/* Pattern Type */}
          <div className="mb-4">
            <label className="block text-xs mb-2">Pattern Type</label>
            <Select
              value={formType}
              onValueChange={(value) => setFormType(value as PatternType)}
            >
              <SelectTrigger className="bg-black border-white/20">
                <SelectValue placeholder="Select pattern type" />
              </SelectTrigger>
              <SelectContent className="bg-black border-white/20">
                {Object.values(PatternType).map(type => (
                  <SelectItem key={type} value={type}>
                    {formatPatternType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chain Selection */}
          <div className="mb-4">
            <label className="block text-xs mb-2">Chains to Monitor</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_CHAINS.map(chain => (
                <Button
                  key={chain.id}
                  variant="outline"
                  size="sm"
                  className={`text-xs ${formChains.includes(chain.id) ? 'bg-white/20' : 'bg-black'}`}
                  onClick={() => toggleChain(chain.id)}
                >
                  {chain.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Detection Parameters */}
          <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs mb-2">Sensitivity (1-10)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formSensitivity}
                  onChange={(e) => setFormSensitivity(parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-6 text-center">{formSensitivity}</span>
              </div>
              <div className="text-xs mt-1 opacity-60">
                Higher = more sensitive
              </div>
            </div>

            <div>
              <label className="block text-xs mb-2">Lookback Period (hours)</label>
              <Input
                type="number"
                min="1"
                max="168"
                value={formLookback}
                onChange={(e) => setFormLookback(parseInt(e.target.value))}
                className="bg-black border-white/20"
              />
            </div>

            <div>
              <label className="block text-xs mb-2">Min. Confidence (%)</label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formConfidence}
                onChange={(e) => setFormConfidence(parseInt(e.target.value))}
                className="bg-black border-white/20"
              />
            </div>
          </div>

          {/* Alert Settings */}
          <div className="mb-4">
            <h4 className="block text-xs mb-2 uppercase">Alert Settings</h4>

            {/* Alert Severity */}
            <div className="mb-4">
              <label className="block text-xs mb-2">Alert Severity</label>
              <Select
                value={formSeverity}
                onValueChange={(value) => setFormSeverity(value as AlertSeverity)}
              >
                <SelectTrigger className="bg-black border-white/20">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value={AlertSeverity.Low}>Low</SelectItem>
                  <SelectItem value={AlertSeverity.Medium}>Medium</SelectItem>
                  <SelectItem value={AlertSeverity.High}>High</SelectItem>
                  <SelectItem value={AlertSeverity.Critical}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notification Options */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="notify"
                  checked={formNotify}
                  onChange={(e) => setFormNotify(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="notify" className="text-xs cursor-pointer">
                  Show in-app notifications
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="external"
                  checked={formExternal}
                  onChange={(e) => setFormExternal(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="external" className="text-xs cursor-pointer">
                  Send to external integrations
                </label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs"
              onClick={resetForm}
            >
              CANCEL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs bg-white/10"
              onClick={handleCreateFilter}
            >
              CREATE FILTER
            </Button>
          </div>
        </div>
      )}

      {/* Filters Tab */}
      {activeTab === 'filters' && (
        <div className="space-y-4">
          {patternFilters.length > 0 ? (
            patternFilters.map(filter => (
              <div key={filter.id} className="border border-white/10 p-3 bg-black/40">
                <div className="flex justify-between">
                  <div className="flex items-center">
                    {getPatternIcon(filter.type)}
                    <div className="ml-2">
                      <div className="font-mono">{filter.name}</div>
                      <div className="text-xs opacity-70">{formatPatternType(filter.type)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-8 px-2 py-0.5 text-xs ${filter.enabled ? 'bg-[#4caf50]/10 text-[#4caf50]' : 'bg-[#f44336]/10 text-[#f44336]'}`}
                        onClick={() => handleToggleFilter(filter.id)}
                      >
                        {filter.enabled ? 'ACTIVE' : 'PAUSED'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2 py-0.5 text-xs bg-[#f44336]/10 text-[#f44336]"
                        onClick={() => handleDeleteFilter(filter.id)}
                      >
                        DELETE
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="opacity-70 mb-1">Chains</div>
                    <div className="flex flex-wrap gap-1">
                      {filter.chainIds.map(chainId => {
                        const chain = COMMON_CHAINS.find(c => c.id === chainId);
                        return (
                          <div key={chainId} className="px-1 py-0.5 bg-white/10 text-[10px] rounded-sm">
                            {chain?.name || `Chain ${chainId}`}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="opacity-70 mb-1">Parameters</div>
                    <div>Sensitivity: {filter.sensitivity}/10</div>
                    <div>Lookback: {filter.lookbackPeriod}h</div>
                    <div>Confidence: {filter.minimumConfidence}%</div>
                  </div>

                  <div>
                    <div className="opacity-70 mb-1">Alert Settings</div>
                    <div>Severity: {filter.alertSettings.severity}</div>
                    <div>In-app: {filter.alertSettings.notify ? 'Yes' : 'No'}</div>
                    <div>External: {filter.alertSettings.notifyExternally ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-sm opacity-70">
              No pattern filters configured
            </div>
          )}
        </div>
      )}

      {/* Detected Patterns Tab */}
      {activeTab === 'patterns' && (
        <div className="space-y-4">
          {detectedPatterns.length > 0 ? (
            detectedPatterns.slice(0, expanded ? undefined : 3).map(pattern => (
              <div
                key={pattern.id}
                className={`border ${pattern.read ? 'border-white/10' : 'border-white/20'} p-3 ${pattern.read ? 'bg-black/40' : 'bg-black/30'}`}
              >
                <div className="flex justify-between">
                  <div className="flex items-center">
                    {getPatternIcon(pattern.patternType)}
                    <div className="ml-2">
                      <div className="font-mono flex items-center">
                        {formatPatternType(pattern.patternType)}
                        {!pattern.read && (
                          <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-[#f44336]/20 text-[#f44336] rounded-sm">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs opacity-70">
                        <span>{pattern.chainName}</span>
                        {pattern.tokenSymbol && (
                          <>
                            <span className="mx-1 opacity-40">•</span>
                            <span>{pattern.tokenSymbol}</span>
                          </>
                        )}
                        <span className="mx-1 opacity-40">•</span>
                        <span>{formatTime(pattern.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-3 text-xs">
                      <div className="opacity-70">Confidence</div>
                      <div className="text-right font-mono">{pattern.confidence}%</div>
                    </div>
                    {renderMiniChart(pattern.dataPoints)}
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  {pattern.description}
                </div>

                {!pattern.read && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-0.5 text-xs"
                      onClick={() => handleMarkAsRead(pattern.id)}
                    >
                      DISMISS
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-6 text-center text-sm opacity-70">
              No patterns detected
            </div>
          )}

          {/* Show more/less */}
          {detectedPatterns.length > 3 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                size="sm"
                className="px-2 py-1 text-xs font-mono"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'SHOW LESS' : `SHOW ${detectedPatterns.length - 3} MORE`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
