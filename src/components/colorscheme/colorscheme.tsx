import { Stack, useMantineColorScheme } from '@mantine/core';
import { GradientSegmentedControl } from '../GradientSegmentedControl/GradientSegmentedControl';

export function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <Stack>
      <GradientSegmentedControl
        data={[
          { label: 'Light', value: 'light' },
          { label: 'Dark', value: 'dark' },
          { label: 'Auto', value: 'auto' },
        ]}
        value={colorScheme}
        setValue={(value) => setColorScheme(value as 'light' | 'dark' | 'auto')}
      />
    </Stack>
  );
}
