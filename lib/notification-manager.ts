"use client";

import { v4 as uuidv4 } from 'uuid';
import { playSound, SoundType } from './sound-manager';

export type NotificationType = 'price-alert' | 'transaction' | 'liquidity' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationStatus = 'unread' | 'read' | 'dismissed';

export interface PriceAlertCondition {
  token: string;
  type: 'above' | 'below' | 'percent-change';
  value: number;
  timeframe?: string; // e.g., '1h', '24h', '7d'
  percentChange?: number; // for percent-change type
}

export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  priority: NotificationPriority;
  status: NotificationStatus;
  actions?: NotificationAction[];
  metadata?: {
    token?: string;
    tokenPair?: string;
    txHash?: string;
    priceChange?: number;
    priceAlertCondition?: PriceAlertCondition;
    amount?: string;
    liquidityPool?: string;
    chain?: string;
  };
}

export interface NotificationAction {
  label: string;
  action: 'view-transaction' | 'mark-read' | 'dismiss' | 'custom';
  href?: string;
  customAction?: string;
}

// Local storage keys
const NOTIFICATIONS_STORAGE_KEY = 'dunix-notifications';
const PRICE_ALERTS_STORAGE_KEY = 'dunix-price-alerts';

// Utility functions for storage
const getStoredNotifications = (): NotificationData[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to retrieve notifications:', error);
    return [];
  }
};

const saveNotifications = (notifications: NotificationData[]): void => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
  } catch (error) {
    console.error('Failed to save notifications:', error);
  }
};

// Main notification functions
export const addNotification = (notification: Omit<NotificationData, 'id' | 'timestamp' | 'status'>): NotificationData => {
  const notifications = getStoredNotifications();

  const newNotification: NotificationData = {
    ...notification,
    id: uuidv4(),
    timestamp: Date.now(),
    status: 'unread'
  };

  // Add to the beginning of the array
  notifications.unshift(newNotification);

  // Keep only the most recent 50 notifications
  const trimmedNotifications = notifications.slice(0, 50);

  saveNotifications(trimmedNotifications);

  // If Web Notifications are supported and permitted, send one
  sendWebNotification(newNotification);

  // Play the appropriate sound based on notification type
  playSoundForNotification(newNotification);

  return newNotification;
};

export const markNotificationAsRead = (id: string): void => {
  const notifications = getStoredNotifications();

  const updatedNotifications = notifications.map(notification => {
    if (notification.id === id) {
      return { ...notification, status: 'read' as NotificationStatus };
    }
    return notification;
  });

  saveNotifications(updatedNotifications);
};

export const dismissNotification = (id: string): void => {
  const notifications = getStoredNotifications();

  const updatedNotifications = notifications.map(notification => {
    if (notification.id === id) {
      return { ...notification, status: 'dismissed' as NotificationStatus };
    }
    return notification;
  });

  saveNotifications(updatedNotifications);
};

export const clearAllNotifications = (): void => {
  saveNotifications([]);
};

export const getNotifications = (
  options: {
    status?: NotificationStatus | 'all';
    type?: NotificationType | 'all';
    limit?: number;
  } = {}
): NotificationData[] => {
  const { status = 'all', type = 'all', limit } = options;
  let notifications = getStoredNotifications();

  // Filter by status (unless 'all')
  if (status !== 'all') {
    notifications = notifications.filter(notification => notification.status === status);
  } else {
    // When showing 'all', exclude dismissed
    notifications = notifications.filter(notification => notification.status !== 'dismissed');
  }

  // Filter by type (unless 'all')
  if (type !== 'all') {
    notifications = notifications.filter(notification => notification.type === type);
  }

  // Limit results if specified
  if (limit) {
    notifications = notifications.slice(0, limit);
  }

  return notifications;
};

export const getUnreadCount = (): number => {
  const notifications = getStoredNotifications();
  return notifications.filter(notification => notification.status === 'unread').length;
};

// Price alerts functions
export const getPriceAlerts = (): PriceAlertCondition[] => {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(PRICE_ALERTS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to retrieve price alerts:', error);
    return [];
  }
};

