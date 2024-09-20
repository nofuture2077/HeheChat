import { Button, Group, useMantineColorScheme } from '@mantine/core';

export function ColorSchemeToggle() {
  const { setColorScheme } = useMantineColorScheme();

  return (
    <Group justify="space-around">
      <Button variant="light" onClick={() => setColorScheme('light')}>Light</Button>
      <Button variant="light" onClick={() => setColorScheme('dark')}>Dark</Button>
      <Button variant="light" onClick={() => setColorScheme('auto')}>Auto</Button>
    </Group>
  );
}
