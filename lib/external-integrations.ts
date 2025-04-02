/**
 * External Integrations System
 *
 * This module provides functionality for sending notifications to external
 * platforms such as Discord and Telegram.
 */

import { AlertCategory, AlertSeverity, VolumeAlert } from './real-time-data';
import { PriceAlert, PriceAlertHistory } from './token-price-alert';

// External platform connection types
export enum IntegrationType {
  Discord = 'discord',
  Telegram = 'telegram'
}

// Integration status
export enum IntegrationStatus {
  Disconnected = 'disconnected',
  Connected = 'connected',
  Error = 'error',
  Pending = 'pending'
}

// Integration configuration
export interface ExternalIntegration {
  id: string;
  type: IntegrationType;
  name: string;
  config: {
    webhookUrl?: string;     // Discord webhook URL
    botToken?: string;       // Telegram bot token
    chatId?: string;         // Telegram chat ID
    channelId?: string;      // Discord channel ID
    serverName?: string;     // Discord server name
  };
  status: IntegrationStatus;
  lastUpdated: number;
  enabled: boolean;
  alertSettings: {
    categories: AlertCategory[];
    minSeverity: AlertSeverity;
    includePrice: boolean;
    includePriceWithMinSeverity: AlertSeverity;
  };
}

// Message content
export interface ExternalMessage {
  title: string;
  description: string;
  color?: string;  // Hex color
  timestamp: number;
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
  footer?: string;
  image?: string;
  url?: string;
}

// Format settings for external platforms
interface PlatformFormatting {
  maxTitleLength: number;
  maxDescriptionLength: number;
  supportsMarkdown: boolean;
  supportsEmbed: boolean;
  supportsImages: boolean;
  fieldLimit: number;
}

// Platform-specific formatting rules
const PLATFORM_FORMATS: Record<IntegrationType, PlatformFormatting> = {
  [IntegrationType.Discord]: {
    maxTitleLength: 256,
    maxDescriptionLength: 4096,
    supportsMarkdown: true,
    supportsEmbed: true,
    supportsImages: true,
    fieldLimit: 25
  },
  [IntegrationType.Telegram]: {
    maxTitleLength: 0, // Telegram doesn't have separate titles
    maxDescriptionLength: 4096,
    supportsMarkdown: true,
    supportsEmbed: false,
    supportsImages: true,
    fieldLimit: 0
  }
};

// Store integrations in memory
// In a real application, these would be stored in a database
const integrations: ExternalIntegration[] = [];

/**
 * Create or update an external integration
 */
export function saveIntegration(integration: ExternalIntegration): ExternalIntegration {
  const index = integrations.findIndex(i => i.id === integration.id);

  if (index >= 0) {
    // Update existing integration
    integrations[index] = {
      ...integration,
      lastUpdated: Date.now()
    };
    return integrations[index];
  } else {
    // Add new integration
    const newIntegration = {
      ...integration,
      lastUpdated: Date.now()
    };
    integrations.push(newIntegration);
    return newIntegration;
  }
}

/**
 * Delete an integration
 */
export function deleteIntegration(id: string): boolean {
  const initialLength = integrations.length;
  const filteredIntegrations = integrations.filter(i => i.id !== id);

  // Update the integrations array
  integrations.length = 0;
  integrations.push(...filteredIntegrations);

  return integrations.length < initialLength;
}

/**
 * Get all integrations
 */
export function getIntegrations(): ExternalIntegration[] {
  return [...integrations];
}

/**
 * Get integration by ID
 */
export function getIntegrationById(id: string): ExternalIntegration | undefined {
  return integrations.find(i => i.id === id);
}

/**
 * Get integrations by type
 */
export function getIntegrationsByType(type: IntegrationType): ExternalIntegration[] {
  return integrations.filter(i => i.type === type);
}

/**
 * Test an integration connection
 */
