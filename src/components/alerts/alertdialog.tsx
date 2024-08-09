import classes from './alertdialog.module.css'
import { Title, Button, Group } from '@mantine/core';
import { IconX } from '@tabler/icons-react';

export interface AlertsProperties {
    close: () => void;
}

export function Alerts(props: AlertsProperties) {
    return (
        <nav className={classes.navbar}>
          <Group className={classes.header} justify='space-between' p='md'>
            <Title order={4}>
              Alerts
            </Title>
            <Button onClick={props.close} variant='subtle' color='primary'>
              <IconX />
            </Button>
          </Group>
            <div className={classes.main}>
            </div>
        </nav>
      );
}