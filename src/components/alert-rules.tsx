"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertRule,
  AlertCategory,
  AlertSeverity,
  getAlertRules,
  saveAlertRule,
  deleteAlertRule
} from '@/lib/real-time-data';
import { NETWORKS } from '@/lib/ethereum';

interface AlertRulesProps {
  onRuleUpdated?: () => void;
}

export default function AlertRules({ onRuleUpdated }: AlertRulesProps) {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Load rules on mount
  useEffect(() => {
    const alertRules = getAlertRules();
    setRules(alertRules);
  }, []);

  // Start creating a new rule
  const handleCreateRule = () => {
    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      name: 'New Alert Rule',
      enabled: true,
      chainIds: [],
      categories: [AlertCategory.VolumeChange],
      minimumThreshold: 5.0,
      minimumVolume: 0,
      timeframes: ['1h', '24h'],
      playSoundNotification: true,
      sendPushNotification: true,
      severityLevel: AlertSeverity.Medium
    };

    setEditingRule(newRule);
    setIsEditing(true);
  };

  // Edit an existing rule
  const handleEditRule = (rule: AlertRule) => {
    setEditingRule({ ...rule });
    setIsEditing(true);
  };

  // Toggle rule enabled state
  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map(rule => {
      if (rule.id === ruleId) {
        const updatedRule = { ...rule, enabled: !rule.enabled };
        saveAlertRule(updatedRule);
        return updatedRule;
      }
      return rule;
    });

    setRules(updatedRules);
    if (onRuleUpdated) onRuleUpdated();
  };

  // Delete a rule
  const handleDeleteRule = (ruleId: string) => {
    deleteAlertRule(ruleId);
    setRules(rules.filter(rule => rule.id !== ruleId));
    if (onRuleUpdated) onRuleUpdated();
  };

  // Save edited rule
  const handleSaveRule = () => {
    if (!editingRule) return;

    saveAlertRule(editingRule);

    // Update the local state
    const ruleIndex = rules.findIndex(r => r.id === editingRule.id);
    if (ruleIndex >= 0) {
      const updatedRules = [...rules];
      updatedRules[ruleIndex] = editingRule;
      setRules(updatedRules);
    } else {
      setRules([...rules, editingRule]);
    }

    setIsEditing(false);
    setEditingRule(null);

    if (onRuleUpdated) onRuleUpdated();
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingRule(null);
  };

  // Update a field in the editing rule
  const updateEditingRule = (field: string, value: any) => {
    if (!editingRule) return;
    setEditingRule({ ...editingRule, [field]: value });
  };

  // Toggle a chain ID in the editing rule
  const toggleChainInRule = (chainId: number) => {
    if (!editingRule) return;

    const chainIds = [...editingRule.chainIds];
    const index = chainIds.indexOf(chainId);

    if (index >= 0) {
      chainIds.splice(index, 1);
    } else {
      chainIds.push(chainId);
    }

    setEditingRule({ ...editingRule, chainIds });
  };

  // Toggle a category in the editing rule
  const toggleCategoryInRule = (category: AlertCategory) => {
    if (!editingRule) return;

    const categories = [...editingRule.categories];
    const index = categories.indexOf(category);

    if (index >= 0) {
      categories.splice(index, 1);
    } else {
      categories.push(category);
    }

    setEditingRule({ ...editingRule, categories });
  };

  // Toggle a timeframe in the editing rule
  const toggleTimeframeInRule = (timeframe: '1h' | '24h') => {
    if (!editingRule) return;

    const timeframes = [...editingRule.timeframes];
    const index = timeframes.indexOf(timeframe);

    if (index >= 0) {
      timeframes.splice(index, 1);
    } else {
      timeframes.push(timeframe);
    }

    setEditingRule({ ...editingRule, timeframes });
  };

  // Get category label
  const getCategoryLabel = (category: AlertCategory) => {
    switch (category) {
      case AlertCategory.VolumeChange: return 'VOLUME CHANGE';
      case AlertCategory.PriceMovement: return 'PRICE MOVEMENT';
      case AlertCategory.LiquidityChange: return 'LIQUIDITY CHANGE';
      case AlertCategory.GasPrice: return 'GAS PRICE';
      case AlertCategory.SlippageWarning: return 'SLIPPAGE WARNING';
      case AlertCategory.NetworkCongestion: return 'NETWORK CONGESTION';
      case AlertCategory.TradingOpportunity: return 'TRADING OPPORTUNITY';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg uppercase font-mono">ALERT RULES</h2>
        <Button
          variant="outline"
          size="sm"
          className="text-xs font-mono"
          onClick={handleCreateRule}
          disabled={isEditing}
        >
          ADD RULE
        </Button>
      </div>

      {/* Rule List */}
      {!isEditing && (
        <div className="space-y-2">
          {rules.length === 0 ? (
            <div className="text-center py-8 text-white/50">
              No custom alert rules defined
            </div>
          ) : (
            rules.map(rule => (
              <div
                key={rule.id}
                className={`border ${rule.enabled ? 'border-white/20' : 'border-white/5'} p-3 ${
                  rule.enabled ? 'bg-black/40' : 'bg-black'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-sm font-mono">{rule.name}</div>
                    <div className="text-xs opacity-70 mt-1">
                      Threshold: {rule.minimumThreshold}% |
                      Chains: {rule.chainIds.length === 0 ? 'All' : rule.chainIds.length} |
                      Categories: {rule.categories.length}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      className={`px-2 py-1 text-xs font-mono border ${
                        rule.enabled ? 'border-[#4caf50] text-[#4caf50]' : 'border-[#f44336] text-[#f44336]'
                      }`}
                      onClick={() => handleToggleRule(rule.id)}
                    >
                      {rule.enabled ? 'ON' : 'OFF'}
                    </button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono"
                      onClick={() => handleEditRule(rule)}
                    >
                      EDIT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-mono text-[#f44336] border-[#f44336]"
                      onClick={() => handleDeleteRule(rule.id)}
                    >
                      DELETE
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Rule Editor */}
      {isEditing && editingRule && (
        <div className="border border-white/10 p-4">
          <div className="mb-4">
            <div className="text-xs mb-1">RULE NAME</div>
            <input
              type="text"
              value={editingRule.name}
              onChange={(e) => updateEditingRule('name', e.target.value)}
              className="w-full bg-black border border-white/20 p-2 text-sm"
            />
          </div>

          <div className="mb-4">
            <div className="text-xs mb-1">MINIMUM THRESHOLD (%)</div>
            <div className="flex flex-wrap gap-2">
              {[1, 3, 5, 10, 15, 20].map(value => (
                <button
                  key={value}
                  className={`px-2 py-1 text-xs font-mono border ${
                    editingRule.minimumThreshold === value ? 'bg-white/20' : 'bg-black'
                  }`}
                  onClick={() => updateEditingRule('minimumThreshold', value)}
                >
                  {value}%
                </button>
              ))}
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={editingRule.minimumThreshold}
                onChange={(e) => updateEditingRule('minimumThreshold', parseFloat(e.target.value))}
                className="w-20 bg-black border border-white/20 p-1 text-xs"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs mb-1">MINIMUM VOLUME ($)</div>
            <div className="flex flex-wrap gap-2">
              {[0, 100000, 500000, 1000000, 5000000].map(value => (
                <button
                  key={value}
                  className={`px-2 py-1 text-xs font-mono border ${
                    editingRule.minimumVolume === value ? 'bg-white/20' : 'bg-black'
                  }`}
                  onClick={() => updateEditingRule('minimumVolume', value)}
                >
                  {value === 0 ? 'ANY' : `$${value / 1000000}M`}
                </button>
              ))}
              <input
                type="number"
                min="0"
                step="1000"
                value={editingRule.minimumVolume}
                onChange={(e) => updateEditingRule('minimumVolume', parseInt(e.target.value))}
                className="w-28 bg-black border border-white/20 p-1 text-xs"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs mb-1">CHAINS TO MONITOR</div>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-2 py-1 text-xs font-mono border ${
                  editingRule.chainIds.length === 0 ? 'bg-white/20' : 'bg-black'
                }`}
                onClick={() => updateEditingRule('chainIds', [])}
              >
                ALL CHAINS
              </button>
              {Object.entries(NETWORKS).map(([chainIdStr, network]) => {
                const chainId = parseInt(chainIdStr);
                return (
                  <button
                    key={chainId}
                    className={`px-2 py-1 text-xs font-mono border ${
                      editingRule.chainIds.includes(chainId) ? 'bg-white/20' : 'bg-black'
                    }`}
                    onClick={() => toggleChainInRule(chainId)}
                  >
                    {network.name.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs mb-1">EVENT CATEGORIES</div>
            <div className="flex flex-wrap gap-2">
              {Object.values(AlertCategory).map(category => (
                <button
                  key={category}
                  className={`px-2 py-1 text-xs font-mono border ${
                    editingRule.categories.includes(category) ? 'bg-white/20' : 'bg-black'
                  }`}
                  onClick={() => toggleCategoryInRule(category)}
                >
                  {getCategoryLabel(category)}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs mb-1">TIME FRAMES</div>
            <div className="flex gap-2">
              <button
                className={`px-2 py-1 text-xs font-mono border ${
                  editingRule.timeframes.includes('1h') ? 'bg-white/20' : 'bg-black'
                }`}
                onClick={() => toggleTimeframeInRule('1h')}
              >
                1 HOUR
              </button>
              <button
                className={`px-2 py-1 text-xs font-mono border ${
                  editingRule.timeframes.includes('24h') ? 'bg-white/20' : 'bg-black'
                }`}
                onClick={() => toggleTimeframeInRule('24h')}
              >
                24 HOURS
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs mb-1">SEVERITY LEVEL</div>
            <div className="flex gap-2">
              {Object.values(AlertSeverity).map(severity => (
                <button
                  key={severity}
                  className={`px-2 py-1 text-xs font-mono border ${
                    editingRule.severityLevel === severity ? 'bg-white/20' : 'bg-black'
                  } ${
                    severity === AlertSeverity.Critical
                      ? 'border-[#f44336] text-[#f44336]'
                      : severity === AlertSeverity.High
                      ? 'border-[#ff9800] text-[#ff9800]'
                      : severity === AlertSeverity.Medium
                      ? 'border-[#f0b90b] text-[#f0b90b]'
                      : 'border-[#4caf50] text-[#4caf50]'
                  }`}
                  onClick={() => updateEditingRule('severityLevel', severity)}
                >
                  {severity.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-xs mb-1">NOTIFICATIONS</div>
            <div className="flex gap-2">
              <button
                className={`px-2 py-1 text-xs font-mono border ${
                  editingRule.playSoundNotification ? 'border-[#4caf50] text-[#4caf50]' : 'border-white/20'
                }`}
                onClick={() => updateEditingRule('playSoundNotification', !editingRule.playSoundNotification)}
              >
                {editingRule.playSoundNotification ? 'SOUND ON' : 'SOUND OFF'}
              </button>
              <button
                className={`px-2 py-1 text-xs font-mono border ${
                  editingRule.sendPushNotification ? 'border-[#4caf50] text-[#4caf50]' : 'border-white/20'
                }`}
                onClick={() => updateEditingRule('sendPushNotification', !editingRule.sendPushNotification)}
              >
                {editingRule.sendPushNotification ? 'PUSH ON' : 'PUSH OFF'}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-mono"
              onClick={handleCancelEdit}
            >
              CANCEL
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs font-mono"
              onClick={handleSaveRule}
            >
              SAVE RULE
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
