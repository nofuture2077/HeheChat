import { Stack, Title, Text, Button, Group, List, Card, Box } from '@mantine/core';
import { IconGift, IconInfoCircle, IconBrandDiscord, IconExternalLink, IconX } from '@tabler/icons-react';
import { OverlayDrawer } from '../../pages/Chat.page';

export const PremiumDrawer: OverlayDrawer = {
    name: 'massban',
    component: DonationModal,
    size: 'xl',
    position: 'bottom'
};

interface DonationModalProps {
  close: () => void;
}

function DonationModal(props: DonationModalProps) {
  return <Stack>
        <Group justify='space-between' p='md'>
            <Title order={4}>
                HeheChat needs your support!
            </Title>
            {props.close ? 
            <Button onClick={props.close} variant='subtle' color='primary'>
                <IconX />
            </Button> : <span></span>
            }
        </Group>
        <DonationPremium/>
    </Stack>
}

export function DonationPremium() {
  const handleDonateClick = () => {
    window.open('https://pally.gg/p/hehechat', '_blank');
  };

  return (
    <Stack gap="lg" p="md">
      <Group justify="center" gap="sm">
        <IconGift size={32} style={{ color: 'var(--mantine-color-violet-6)' }} />
        <Title order={3}>Donation-Based Premium</Title>
      </Group>

      <Stack gap="md">
        <Text size="lg" fw={500} ta="center">
          Support HeheChat and get Premium as a gift!
        </Text>
        
        <Text ta="center" c="dimmed" size="md">
          For every <Text span fw={700} c="violet">$1</Text> you donate, you'll receive{' '}
          <Text span fw={700} c="grape">10 days</Text> of HeheChat Premium as our way of saying thank you!
        </Text>

        <Card withBorder padding="md" radius="md" mt="md">
          <Group gap="sm" mb="xs">
            <IconInfoCircle size="1.2rem" style={{ color: 'var(--mantine-color-blue-6)' }} />
            <Text fw={600} c="blue">Important Instructions</Text>
          </Group>
          <List spacing="xs" size="sm">
            <List.Item>
              <Text fw={500}>Use your Twitch username</Text> when making the donation on Pally
            </List.Item>
            <List.Item>
              Premium will be automatically added to your account within 24 hours
            </List.Item>
            <List.Item>
              Donations are processed through Pally.gg's secure platform
            </List.Item>
          </List>
        </Card>

        <Button
          size="lg"
          variant="gradient"
          gradient={{ from: 'violet', to: 'grape' }}
          leftSection={<IconExternalLink size="1.2rem" />}
          onClick={handleDonateClick}
          fullWidth
          mt="md"
        >
          Donate on Pally.gg
        </Button>

        <Text size="sm" ta="center" c="dimmed" mt="xs">
          Your donation helps us maintain and improve HeheChat for everyone!
        </Text>

        <Card withBorder padding="md" radius="md" mt="md" style={{ borderColor: 'var(--mantine-color-grape-4)' }}>
          <Group gap="sm" mb="xs">
            <IconBrandDiscord size="1.2rem" style={{ color: 'var(--mantine-color-grape-6)' }} />
            <Text fw={600} c="grape">Need Help?</Text>
          </Group>
          <Text size="sm">
            If you experience any problems with your donation or premium activation, 
            please contact us on our Discord server for assistance.
          </Text>
        </Card>
      </Stack>
    </Stack>
  );
};
