import Login from '@/components/login/login';
import { Image, Stack } from '@mantine/core';
import classes from './home.module.css'
import logosimple from "./LogoSimple.svg"
import hehechat from "./HEHEChat.svg"
import nofuture from "./NoFuture.svg"

export function HomePage() {
  return (
    <div className={classes.layout}>
      <Stack align="center">
        <Image src={logosimple} className={classes.logosmall} />
        <Image src={hehechat} className={classes.logo} />
      </Stack>
      <Login color1="#DB32BC" color2="#ff1493"/>
      <Image src={nofuture} className={classes.nofuture} />
    </div>
  );
}
