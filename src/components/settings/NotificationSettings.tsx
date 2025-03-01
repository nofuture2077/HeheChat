import { useState, useEffect, useContext } from 'react';
import { Button, Switch, Text, Stack, Group, Alert, Paper, Title, Divider, List, Code, Accordion, Checkbox, TextInput, Badge, TagsInput } from '@mantine/core';
import { IconBellRinging, IconBellOff, IconAlertCircle, IconPlus } from '@tabler/icons-react';
import { ConfigContext } from '@/ApplicationContext';
import { NotificationSettingType } from '@/commons/config';

// Channel notification list component
interface ChannelNotificationListProps {
  type: 'streamStart' | 'chatMention';
  isSubscribed: boolean;
  disabled: boolean;
}

function ChannelNotificationList({ type, isSubscribed, disabled }: ChannelNotificationListProps) {
  const config = useContext(ConfigContext);
  const [channels, setChannels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Load channels from config
  useEffect(() => {
    if (type === 'streamStart') {
      setChannels(config.notificationSettings?.streamStartChannels || []);
    } else if (type === 'chatMention') {
      setChannels(config.notificationSettings?.chatMentionChannels || []);
    }
  }, [config.notificationSettings, type]);
  
  // Update channels when tags change
  const handleTagsChange = (values: string[]) => {
    if (disabled || !isSubscribed) return;
    
    setIsLoading(true);
    try {
      // Transform channel names: trim whitespace and convert to lowercase
      const normalizedValues = values.map(channel => channel.trim().toLowerCase());
      
      // Update the notification settings in the config
      if (type === 'streamStart' && config.setChannelNotificationSetting) {
        config.setChannelNotificationSetting('streamStartChannels', normalizedValues);
      } else if (type === 'chatMention' && config.setChannelNotificationSetting) {
        config.setChannelNotificationSetting('chatMentionChannels', normalizedValues);
      }
      
      setChannels(normalizedValues);
    } catch (error) {
      console.error('Error updating channels:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Stack>
      <Text size="sm" fw={500}>Channels</Text>
      
      <TagsInput
        placeholder="Type a channel name and press Enter"
        value={channels}
        onChange={handleTagsChange}
        disabled={disabled || !isSubscribed}
        clearable
        maxDropdownHeight={200}
      />
      
      <Text size="xs" c="dimmed">
        {type === 'streamStart'
          ? 'If no channels are specified, you will receive notifications for all channels you follow.'
          : 'If no channels are specified, you will receive notifications for mentions in all channels.'}
      </Text>
    </Stack>
  );
}

// Convert a base64 string to a Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function NotificationSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const config = useContext(ConfigContext);

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setNotificationsSupported(supported);
    
    if (supported) {
      // Get the current permission status
      setPermissionStatus(Notification.permission);
      
      // Get the service worker registration
      navigator.serviceWorker.ready
        .then(reg => {
          setRegistration(reg);
          return reg.pushManager.getSubscription();
        })
        .then(sub => {
          setIsSubscribed(!!sub);
          setSubscription(sub);
        })
        .catch(err => {
          console.error('Error getting subscription:', err);
          setError('Failed to get subscription information.');
        });
      
      // Fetch the VAPID public key from the server
      fetchVapidPublicKey();
    }
  }, []);

  // Fetch the VAPID public key from the server
  const fetchVapidPublicKey = async () => {
    try {
      const BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('hehe-token_state') || '';
      const response = await fetch(`${BASE_URL}/push/vapidPublicKey?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch VAPID public key');
      }
      
      const data = await response.json();
      setVapidPublicKey(data.vapidPublicKey);
    } catch (err) {
      console.error('Error fetching VAPID public key:', err);
      setError('Failed to fetch server configuration for push notifications.');
    }
  };

  // Subscribe to push notifications
  const subscribeToNotifications = async () => {
    try {
      setError(null);
      
      // Request permission if not already granted
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission !== 'granted') {
          throw new Error('Permission not granted for notifications');
        }
      }
      
      if (!registration || !vapidPublicKey) {
        throw new Error('Service worker not registered or VAPID key not available');
      }
      
      // Subscribe to push notifications
      const subscriptionOptions = {
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      };
      
      const newSubscription = await registration.pushManager.subscribe(subscriptionOptions);
      setSubscription(newSubscription);
      setIsSubscribed(true);
      
      // Send the subscription to the server
      await sendSubscriptionToServer(newSubscription);
      
    } catch (err: any) {
      console.error('Error subscribing to push notifications:', err);
      setError(err.message || 'Failed to subscribe to push notifications');
    }
  };

  // Unsubscribe from push notifications
  const unsubscribeFromNotifications = async () => {
    try {
      setError(null);
      
      if (!subscription) {
        throw new Error('No active subscription found');
      }
      
      // Unsubscribe from push notifications
      await subscription.unsubscribe();
      setIsSubscribed(false);
      setSubscription(null);
      
      // Send the unsubscription to the server
      await sendUnsubscriptionToServer(subscription);
      
    } catch (err: any) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err.message || 'Failed to unsubscribe from push notifications');
    }
  };

  // Send the subscription to the server
  const sendSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('hehe-token_state') || '';
      
      const response = await fetch(`${BASE_URL}/push/subscribe?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
      
    } catch (err) {
      console.error('Error sending subscription to server:', err);
      throw new Error('Failed to register with notification server');
    }
  };

  // Send the unsubscription to the server
  const sendUnsubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const BASE_URL = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('hehe-token_state') || '';
      
      const response = await fetch(`${BASE_URL}/push/unsubscribe?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send unsubscription to server');
      }
      
    } catch (err) {
      console.error('Error sending unsubscription to server:', err);
      throw new Error('Failed to unregister from notification server');
    }
  };

  // If push notifications are not supported, show a message
  if (!notificationsSupported) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Not Supported" color="red">
        Push notifications are not supported in this browser. Please use a modern browser that supports service workers and push notifications.
      </Alert>
    );
  }

  return (
    <Stack gap={"xs"} mt={"md"}>
        <Title order={3}>Push Notifications</Title>
        <Text size="sm" c="dimmed">
          Receive notifications even when the app is closed.
        </Text>
        
        <Divider />
        
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {permissionStatus === 'denied' && (
          <Alert icon={<IconAlertCircle size={16} />} title="Permission Denied" color="orange">
            Notification permission has been denied. Please update your browser settings to allow notifications from this site.
          </Alert>
        )}
        
        <Group justify="space-between">
          <div>
            <Text fw={500}>Enable Push Notifications</Text>
            <Text size="xs" c="dimmed">
              {isSubscribed 
                ? 'You are currently receiving push notifications' 
                : 'Subscribe to receive notifications even when the app is closed'}
            </Text>
          </div>
          <Button 
            leftSection={isSubscribed ? <IconBellOff size={16} /> : <IconBellRinging size={16} />}
            color={isSubscribed ? 'red' : 'blue'}
            onClick={isSubscribed ? unsubscribeFromNotifications : subscribeToNotifications}
            loading={!registration || !vapidPublicKey}
            disabled={permissionStatus === 'denied'}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </Button>
        </Group>
        
        <Divider />
        
        <Title order={4}>Notification Settings</Title>
        
        <Stack>
          {/* Stream Start Notifications */}
          <Stack>
            <Switch
              label="Stream Start Notifications"
              checked={config.notificationSettings?.streamStart ?? true}
              onChange={(event) => config.setNotificationSetting?.('streamStart', event.currentTarget.checked)}
              disabled={!isSubscribed}
            />
            
            <ChannelNotificationList
              type="streamStart"
              isSubscribed={isSubscribed}
              disabled={!config.notificationSettings?.streamStart}
            />
          </Stack>
        </Stack>
        
        {isSubscribed && (
          <>
            <Divider />
            <Title order={4}>Device Information</Title>
            <Text size="sm">This device is registered to receive notifications.</Text>
            <Text size="xs" c="dimmed">Device Type: {/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}</Text>
          </>
        )}
    </Stack>
  );
}
