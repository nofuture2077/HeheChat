import { UnstyledButton, Group, Avatar, Text, rem } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import classes from './userbutton.module.css';

export function UserButton(props: {avatarUrl: string, name: string, text: string}) {
  return (
    <UnstyledButton className={classes.user}>
      <Group flex={1}>
        <Avatar
          src={props.avatarUrl}
          radius="xl"
        />

        <div style={{ flex: 1 }}>
          <Text size="sm" fw={500}>
            {props.name}
          </Text>

          <Text c="dimmed" size="xs">
            {props.text}
          </Text>
        </div>

        <IconChevronRight style={{ width: rem(14), height: rem(14) }} stroke={1.5} />
      </Group>
    </UnstyledButton>
  );
}