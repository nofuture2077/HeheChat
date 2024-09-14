import Login from '@/components/login/login';
import { Stack, Group, Text, Space, Image } from '@mantine/core';
import classes from './home.module.css'
import icon from "./Icon_clean.svg"

export function HomePage() {
  return (
    <Stack className={classes.layout}>
      <Group className={classes.hero} justify='center' pb={50} pt={30}>
        <Image src={icon} height={192}/>
        <Stack>
          <div>
            <Text ta="center" fw={900} size="92px" style={{marginBottom: 0}}>HEHE</Text>
            <Text ta="center" fw={500} size="72px" style={{marginBottom: "10px", lineHeight: "60px"}}>CHAT</Text>
          </div>
          <div>
            <Text fw={300} size="lg">Best multi channel Chat Client for Twitch *</Text>
            <Text fw={200} size="lg">(*) Early Alpha</Text>
          </div>
        </Stack>
      </Group>
      <Group justify='center' mt={10}><Login /></Group>
    </Stack>
  );
}
