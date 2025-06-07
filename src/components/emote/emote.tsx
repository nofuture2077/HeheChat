import React from 'react';
import { Tooltip, Image, Stack, Text } from '@mantine/core';

export interface EmoteComponentProps {
  imageUrl: string;
  largeImageUrl: string;
  name: string;
  type: string;
  marginL?: string;
  large?: boolean;
}

export const EmoteComponent: React.FC<EmoteComponentProps> = ({ imageUrl, largeImageUrl, name, type, marginL, large }) => {
  return (
    <Tooltip color="gray"
      withArrow
      withinPortal={true}
      position="top"
      events={{ hover: true, focus: true, touch: true }}
      className='emote'
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
      <Image src={large ? largeImageUrl : imageUrl} alt={name} w='auto' h='1.5em' style={{marginLeft: marginL}} display='inline' />
    </Tooltip>
  );
};

export const EmoteComponentSimple: React.FC<EmoteComponentProps> = ({ imageUrl, largeImageUrl, name, type, marginL, large }) => {
  return (
      <img src={large ? largeImageUrl : imageUrl} alt={name} width='auto' height='1.5rem' style={{marginLeft: marginL, display: 'inline', verticalAlign: 'bottom'}}  />
  );
};

