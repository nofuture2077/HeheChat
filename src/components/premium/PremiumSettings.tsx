import React, { useContext } from 'react';
import { Stack, Text, Divider } from '@mantine/core';
import { PremiumContext } from '@/ApplicationContext';
import { PremiumDetails } from './PremiumDetails';

export const PremiumSettings: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const premium = useContext(PremiumContext);

  return (
    <Stack key={refreshKey} gap="md">
      {!premium.isPremium && (
        <>
          <Text>Upgrade to HeheChat Pro to unlock premium features and support the development of HeheChat.</Text>
          <div>
            <Text fw={600} mb="xs">Premium Features:</Text>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li>Deluxe TTS Voices (ElevenLabs AI)</li>
              <li>Push Notifications for stream events</li>
              <li>Read All Chat Messages via TTS</li>
              <li>OBS Remote / Scene Switcher</li>
              <li>Cool HeheChat Pro Badge in chat</li>
            </ul>
          </div>
          <Divider />
        </>
      )}
      <PremiumDetails />
    </Stack>
  );
};
