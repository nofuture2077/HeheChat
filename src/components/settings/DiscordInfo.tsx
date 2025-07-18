import { Fieldset, Stack, Text, Button, Group, Anchor, Box } from '@mantine/core';
import { IconBrandDiscord } from '@tabler/icons-react';

export function DiscordInfo() {
  const discordLink = "https://discord.gg/VzBVvM4kyz";

  return (
    <Stack mt={30} mb={30} gap={30}>
      <Fieldset legend="HeheChat Discord Community" variant="filled">
        <Stack gap="md">
          <Group justify="center" mt="md">
            <IconBrandDiscord size={48} color="#5865F2" />
          </Group>
          
          <Text ta="center" size="lg" fw={600}>
            Join our Discord Community!
          </Text>
          
          <Text ta="center">
            Connect with other HeheChat users, get the latest updates, and be part of our growing community.
          </Text>
          
          <Box style={{ padding: '15px', borderRadius: '8px' }} bg='light-dark(rgb(228, 228, 255),rgb(34, 34, 42))'>
            <Text size="sm" fw={500} mb={5}>
              In our Discord server you'll find:
            </Text>
            <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
              <li><Text size="sm">Release announcements and updates</Text></li>
              <li><Text size="sm">Support channels for troubleshooting</Text></li>
              <li><Text size="sm">Feature request discussions</Text></li>
              <li><Text size="sm">Guides and tutorials</Text></li>
              <li><Text size="sm">Community feedback</Text></li>
            </ul>
          </Box>
          
          <Button 
            component="a" 
            href={discordLink} 
            target="_blank" 
            rel="noopener noreferrer"
            size="md"
            fullWidth
            color="#5865F2"
            leftSection={<IconBrandDiscord size={20} />}
          >
            Join Discord Server
          </Button>
          
          <Text size="xs" c="dimmed" ta="center">
            By joining our Discord, you'll be the first to know about new features and updates.
          </Text>
        </Stack>
      </Fieldset>
    </Stack>
  );
}