export async function testIntegrationConnection(
  integration: ExternalIntegration
): Promise<{ success: boolean; message: string }> {
  try {
    // Prepare a test message
    const testMessage: ExternalMessage = {
      title: 'D-UNIX Connection Test',
      description: 'This is a test message to verify your integration is working correctly.',
      timestamp: Date.now(),
      fields: [
        { name: 'Integration Type', value: integration.type, inline: true },
        { name: 'Integration Name', value: integration.name, inline: true },
        { name: 'Test Time', value: new Date().toISOString(), inline: false }
      ],
      footer: 'D-UNIX Alert System'
    };

    // Send the test message
    const result = await sendExternalMessage(integration, testMessage);

    // Update integration status
    if (result.success) {
      integration.status = IntegrationStatus.Connected;
    } else {
      integration.status = IntegrationStatus.Error;
    }

    // Save updated status
    saveIntegration(integration);

    return result;
  } catch (error) {
    // Update integration status to error
    integration.status = IntegrationStatus.Error;
    saveIntegration(integration);

    return {
      success: false,
      message: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Send a message to an external platform
 */
export async function sendExternalMessage(
  integration: ExternalIntegration,
  message: ExternalMessage
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if integration is enabled
    if (!integration.enabled) {
      return { success: false, message: 'Integration is disabled' };
    }

    // Validate message against platform constraints
    const format = PLATFORM_FORMATS[integration.type];

    // Format message according to platform constraints
    const formattedMessage = formatMessageForPlatform(message, integration.type);

    // For this mock implementation, we'll just log the message
    // In a real implementation, we would make API calls to Discord or Telegram
    console.log(`[${integration.type.toUpperCase()}] Sending message to ${integration.name}:`, formattedMessage);

    // Simulate API call to external platform
    if (integration.type === IntegrationType.Discord) {
      return sendToDiscord(integration, formattedMessage);
    } else if (integration.type === IntegrationType.Telegram) {
      return sendToTelegram(integration, formattedMessage);
    }

    // Unknown integration type
    return { success: false, message: `Unknown integration type: ${integration.type}` };
  } catch (error) {
    return {
      success: false,
      message: `Error sending message: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Format a message for a specific platform
 */
function formatMessageForPlatform(
  message: ExternalMessage,
  platform: IntegrationType
): any {
  const format = PLATFORM_FORMATS[platform];

  // Truncate title and description if needed
  const title = format.maxTitleLength > 0 ?
    message.title.substring(0, format.maxTitleLength) :
    message.title;

  const description = message.description.substring(0, format.maxDescriptionLength);

  // Format fields if supported
  const fields = format.fieldLimit > 0 ?
    (message.fields || []).slice(0, format.fieldLimit) :
    [];

  // Platform-specific formatting
  if (platform === IntegrationType.Discord) {
    // Discord uses embeds
    return {
      embeds: [{
        title,
        description,
        color: message.color ? parseInt(message.color.replace('#', ''), 16) : undefined,
        timestamp: new Date(message.timestamp).toISOString(),
        fields,
        footer: message.footer ? { text: message.footer } : undefined,
        image: message.image ? { url: message.image } : undefined
      }]
    };
  } else if (platform === IntegrationType.Telegram) {
    // Telegram uses markdown
    let content = `*${title}*\n\n${description}\n\n`;

    // Add fields as key-value pairs
    if (message.fields && message.fields.length > 0) {
      message.fields.forEach(field => {
        content += `*${field.name}*: ${field.value}\n`;
      });
    }

    // Add footer
    if (message.footer) {
      content += `\n_${message.footer}_`;
    }

    return {
      text: content,
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
      image: message.image
    };
  }

  // Default format (shouldn't reach here)
  return { title, description };
}

/**
 * Mock implementation of sending to Discord
 */
async function sendToDiscord(
  integration: ExternalIntegration,
  formattedMessage: any
): Promise<{ success: boolean; message: string }> {
  // Validate webhook URL
  if (!integration.config.webhookUrl) {
    return { success: false, message: 'Missing Discord webhook URL' };
  }

  // In a real implementation, we would make an API call to Discord
  // For now, we'll just simulate success
  return { success: true, message: 'Message sent to Discord successfully' };
}

/**
 * Mock implementation of sending to Telegram
 */
async function sendToTelegram(
  integration: ExternalIntegration,
  formattedMessage: any
): Promise<{ success: boolean; message: string }> {
  // Validate bot token and chat ID
  if (!integration.config.botToken) {
    return { success: false, message: 'Missing Telegram bot token' };
  }

  if (!integration.config.chatId) {
    return { success: false, message: 'Missing Telegram chat ID' };
  }

  // In a real implementation, we would make an API call to Telegram
  // For now, we'll just simulate success
  return { success: true, message: 'Message sent to Telegram successfully' };
}

/**
 * Create Discord integration
 */
export function createDiscordIntegration(
  name: string,
  webhookUrl: string,
  alertSettings: {
    categories?: AlertCategory[];
    minSeverity?: AlertSeverity;
    includePrice?: boolean;
  } = {}
): ExternalIntegration {
  const integration: ExternalIntegration = {
    id: `discord-${Date.now()}`,
    type: IntegrationType.Discord,
    name,
    config: {
      webhookUrl
    },
    status: IntegrationStatus.Pending,
    lastUpdated: Date.now(),
    enabled: true,
    alertSettings: {
      categories: alertSettings.categories || Object.values(AlertCategory),
      minSeverity: alertSettings.minSeverity || AlertSeverity.Medium,
      includePrice: alertSettings.includePrice !== undefined ? alertSettings.includePrice : true,
      includePriceWithMinSeverity: AlertSeverity.Medium
    }
  };

  return saveIntegration(integration);
}

/**
 * Create Telegram integration
 */
export function createTelegramIntegration(
  name: string,
  botToken: string,
  chatId: string,
  alertSettings: {
    categories?: AlertCategory[];
    minSeverity?: AlertSeverity;
    includePrice?: boolean;
  } = {}
): ExternalIntegration {
  const integration: ExternalIntegration = {
    id: `telegram-${Date.now()}`,
    type: IntegrationType.Telegram,
    name,
    config: {
      botToken,
      chatId
    },
    status: IntegrationStatus.Pending,
    lastUpdated: Date.now(),
    enabled: true,
    alertSettings: {
      categories: alertSettings.categories || Object.values(AlertCategory),
      minSeverity: alertSettings.minSeverity || AlertSeverity.Medium,
      includePrice: alertSettings.includePrice !== undefined ? alertSettings.includePrice : true,
      includePriceWithMinSeverity: AlertSeverity.Medium
    }
  };

  return saveIntegration(integration);
}

/**
 * Format a volume alert for external platforms
 */
export function formatVolumeAlertForExternal(alert: VolumeAlert): ExternalMessage {
  // Determine color based on severity
  let color = '#6b8af2'; // Default blue
  switch (alert.severity) {
    case AlertSeverity.Critical:
      color = '#f44336'; // Red
      break;
    case AlertSeverity.High:
      color = '#ff9800'; // Orange
      break;
    case AlertSeverity.Medium:
      color = '#f0b90b'; // Yellow
      break;
    case AlertSeverity.Low:
      color = '#4caf50'; // Green
      break;
  }

  // Create message
  return {
    title: `D-UNIX ${alert.isPositive ? 'INCREASE' : 'DECREASE'} ALERT: ${alert.chainName}`,
    description: alert.message,
    color,
    timestamp: alert.timestamp,
    fields: [
      { name: 'Chain', value: alert.chainName, inline: true },
      { name: 'Change', value: `${alert.isPositive ? '+' : ''}${alert.changePercent.toFixed(1)}%`, inline: true },
      { name: 'Volume', value: alert.formattedVolume, inline: true },
      { name: 'Timeframe', value: alert.timeframe, inline: true },
      { name: 'Severity', value: alert.severity, inline: true },
      { name: 'Category', value: alert.category, inline: true }
    ],
    footer: 'D-UNIX Alert System'
  };
}

/**
 * Format a price alert for external platforms
 */
export function formatPriceAlertForExternal(alert: PriceAlertHistory): ExternalMessage {
  // Determine if the alert is positive (for color)
  const isPositive = alert.condition === PriceAlertCondition.Above ||
                     alert.condition === PriceAlertCondition.PercentageIncrease;

  // Determine color
  const color = isPositive ? '#4caf50' : '#f44336';

  // Create message
  return {
    title: `D-UNIX PRICE ALERT: ${alert.tokenSymbol}`,
    description: alert.message,
    color,
    timestamp: alert.triggeredAt,
    fields: [
      { name: 'Token', value: alert.tokenName, inline: true },
      { name: 'Symbol', value: alert.tokenSymbol, inline: true },
      { name: 'Price', value: formatCurrency(alert.triggerPrice), inline: true },
      { name: 'Condition', value: formatCondition(alert.condition), inline: true },
      { name: 'Chain', value: `Chain ID: ${alert.chainId}`, inline: true }
    ],
    footer: 'D-UNIX Price Alert System'
  };
}

/**
 * Format condition for display
 */
function formatCondition(condition: PriceAlertCondition): string {
  switch (condition) {
    case PriceAlertCondition.Above:
      return 'Price Above Target';
    case PriceAlertCondition.Below:
      return 'Price Below Target';
    case PriceAlertCondition.PercentageIncrease:
      return 'Price Increase %';
    case PriceAlertCondition.PercentageDecrease:
      return 'Price Decrease %';
    case PriceAlertCondition.PriceTarget:
      return 'Price Target Reached';
    case PriceAlertCondition.PriceRange:
      return 'Price In Range';
    case PriceAlertCondition.VolatilitySpike:
      return 'Volatility Spike';
    default:
      return String(condition);
  }
}

/**
 * Format a price as USD
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  }).format(value);
}

/**
 * Initialize sample integrations
 */
export function initializeSampleIntegrations() {
  // Create sample Discord integration
  createDiscordIntegration(
    'D-UNIX Alerts',
    'https://discord.com/api/webhooks/sample', // This is a placeholder
    {
      categories: [
        AlertCategory.VolumeChange,
        AlertCategory.PriceMovement,
        AlertCategory.LiquidityChange
      ],
      minSeverity: AlertSeverity.Medium,
      includePrice: true
    }
  );

  // Create sample Telegram integration
  createTelegramIntegration(
    'D-UNIX Alert Bot',
    '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ', // This is a placeholder
    '-1001234567890', // This is a placeholder
    {
      categories: [
        AlertCategory.VolumeChange,
        AlertCategory.PriceMovement
      ],
      minSeverity: AlertSeverity.High,
      includePrice: true
    }
  );
}