export const addPriceAlert = (alert: PriceAlertCondition): PriceAlertCondition[] => {
  const alerts = getPriceAlerts();

  // Add the new alert
  alerts.push(alert);

  // Save back to storage
  if (typeof window !== 'undefined') {
    localStorage.setItem(PRICE_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
  }

  return alerts;
};

export const removePriceAlert = (index: number): PriceAlertCondition[] => {
  const alerts = getPriceAlerts();

  // Remove the alert at the specified index
  if (index >= 0 && index < alerts.length) {
    alerts.splice(index, 1);

    // Save back to storage
    if (typeof window !== 'undefined') {
      localStorage.setItem(PRICE_ALERTS_STORAGE_KEY, JSON.stringify(alerts));
    }
  }

  return alerts;
};

// Web notification functions (browser notifications)
export const checkNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

export const sendWebNotification = (notification: NotificationData): void => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    // Create icon URL based on notification type
    let iconUrl = '/icons/notification-default.svg';
    if (notification.type === 'price-alert') iconUrl = '/icons/notification-price.svg';
    if (notification.type === 'transaction') iconUrl = '/icons/notification-transaction.svg';
    if (notification.type === 'system') iconUrl = '/icons/notification-system.svg';
    if (notification.type === 'liquidity') iconUrl = '/icons/notification-liquidity.svg';

    // Create and show the notification
    const webNotification = new Notification(notification.title, {
      body: notification.message,
      icon: iconUrl,
      tag: notification.id
    });

    // Handle notification click
    webNotification.onclick = () => {
      window.focus();
      // Find and trigger the first action if available
      if (notification.actions && notification.actions.length > 0) {
        const action = notification.actions[0];
        if (action.href) {
          window.open(action.href, '_blank');
        }
      }
      webNotification.close();
    };
  } catch (error) {
    console.error('Failed to send web notification:', error);
  }
};

/**
 * Play sound for a notification based on its type
 */
const playSoundForNotification = (notification: NotificationData): void => {
  if (typeof window === 'undefined') return;

  // Map notification type to sound type
  let soundType: SoundType = 'default';

  switch (notification.type) {
    case 'transaction':
      soundType = 'transaction';
      break;
    case 'price-alert':
      soundType = 'price';
      break;
    case 'system':
      soundType = 'system';
      break;
    case 'liquidity':
      // For liquidity notifications, use the volume sound
      soundType = 'volume';
      break;
  }

  // Play the sound
  playSound(soundType);
};

// Helper function for creating a transaction notification
export const createTransactionNotification = (
  txHash: string,
  title: string,
  message: string,
  metadata: {
    token?: string;
    tokenPair?: string;
    amount?: string;
    chain?: string;
  } = {}
): NotificationData => {
  return addNotification({
    type: 'transaction',
    title,
    message,
    priority: 'medium',
    actions: [
      {
        label: 'View Transaction',
        action: 'view-transaction',
        href: `https://etherscan.io/tx/${txHash}`
      },
      {
        label: 'Dismiss',
        action: 'dismiss'
      }
    ],
    metadata: {
      ...metadata,
      txHash
    }
  });
};

// Helper function for creating a price alert notification
export const createPriceAlertNotification = (
  token: string,
  condition: PriceAlertCondition,
  currentPrice: number,
  previousPrice?: number
): NotificationData => {
  let title = '';
  let message = '';
  let priority: NotificationPriority = 'medium';

  switch (condition.type) {
    case 'above':
      title = `${token} Price Alert`;
      message = `${token} price is now above $${condition.value.toLocaleString()} at $${currentPrice.toLocaleString()}`;
      break;
    case 'below':
      title = `${token} Price Alert`;
      message = `${token} price is now below $${condition.value.toLocaleString()} at $${currentPrice.toLocaleString()}`;
      break;
    case 'percent-change':
      const changePercent = condition.percentChange || 0;
      const direction = changePercent > 0 ? 'up' : 'down';
      title = `${token} Price ${direction === 'up' ? 'Surge' : 'Drop'}`;
      message = `${token} price has moved ${direction} by ${Math.abs(changePercent).toFixed(2)}% in the last ${condition.timeframe}`;
      priority = Math.abs(changePercent) > 10 ? 'high' : 'medium';
      break;
  }

  return addNotification({
    type: 'price-alert',
    title,
    message,
    priority,
    actions: [
      {
        label: 'View Chart',
        action: 'custom',
        customAction: 'view-chart'
      },
      {
        label: 'Dismiss',
        action: 'dismiss'
      }
    ],
    metadata: {
      token,
      priceAlertCondition: condition,
      priceChange: previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : undefined
    }
  });
};

// Helper function for creating a system notification
export const createSystemNotification = (
  title: string,
  message: string,
  priority: NotificationPriority = 'low'
): NotificationData => {
  return addNotification({
    type: 'system',
    title,
    message,
    priority,
    actions: [
      {
        label: 'Dismiss',
        action: 'dismiss'
      }
    ]
  });
};

// Helper function for creating a liquidity notification
export const createLiquidityNotification = (
  pool: string,
  title: string,
  message: string,
  txHash?: string
): NotificationData => {
  const actions: NotificationAction[] = [
    {
      label: 'Dismiss',
      action: 'dismiss'
    }
  ];

  if (txHash) {
    actions.unshift({
      label: 'View Transaction',
      action: 'view-transaction',
      href: `https://etherscan.io/tx/${txHash}`
    });
  }

  return addNotification({
    type: 'liquidity',
    title,
    message,
    priority: 'medium',
    actions,
    metadata: {
      liquidityPool: pool,
      txHash
    }
  });
};
