import React, { useState, useEffect } from 'react';
import { Bell, BellRing, ExternalLink, Check, X, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  getNotifications,
  markNotificationAsRead,
  dismissNotification,
  clearAllNotifications,
  getUnreadCount,
  checkNotificationPermission,
  NotificationData
} from '@/lib/notification-manager';
import { startMonitoring } from '@/lib/price-monitoring-service';
import { getRealTimeData, markAlertAsRead, VolumeAlert, clearAllAlerts } from '@/lib/real-time-data';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [volumeAlerts, setVolumeAlerts] = useState<VolumeAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadVolumeAlertsCount, setUnreadVolumeAlertsCount] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'notifications' | 'volume'>('all');

  // Load notifications and volume alerts when component mounts
  useEffect(() => {
    const loadNotifications = () => {
      // Load regular notifications
      const allNotifications = getNotifications({
        status: 'all',
        limit: 10
      });
      setNotifications(allNotifications);
      setUnreadCount(getUnreadCount());

      // Load volume alerts
      const data = getRealTimeData();
      setVolumeAlerts(data.alerts);
      setUnreadVolumeAlertsCount(data.alerts.filter(alert => !alert.read).length);
    };

    // Load immediately
    loadNotifications();

    // Start price monitoring
    startMonitoring();

    // Re-load periodically to get updated notifications and alerts
    const interval = setInterval(() => {
      loadNotifications();
    }, 5000);

    // Check notification permissions
    checkNotificationPermission().then(setNotificationsEnabled);

    return () => clearInterval(interval);
  }, []);

  // Reload notifications when dropdown is opened
  const handleDropdownOpen = () => {
    setIsOpen(true);

    // Load regular notifications
    const allNotifications = getNotifications({
      status: 'all',
      limit: 10
    });
    setNotifications(allNotifications);
    setUnreadCount(getUnreadCount());

    // Load volume alerts
    const data = getRealTimeData();
    setVolumeAlerts(data.alerts);
    setUnreadVolumeAlertsCount(data.alerts.filter(alert => !alert.read).length);
  };

  // Handle marking a notification as read
  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, status: 'read' as const }
          : notification
      )
    );
    setUnreadCount(getUnreadCount());
  };

  // Handle dismissing a notification
  const handleDismiss = (id: string) => {
    dismissNotification(id);
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setUnreadCount(getUnreadCount());
  };

  // Handle clearing all notifications
  const handleClearAll = () => {
    clearAllNotifications();
    clearAllAlerts();
    setNotifications([]);
    setVolumeAlerts([]);
    setUnreadCount(0);
    setUnreadVolumeAlertsCount(0);
  };

  // Handle marking a volume alert as read
  const handleMarkVolumeAlertAsRead = (alertId: string) => {
    markAlertAsRead(alertId);
    setVolumeAlerts(prev => prev.map(alert =>
      alert.id === alertId ? { ...alert, read: true } : alert
    ));
    setUnreadVolumeAlertsCount(prev => Math.max(0, prev - 1));
  };

  // Handle clicking a notification action
  const handleNotificationAction = (notification: NotificationData, actionIndex: number) => {
    const action = notification.actions?.[actionIndex];
    if (!action) return;

    if (action.action === 'dismiss') {
      handleDismiss(notification.id);
    } else if (action.action === 'mark-read') {
      handleMarkAsRead(notification.id);
    } else if (action.action === 'view-transaction' && action.href) {
      window.open(action.href, '_blank');
      handleMarkAsRead(notification.id);
    }

    // Mark as read for all actions
    if (notification.status === 'unread') {
      handleMarkAsRead(notification.id);
    }
  };

  // Handle requesting notification permissions
  const handleRequestPermissions = async () => {
    const permission = await checkNotificationPermission();
    setNotificationsEnabled(permission);
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <div className="bg-green-500/20 p-1 rounded-full"><Check className="h-4 w-4 text-green-500" /></div>;
      case 'price-alert':
        return <div className="bg-yellow-500/20 p-1 rounded-full"><BellRing className="h-4 w-4 text-yellow-500" /></div>;
      case 'system':
        return <div className="bg-indigo-500/20 p-1 rounded-full"><Bell className="h-4 w-4 text-indigo-500" /></div>;
      case 'liquidity':
        return <div className="bg-purple-500/20 p-1 rounded-full"><Clock className="h-4 w-4 text-purple-500" /></div>;
      default:
        return <div className="bg-gray-500/20 p-1 rounded-full"><Bell className="h-4 w-4 text-gray-500" /></div>;
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    }
  };

  // Format time for volume alerts
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Get priority decoration classes
  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-orange-500';
      case 'critical':
        return 'border-l-4 border-red-500';
      case 'medium':
        return 'border-l-4 border-blue-500';
      case 'low':
      default:
        return 'border-l-4 border-transparent';
    }
  };

  // Get total unread count
  const totalUnreadCount = unreadCount + unreadVolumeAlertsCount;

  // Render different content based on activeTab
  const renderContent = () => {
    if (activeTab === 'volume') {
      return renderVolumeAlerts();
    } else if (activeTab === 'notifications') {
      return renderNotifications();
    } else {
      // Show both (all tab)
      return (
        <>
          {renderNotifications()}
          {volumeAlerts.length > 0 && (
            <>
              <DropdownMenuSeparator className="bg-white/10" />
              {renderVolumeAlerts()}
            </>
          )}
        </>
      );
    }
  };

  // Render notifications list
  const renderNotifications = () => {
    if (notifications.length === 0) {
      return (
        <div className="py-8 text-center text-white/50 text-sm">
          No notifications
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto py-1">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              p-3 hover:bg-white/5 relative
              ${notification.status === 'unread' ? 'bg-white/10' : ''}
              ${getPriorityClasses(notification.priority)}
            `}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-0.5">
                  <h5 className="font-medium text-sm truncate pr-4">{notification.title}</h5>
                  <span className="text-[10px] text-white/50">
                    {formatTimestamp(notification.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-white/70 mb-2 line-clamp-2">{notification.message}</p>

                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        className={`
                          text-[10px] px-2 py-0.5 rounded
                          ${action.action === 'dismiss' ? 'bg-transparent border border-white/20 hover:bg-white/10' : 'bg-white/10 hover:bg-white/20'}
                          ${action.action === 'view-transaction' ? 'flex items-center gap-0.5' : ''}
                        `}
                        onClick={() => handleNotificationAction(notification, index)}
                      >
                        {action.label}
                        {action.action === 'view-transaction' && <ExternalLink className="h-3 w-3 inline-block" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick dismiss button */}
            <button
              className="absolute top-2 right-2 text-white/50 hover:text-white"
              onClick={() => handleDismiss(notification.id)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    );
  };

  // Render volume alerts list
  const renderVolumeAlerts = () => {
    if (volumeAlerts.length === 0) {
      return (
        <div className="py-8 text-center text-white/50 text-sm">
          No volume alerts
        </div>
      );
    }

    return (
      <div className="max-h-96 overflow-y-auto py-1">
        <DropdownMenuLabel className="px-4 py-2 text-xs font-mono">VOLUME ALERTS</DropdownMenuLabel>
        {volumeAlerts.slice(0, 5).map(alert => (
          <div
            key={alert.id}
            className={`p-3 hover:bg-white/5 border-b border-white/5 relative ${
              alert.read ? 'opacity-60' : 'bg-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                <div
                  className={`w-2 h-2 rounded-full mr-2 ${
                    alert.isPositive ? 'bg-[#4caf50]' : 'bg-[#f44336]'
                  } ${!alert.read ? 'animate-pulse' : ''}`}
                ></div>
                <div className="text-xs font-mono">{alert.chainName}</div>
              </div>
              <div className="text-xs opacity-70">{formatTime(alert.timestamp)}</div>
            </div>
            <div className="mt-1 text-xs flex items-center">
              {alert.timeframe === '1h' ? 'Hourly' : '24h'} volume {alert.isPositive ? 'up' : 'down'} {Math.abs(alert.changePercent).toFixed(1)}%
              {alert.isPositive ?
                <TrendingUp className="h-3 w-3 ml-1 text-green-500" /> :
                <TrendingDown className="h-3 w-3 ml-1 text-red-500" />
              }
            </div>
            {!alert.read && (
              <div className="mt-2 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="px-2 py-0.5 text-[10px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMarkVolumeAlertAsRead(alert.id);
                  }}
                >
                  DISMISS
                </Button>
              </div>
            )}
          </div>
        ))}
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
            VIEW ALL VOLUME ALERTS
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={open => {
      if (open) handleDropdownOpen();
      setIsOpen(open);
    }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative w-8 h-8 p-0 border border-white/20">
          <Bell className="h-5 w-5" />
          {totalUnreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 bg-black border border-white/20">
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
          <h4 className="font-semibold text-sm">Notifications</h4>
          <div className="flex gap-1">
            {!notificationsEnabled && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs py-1 h-7"
                onClick={handleRequestPermissions}
              >
                Enable Notifications
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-xs py-1 h-7"
              onClick={handleClearAll}
            >
              Clear All
            </Button>
          </div>
        </div>

        {/* Tabs for different notification types */}
        <div className="flex border-b border-white/10">
          <button
            className={`flex-1 py-2 text-xs ${activeTab === 'all' ? 'border-b-2 border-white font-semibold' : 'text-white/60'}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`flex-1 py-2 text-xs ${activeTab === 'notifications' ? 'border-b-2 border-white font-semibold' : 'text-white/60'}`}
            onClick={() => setActiveTab('notifications')}
          >
            Notifications {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            className={`flex-1 py-2 text-xs ${activeTab === 'volume' ? 'border-b-2 border-white font-semibold' : 'text-white/60'}`}
            onClick={() => setActiveTab('volume')}
          >
            Volume {unreadVolumeAlertsCount > 0 && `(${unreadVolumeAlertsCount})`}
          </button>
        </div>

        {/* Content based on active tab */}
        {renderContent()}

        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          className="text-xs justify-center text-white/50 hover:text-white cursor-pointer"
          onClick={handleClearAll}
        >
          Clear All Notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
