import Login from '@/components/login/login';
import { Stack, Group, Text, Space } from '@mantine/core';
import classes from '../components/home/home.module.css'
import { IconMessageChatbot } from '@tabler/icons-react';

export function HomePage() {
  return (
    <Stack className={classes.layout}>
      <Group className={classes.hero} justify='center' pb={70} pt={35}>
        <IconMessageChatbot size={148}/>
        <Stack>
          <h1 style={{marginBottom: 0}}>HEHE Chat</h1>
          <Text fw={700} size="lg">Best multi channel Chat Client for Twitch *</Text>

          <Text fw={100} size="lg">(*) Early Alpha</Text>
        </Stack>
      </Group>
      <Group justify='center' mt={70}><Login /></Group>
    </Stack>
  );
}
