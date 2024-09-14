import Login from '@/components/login/login';
import { Stack, Group, Text, Space, Image } from '@mantine/core';
import classes from './home.module.css'
import icon from "./Icon_clean.svg"

export function HomePage() {
  return (
    <Stack className={classes.layout}>
      <Group className={classes.hero} justify='center' pb={70} pt={35}>
        <Image src={icon} height={312}/>
        <Stack>
          <div>
            <Text ta="center" fw={900} size="128px" style={{marginBottom: 0}}>HEHE</Text>
            <Text ta="center" fw={500} size="96px" style={{marginBottom: "32px", lineHeight: "60px"}}>CHAT</Text>
          </div>
          <div>
            <Text fw={300} size="xl">Best multi channel Chat Client for Twitch *</Text>
            <Text fw={200} size="lg">(*) Early Alpha</Text>
          </div>
        </Stack>
      </Group>
      <Group justify='center' mt={70}><Login /></Group>
    </Stack>
  );
}
