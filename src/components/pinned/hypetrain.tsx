import { Text, Progress, Card, Badge, Group, Stack } from '@mantine/core';

interface HypetrainProps {
    id: string;
    level: number;
    progress: number;
    goal: number;
    endTime: Date;
}

export function Hypetrain(props: HypetrainProps) {
    return <Card withBorder radius="md" p="md" m="lg">
    <Stack gap={0}>
      <Group justify='space-between'>
        <Group gap='xs'>
          <Badge>LVL {props.level}</Badge>
          <Text>Hype Train</Text>
        </Group>
        <Text>04:20</Text>
      </Group>
      <Group justify='space-between'>
        <Text>Help supporting the Hypetrain</Text>
        <Text fw={900} size='48px'>73%</Text>
      </Group>
    </Stack>
  </Card>
}