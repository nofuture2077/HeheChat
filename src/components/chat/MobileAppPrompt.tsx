import { useEffect, useState } from 'react';
import { Paper, Text, Button, Group, Stack } from '@mantine/core';
import { IconShare, IconDeviceMobile, IconDotsVertical } from '@tabler/icons-react';

const PROMPT_SHOWN_KEY = 'mobile-app-prompt-shown';

function getDeviceOS() {
  const userAgent = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(userAgent)) {
    return 'iOS';
  }
  if (/Android/i.test(userAgent)) {
    return 'Android';
  }
  return null;
}

function getInstallInstructions() {
  const os = getDeviceOS();
  const userAgent = navigator.userAgent;
  if (os === 'iOS') {
    if (userAgent.includes('CriOS')) { // Chrome on iOS
      return "Tap the three dots (⋮) in the top-right corner, then select 'Share...' → 'Add to Home Screen'";
    }
    return "Tap the share button (□↑) in the bottom toolbar, then select 'Add to Home Screen'";
  }
  if (os === 'Android') {
    return "Tap the three dots (⋮) in the top-right corner, then select 'Add to Home screen'";
  }
  return null;
}

export function MobileAppPrompt() {
  const [show, setShow] = useState(false);
  const deviceOS = getDeviceOS();
  const instructions = getInstallInstructions();

  useEffect(() => {
    const hasShown = localStorage.getItem(PROMPT_SHOWN_KEY);
    if (!hasShown && deviceOS) {
      setShow(true);
    }
  }, [deviceOS]);

  if (!show || !instructions) {
    return null;
  }

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_SHOWN_KEY, 'true');
    setShow(false);
  };

  return (
    <Paper 
      shadow="sm" 
      p="md" 
      withBorder 
      style={{ 
        position: 'fixed', 
        bottom: '1rem', 
        left: '1rem', 
        right: '1rem',
        zIndex: 1000 
      }}
    >
      <Stack>
        <Group>
          <IconDeviceMobile size={24} />
          <Text fw={500}>Install HeheChat as an App</Text>
        </Group>
        <Text size="sm">
          Add HeheChat to your home screen for the best experience! Here's how:
        </Text>
        <Group align="flex-start" gap="xs">
          {deviceOS === 'iOS' && <IconShare size={20} />}
          {deviceOS === 'Android' && <IconDotsVertical size={20} />}
          <Text size="sm" c="dimmed" style={{ flex: 1 }}>
            {instructions}
          </Text>
        </Group>
        <Group justify="flex-end">
          <Button variant="subtle" onClick={handleDismiss}>Got it</Button>
        </Group>
      </Stack>
    </Paper>
  );
}
