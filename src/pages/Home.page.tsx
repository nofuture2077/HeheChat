import Login from '@/components/login/login';
import { Stack, Group, Text, Space, Image } from '@mantine/core';
import classes from './home.module.css'
import icon from "./Icon_clean.svg"

export function HomePage() {
  return (
    <Stack className={classes.layout}>
      <Group className={classes.hero} justify='center' pb={60} pt={50}>
        <Image src={icon} height={192}/>
        <Stack>
          <div>
            <Text ta="center" fw={600} size="92px" style={{marginBottom: 0, letterSpacing: "12px", textShadow: "3px 3px rgba(255, 255, 255, 0.2)"}}>HEHE</Text>
            <Text ta="center" fw={400} size="68px" style={{marginBottom: "10px", lineHeight: "44px", letterSpacing: "6px", textShadow: "3px 3px rgba(255, 255, 255, 0.2)"}}>CHAT</Text>
          </div>
          <div>
            <Space h="xs"/>
            <Text fw={300} size="lg">Best multi channel App for Twitch *</Text>
            <Space h="xs"/>
            <Text fw={200} size="lg" fs="italic">(*) Early Alpha</Text>
          </div>
        </Stack>
      </Group>
      <Group justify='center' mt={0}><Login /></Group>
    </Stack>
  );
}
