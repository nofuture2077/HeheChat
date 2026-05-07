import { useState, useEffect, useContext } from 'react';
import { Button, Text, Stack, Group, Alert, Fieldset, TagsInput, Switch, Space } from '@mantine/core';
import { IconBellRinging, IconBellOff, IconAlertCircle } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import { NotificationSettings as NotificationSettingsType } from '@/commons/config';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const sendNotificationSettingsToBackend = async (settings: NotificationSettingsType) => {
  try {
    const token = localStorage.getItem('hehe-token_state') || '';
    await fetch(`${BASE_URL}/push/settings?token=${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings }),
    });
  } catch (error) {
    console.error('Error sending notification settings to server:', error);
  }
};

const fetchNotificationSettings = async (): Promise<NotificationSettingsType> => {
  try {
    const token = localStorage.getItem('hehe-token_state') || '';
    const response = await fetch(`${BASE_URL}/push/settings?token=${token}`);
    if (!response.ok) return emptySettings();
    const data = await response.json();
    return data.settings || emptySettings();
  } catch {
    return emptySettings();
  }
};

const emptySettings = (): NotificationSettingsType => ({
  streamStartChannels: [],
  chatMentionChannels: [],
  chatMentionUsers: [],
  chatMention: false,
});

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getSubscriptionStatus() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export function NotificationEnableSection() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [notificationsSupported, setNotificationsSupported] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setNotificationsSupported(supported);
    if (!supported) return;

    setPermissionStatus(Notification.permission);
    navigator.serviceWorker.ready.then(reg => {
      setRegistration(reg);
      return reg.pushManager.getSubscription();
    }).then(sub => {
      setIsSubscribed(!!sub);
      setSubscription(sub);
    }).catch(() => setError('Failed to get subscription information.'));

    const token = localStorage.getItem('hehe-token_state') || '';
    fetch(`${BASE_URL}/push/vapidPublicKey?token=${token}`)
      .then(r => r.json())
      .then(d => setVapidPublicKey(d.vapidPublicKey))
      .catch(() => setError('Failed to fetch server configuration for push notifications.'));
  }, []);

  const subscribe = async () => {
    try {
      setError(null);
      if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        if (permission !== 'granted') throw new Error('Permission not granted');
      }
      if (!registration || !vapidPublicKey) throw new Error('Service worker not ready');
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      setSubscription(sub);
      setIsSubscribed(true);
      const token = localStorage.getItem('hehe-token_state') || '';
      await fetch(`${BASE_URL}/push/subscribe?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          userAgent: navigator.userAgent,
          deviceType: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        }),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe');
    }
  };

  const unsubscribe = async () => {
    try {
      setError(null);
      if (!subscription) throw new Error('No active subscription');
      await subscription.unsubscribe();
      setIsSubscribed(false);
      setSubscription(null);
      const token = localStorage.getItem('hehe-token_state') || '';
      await fetch(`${BASE_URL}/push/unsubscribe?token=${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    } catch (err: any) {
      setError(err.message || 'Failed to unsubscribe');
    }
  };

  if (!notificationsSupported) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Not Supported" color="red">
        Push notifications are not supported in this browser.
      </Alert>
    );
  }

  return (
    <Fieldset legend="Push Notifications" variant="filled">
      <Stack gap="sm">
        {error && (
          <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" withCloseButton onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {permissionStatus === 'denied' && (
          <Alert icon={<IconAlertCircle size={16} />} title="Permission Denied" color="orange">
            Notification permission has been denied. Please update your browser settings.
          </Alert>
        )}
        <Group justify="space-between">
          <Stack gap={2}>
            <Text fw={500}>Enable Push Notifications</Text>
            <Text size="xs" c="dimmed">
              {isSubscribed ? 'You are currently receiving push notifications' : 'Subscribe to receive notifications when the app is closed'}
            </Text>
          </Stack>
          <Button
            leftSection={isSubscribed ? <IconBellOff size={16} /> : <IconBellRinging size={16} />}
            color={isSubscribed ? 'red' : 'blue'}
            onClick={isSubscribed ? unsubscribe : subscribe}
            loading={!registration || !vapidPublicKey}
            disabled={permissionStatus === 'denied'}
          >
            {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
          </Button>
        </Group>
        {isSubscribed && (
          <Text size="xs" c="dimmed">
            Device type: {/Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'}
          </Text>
        )}
      </Stack>
    </Fieldset>
  );
}

export function NotificationStreamStartSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsType>(emptySettings());

  useEffect(() => {
    getSubscriptionStatus().then(sub => setIsSubscribed(!!sub));
    fetchNotificationSettings().then(setSettings);
  }, []);

  const handleChange = (channels: string[]) => {
    const updated = { ...settings, streamStartChannels: channels.map(c => c.toLowerCase().substring(0, 25).trim()) };
    setSettings(updated);
    sendNotificationSettingsToBackend(updated);
  };

  return (
    <Stack mt={30} mb={30} gap={30}>
      <Fieldset legend="Stream Start Notifications" variant="filled">
        <TagsInput
          placeholder="Type a channel name and press Enter"
          value={settings.streamStartChannels}
          onChange={handleChange}
          disabled={!isSubscribed}
          clearable
        />
        <Space h="xs" />
        <Text size="xs" c="dimmed">Add channels to receive notifications when they go live.</Text>
      </Fieldset>
    </Stack>
  );
}

export function NotificationChatMentionSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [settings, setSettings] = useState<NotificationSettingsType>(emptySettings());
  const premium = useContext(PremiumContext);

  useEffect(() => {
    getSubscriptionStatus().then(sub => setIsSubscribed(!!sub));
    fetchNotificationSettings().then(setSettings);
  }, []);

  const handleChange = (updated: NotificationSettingsType) => {
    setSettings(updated);
    sendNotificationSettingsToBackend(updated);
  };

  const disabled = !isSubscribed || !premium.isPremium;

  return (
    <Stack mt={30} mb={30} gap={30}>
      <Fieldset legend="Chat Mention Notifications" variant="filled">
        <Stack gap="sm">
          <Group justify="space-between">
            <Stack gap={2}>
              <Text fw={500}>Enable Chat Mention Notifications</Text>
              <Text size="xs" c="dimmed">Receive notifications when you're mentioned in chat</Text>
            </Stack>
            <Switch
              checked={settings.chatMention || false}
              onChange={(e) => handleChange({ ...settings, chatMention: e.currentTarget.checked })}
              disabled={disabled}
            />
          </Group>
        </Stack>
      </Fieldset>

      <Fieldset legend="Channels to Monitor" variant="filled">
        <TagsInput
          placeholder="Type a channel name and press Enter"
          value={settings.chatMentionChannels}
          onChange={(v) => handleChange({ ...settings, chatMentionChannels: v.map(c => c.toLowerCase().substring(0, 25).trim()) })}
          disabled={disabled || !settings.chatMention}
          clearable
        />
        <Space h="xs" />
        <Text size="xs" c="dimmed">Channels to watch for mentions. Leave empty to watch all channels.</Text>
      </Fieldset>

      <Fieldset legend="Only from Specific Users" variant="filled">
        <TagsInput
          placeholder="Type a username and press Enter"
          value={settings.chatMentionUsers}
          onChange={(v) => handleChange({ ...settings, chatMentionUsers: v.map(c => c.toLowerCase().substring(0, 25).trim()) })}
          disabled={disabled || !settings.chatMention}
          clearable
        />
        <Space h="xs" />
        <Text size="xs" c="dimmed">Only notify for mentions from these users. Leave empty to receive from everyone.</Text>
      </Fieldset>
    </Stack>
  );
}

// Legacy export kept for any existing direct usages
export function NotificationSettings() {
  return (
    <Stack gap="xl" mt="md">
      <NotificationEnableSection />
      <NotificationStreamStartSettings />
      <NotificationChatMentionSettings />
    </Stack>
  );
}
