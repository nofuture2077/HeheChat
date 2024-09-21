import React from 'react';
import { Tooltip, Image, Stack, Text } from '@mantine/core';

export interface EmoteComponentProps {
  imageUrl: string;
  largeImageUrl: string;
  name: string;
  type: string;
}

export const EmoteComponent: React.FC<EmoteComponentProps> = ({ imageUrl, largeImageUrl, name, type }) => {
  return (
    <Tooltip color="gray"
      withArrow
      withinPortal={true}
      position="top"
      events={{ hover: true, focus: true, touch: true }}
      label={
        <Stack align="center" gap="xs">
          <Image src={largeImageUrl} alt={name} h={64} />
          <Text fw={500}>{name}</Text>
          <Text size="xs" variant="dimmed">
            {type}
          </Text>
        </Stack>
      }
    >
      <Image src={imageUrl} alt={name} w='auto' h='1.3rem' display='inline' />
    </Tooltip>
  );
};
