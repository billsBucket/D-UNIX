"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ExternalIntegration,
  IntegrationType,
  IntegrationStatus,
  getIntegrations,
  saveIntegration,
  deleteIntegration,
  testIntegrationConnection,
  createDiscordIntegration,
  createTelegramIntegration
} from '@/lib/external-integrations';
import { AlertCategory, AlertSeverity } from '@/lib/real-time-data';

export default function ExternalIntegrationsManager() {
  const [integrations, setIntegrations] = useState<ExternalIntegration[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state for adding new integration
  const [formType, setFormType] = useState<IntegrationType>(IntegrationType.Discord);
  const [formName, setFormName] = useState('');
  const [formWebhookUrl, setFormWebhookUrl] = useState('');
  const [formBotToken, setFormBotToken] = useState('');
  const [formChatId, setFormChatId] = useState('');
  const [formMinSeverity, setFormMinSeverity] = useState<AlertSeverity>(AlertSeverity.Medium);
  const [formCategories, setFormCategories] = useState<AlertCategory[]>(Object.values(AlertCategory));
  const [formIncludePrice, setFormIncludePrice] = useState(true);

  // Get integrations
  useEffect(() => {
    setIntegrations(getIntegrations());
  }, []);

  // Handle form submission
  const handleSubmit = () => {
    let newIntegration: ExternalIntegration | null = null;

    if (formType === IntegrationType.Discord) {
      if (!formWebhookUrl) return;

      newIntegration = createDiscordIntegration(
        formName || 'Discord Integration',
        formWebhookUrl,
        {
          categories: formCategories,
          minSeverity: formMinSeverity,
          includePrice: formIncludePrice,
        }
      );
    } else if (formType === IntegrationType.Telegram) {
      if (!formBotToken || !formChatId) return;

      newIntegration = createTelegramIntegration(
        formName || 'Telegram Integration',
        formBotToken,
        formChatId,
        {
          categories: formCategories,
          minSeverity: formMinSeverity,
          includePrice: formIncludePrice,
        }
      );
    }

    if (newIntegration) {
      // Update the integrations list
      setIntegrations([...integrations, newIntegration]);

      // Reset form
      resetForm();
    }
  };

  // Reset form
  const resetForm = () => {
    setShowAddForm(false);
    setFormType(IntegrationType.Discord);
    setFormName('');
    setFormWebhookUrl('');
    setFormBotToken('');
    setFormChatId('');
    setFormMinSeverity(AlertSeverity.Medium);
    setFormCategories(Object.values(AlertCategory));
    setFormIncludePrice(true);
    setTestResult(null);
  };

  // Handle integration deletion
  const handleDelete = (integrationId: string) => {
    if (deleteIntegration(integrationId)) {
      setIntegrations(integrations.filter(i => i.id !== integrationId));
    }
  };

  // Handle toggling integration active state
  const handleToggleEnabled = (integration: ExternalIntegration) => {
    const updatedIntegration = {
      ...integration,
      enabled: !integration.enabled
    };

    saveIntegration(updatedIntegration);

    setIntegrations(integrations.map(i =>
      i.id === integration.id ? updatedIntegration : i
    ));
  };

  // Handle test connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      let testIntegration: ExternalIntegration | null = null;

      if (formType === IntegrationType.Discord) {
        if (!formWebhookUrl) {
          setTestResult({
            success: false,
            message: 'Webhook URL is required'
          });
          setIsTestingConnection(false);
          return;
        }

        testIntegration = createDiscordIntegration(
          formName || 'Test Discord',
          formWebhookUrl,
          {
            categories: formCategories,
            minSeverity: formMinSeverity,
            includePrice: formIncludePrice,
          }
        );
      } else if (formType === IntegrationType.Telegram) {
        if (!formBotToken || !formChatId) {
          setTestResult({
            success: false,
            message: 'Bot token and chat ID are required'
          });
          setIsTestingConnection(false);
          return;
        }

        testIntegration = createTelegramIntegration(
          formName || 'Test Telegram',
          formBotToken,
          formChatId,
          {
            categories: formCategories,
            minSeverity: formMinSeverity,
            includePrice: formIncludePrice,
          }
        );
      }

      if (testIntegration) {
        const result = await testIntegrationConnection(testIntegration);
        setTestResult(result);

        // Remove the test integration
        deleteIntegration(testIntegration.id);
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Toggle category selection
  const toggleCategory = (category: AlertCategory) => {
    if (formCategories.includes(category)) {
      setFormCategories(formCategories.filter(c => c !== category));
    } else {
      setFormCategories([...formCategories, category]);
    }
  };

  // Format status text
  const formatStatus = (status: IntegrationStatus): string => {
    switch(status) {
      case IntegrationStatus.Connected:
        return 'Connected';
      case IntegrationStatus.Disconnected:
        return 'Disconnected';
      case IntegrationStatus.Error:
        return 'Error';
      case IntegrationStatus.Pending:
        return 'Pending';
      default:
        return status;
    }
  };

  // Get status color
  const getStatusColor = (status: IntegrationStatus): string => {
    switch(status) {
      case IntegrationStatus.Connected:
        return 'text-[#4caf50]';
      case IntegrationStatus.Disconnected:
        return 'text-white/60';
      case IntegrationStatus.Error:
        return 'text-[#f44336]';
      case IntegrationStatus.Pending:
        return 'text-[#ff9800]';
      default:
        return 'text-white/60';
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

  // Format categories list
  const formatCategories = (categories: AlertCategory[]): string => {
    if (categories.length === Object.values(AlertCategory).length) {
      return 'All Categories';
    }

    if (categories.length > 2) {
      return `${categories.length} Categories`;
    }

    return categories.join(', ');
  };

  return (
    <div className="dunix-card border border-white/10 p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-lg uppercase font-mono">EXTERNAL INTEGRATIONS</h2>
        </div>
        <div>
          <Button
            variant="outline"
            size="sm"
            className="px-2 py-1 text-xs font-mono"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'CANCEL' : 'ADD INTEGRATION'}
          </Button>
        </div>
      </div>

      {/* Add Integration Form */}
      {showAddForm && (
        <div className="mb-6 p-4 border border-white/10 bg-black/30">
          <h3 className="text-sm uppercase font-mono mb-4">Add External Integration</h3>

          {/* Platform Selection */}
          <div className="mb-4">
            <label className="block text-xs mb-2">Platform</label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className={`px-4 py-2 font-mono ${formType === IntegrationType.Discord ? 'bg-[#5865F2]/20' : 'bg-black'}`}
                onClick={() => setFormType(IntegrationType.Discord)}
              >
                DISCORD
              </Button>
              <Button
                variant="outline"
                size="sm"
                className={`px-4 py-2 font-mono ${formType === IntegrationType.Telegram ? 'bg-[#0088cc]/20' : 'bg-black'}`}
                onClick={() => setFormType(IntegrationType.Telegram)}
              >
                TELEGRAM
              </Button>
            </div>
          </div>

          {/* Integration Name */}
          <div className="mb-4">
            <label className="block text-xs mb-2">Integration Name</label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={formType === IntegrationType.Discord ? "Discord Alerts" : "Telegram Alerts"}
              className="bg-black border-white/20"
            />
          </div>

          {/* Platform-specific Inputs */}
          {formType === IntegrationType.Discord ? (
            <div className="mb-4">
              <label className="block text-xs mb-2">Discord Webhook URL</label>
              <Input
                value={formWebhookUrl}
                onChange={(e) => setFormWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
                className="bg-black border-white/20"
              />
              <div className="text-xs mt-1 opacity-60">
                Create a webhook URL in your Discord server's Integrations settings
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-xs mb-2">Telegram Bot Token</label>
                <Input
                  value={formBotToken}
                  onChange={(e) => setFormBotToken(e.target.value)}
                  placeholder="1234567890:ABCDEF..."
                  className="bg-black border-white/20"
                />
                <div className="text-xs mt-1 opacity-60">
                  Create a bot using BotFather and get your bot token
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs mb-2">Telegram Chat ID</label>
                <Input
                  value={formChatId}
                  onChange={(e) => setFormChatId(e.target.value)}
                  placeholder="-1001234567890"
                  className="bg-black border-white/20"
                />
                <div className="text-xs mt-1 opacity-60">
                  Add your bot to a channel or group and get the chat ID
                </div>
              </div>
            </>
          )}

          {/* Alert Settings */}
          <div className="mb-4">
            <h4 className="block text-xs mb-2 uppercase">Alert Settings</h4>

            {/* Minimum Alert Severity */}
            <div className="mb-4">
              <label className="block text-xs mb-2">Minimum Alert Severity</label>
              <Select
                value={formMinSeverity}
                onValueChange={(value) => setFormMinSeverity(value as AlertSeverity)}
              >
                <SelectTrigger className="bg-black border-white/20">
                  <SelectValue placeholder="Select minimum severity" />
                </SelectTrigger>
                <SelectContent className="bg-black border-white/20">
                  <SelectItem value={AlertSeverity.Low}>Low</SelectItem>
                  <SelectItem value={AlertSeverity.Medium}>Medium</SelectItem>
                  <SelectItem value={AlertSeverity.High}>High</SelectItem>
                  <SelectItem value={AlertSeverity.Critical}>Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Include Price Alerts */}
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includePrice"
                  checked={formIncludePrice}
                  onChange={(e) => setFormIncludePrice(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="includePrice" className="text-xs cursor-pointer">
                  Include token price alerts
                </label>
              </div>
            </div>

            {/* Categories */}
            <div className="mb-4">
              <label className="block text-xs mb-2">Alert Categories</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(AlertCategory).map(category => (
                  <div key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`cat-${category}`}
                      checked={formCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      className="mr-2"
                    />
                    <label htmlFor={`cat-${category}`} className="text-xs cursor-pointer">
                      {formatCategoryName(category)}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 mb-4 ${testResult.success ? 'bg-[#4caf50]/10 border border-[#4caf50]/30' : 'bg-[#f44336]/10 border border-[#f44336]/30'}`}>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${testResult.success ? 'bg-[#4caf50]' : 'bg-[#f44336]'}`}></div>
                <div className="font-mono text-sm">{testResult.success ? 'TEST SUCCESSFUL' : 'TEST FAILED'}</div>
              </div>
              <div className="text-xs mt-1 pl-4 opacity-80">{testResult.message}</div>
            </div>
          )}

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
              className="px-3 py-1 text-xs bg-white/5"
              onClick={handleTestConnection}
              disabled={isTestingConnection ||
                (formType === IntegrationType.Discord && !formWebhookUrl) ||
                (formType === IntegrationType.Telegram && (!formBotToken || !formChatId))}
            >
              {isTestingConnection ? 'TESTING...' : 'TEST CONNECTION'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="px-3 py-1 text-xs bg-white/10"
              onClick={handleSubmit}
              disabled={
                (formType === IntegrationType.Discord && !formWebhookUrl) ||
                (formType === IntegrationType.Telegram && (!formBotToken || !formChatId))
              }
            >
              SAVE INTEGRATION
            </Button>
          </div>
        </div>
      )}

      {/* Integrations List */}
      {integrations.length > 0 ? (
        <div className="space-y-4">
          {integrations.map(integration => (
            <div key={integration.id} className="border border-white/10 p-3 bg-black/40">
              <div className="flex justify-between">
                <div className="flex items-center">
                  {integration.type === IntegrationType.Discord ? (
                    <div className="w-6 h-6 bg-[#5865F2]/20 flex items-center justify-center rounded-sm mr-2">
                      <span className="text-xs">D</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-[#0088cc]/20 flex items-center justify-center rounded-sm mr-2">
                      <span className="text-xs">T</span>
                    </div>
                  )}
                  <div>
                    <div className="font-mono">{integration.name}</div>
                    <div className="flex items-center text-xs mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full mr-1 ${getStatusColor(integration.status)}`}></div>
                      <span className={getStatusColor(integration.status)}>
                        {formatStatus(integration.status)}
                      </span>
                      <span className="mx-1 opacity-40">•</span>
                      <span className="opacity-60">{formatTime(integration.lastUpdated)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`h-8 px-2 py-0.5 text-xs ${integration.enabled ? 'bg-[#4caf50]/10 text-[#4caf50]' : 'bg-[#f44336]/10 text-[#f44336]'}`}
                      onClick={() => handleToggleEnabled(integration)}
                    >
                      {integration.enabled ? 'ACTIVE' : 'DISABLED'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 py-0.5 text-xs bg-[#f44336]/10 text-[#f44336]"
                      onClick={() => handleDelete(integration.id)}
                    >
                      DELETE
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  <div className="flex">
                    <div className="w-24 opacity-70">Platform:</div>
                    <div>{integration.type === IntegrationType.Discord ? 'Discord' : 'Telegram'}</div>
                  </div>
                  <div className="flex">
                    <div className="w-24 opacity-70">Min Severity:</div>
                    <div>{integration.alertSettings.minSeverity}</div>
                  </div>
                  <div className="flex">
                    <div className="w-24 opacity-70">Categories:</div>
                    <div>{formatCategories(integration.alertSettings.categories)}</div>
                  </div>
                  <div className="flex">
                    <div className="w-24 opacity-70">Price Alerts:</div>
                    <div>{integration.alertSettings.includePrice ? 'Enabled' : 'Disabled'}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-xs opacity-60">
                {integration.type === IntegrationType.Discord ? (
                  <div className="truncate">Webhook: {integration.config.webhookUrl || 'N/A'}</div>
                ) : (
                  <div className="truncate">Bot: {integration.config.botToken?.substring(0, 10)}... / Chat: {integration.config.chatId || 'N/A'}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-sm opacity-70">
          No external integrations configured
        </div>
      )}
    </div>
  );
}

// Helper to format category names for display
function formatCategoryName(category: AlertCategory): string {
  switch(category) {
    case AlertCategory.VolumeChange:
      return 'Volume Changes';
    case AlertCategory.PriceMovement:
      return 'Price Movements';
    case AlertCategory.LiquidityChange:
      return 'Liquidity Changes';
    case AlertCategory.GasPrice:
      return 'Gas Price Alerts';
    case AlertCategory.SlippageWarning:
      return 'Slippage Warnings';
    case AlertCategory.NetworkCongestion:
      return 'Network Congestion';
    case AlertCategory.TradingOpportunity:
      return 'Trading Opportunities';
    default:
      return category;
  }
}
