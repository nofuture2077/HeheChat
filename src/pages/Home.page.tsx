import Login from '@/components/login/login';
import { Stack, Group, Text, Image, Affix } from '@mantine/core';
import classes from './home.module.css'
import logo from "./logo.svg"

export function HomePage() {
  return (
    <>
    <Stack className={classes.layout}>
      <Group className={classes.hero} justify='center' pb={60} pt={50}>
        <Image src={logo} height={232}/>
        <Stack>
          <div>
            <Text ta="center" fw={600} size="92px" style={{color: "rgba(255,255,255, 1)", marginBottom: 0, letterSpacing: "12px", textShadow: "3px 3px rgba(255, 255, 255, 0.3)"}}>HEHE</Text>
            <Text ta="center" fw={400} size="68px" style={{color: "rgba(255,255,255, 1)", marginBottom: "10px", lineHeight: "44px", letterSpacing: "6px", textShadow: "3px 3px rgba(255, 255, 255, 0.3)"}}>CHAT</Text>
          </div>
        </Stack>
      </Group>
      <Group justify='center' mt={0}><Login /></Group>
    </Stack>
    <Stack style={{position: 'fixed', bottom: 0, width: '100%', textAlign: 'center'}} gap={0}>
      <Group style={{textAlign: 'center'}} justify='space-between' p="10">
        <Text c="dimmed" size="sm" fs="italic">Proudly created by NoFuture</Text>
        <Text c="dimmed" size="sm" fs="italic">Build: #{import.meta.env.VITE_BUILDNUMBER}</Text>
      </Group>
    </Stack>
    </>
  );
}
