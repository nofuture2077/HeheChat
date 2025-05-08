import Login from '@/components/login/login';
import { Image, Stack, Text } from '@mantine/core';
import classes from './home.module.css'
import logosimple from "./LogoSimple.svg"
import hehechat from "./HEHEChat.svg"
import nofuture from "./NoFuture.svg"
// Import version from package.json
import { version } from '../../package.json';

export function HomePage() {
  return (
    <div className={classes.layout}>
      <Stack align="center">
        <Image src={logosimple} className={classes.logosmall} />
        <Image src={hehechat} className={classes.logo} />
      </Stack>
      <Login color1="#DB32BC" color2="#ff1493"/>
      <div>
        <Image src={nofuture} className={classes.nofuture} />
      </div>
      <Text size="xs" c="dimmed" style={{ position: 'absolute', bottom: '22px', right: '22px', textAlign: 'center' }}>
          v{version}
      </Text>
    </div>
  );
}
