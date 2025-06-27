import { Container, Title, Text, Button, Alert, Stack, Center } from '@mantine/core';
import { IconAlertCircle, IconShieldLock } from '@tabler/icons-react';
import { useContext } from 'react';
import { LoginContextContext } from '../ApplicationContext';
import Login from '../components/login/login';
import { HeaderLogo } from '../components/header/HeaderLogo';

interface AdminHomePageProps {
  showAccessDenied?: boolean;
}

export function AdminHomePage({ showAccessDenied = false }: AdminHomePageProps) {
  const loginContext = useContext(LoginContextContext);

  if (showAccessDenied) {
    return (
      <Container size="sm" py="xl">
        <Center>
          <Stack align="center" gap="xl">
            <HeaderLogo size={64} />
            <Title order={1} ta="center">HeheChat Admin</Title>
            
            <Alert 
              icon={<IconShieldLock size="1rem" />} 
              title="Access Denied" 
              color="red"
              variant="light"
            >
              <Text>
                You don't have permission to access the admin panel. 
                Only authorized administrators can view this content.
              </Text>
            </Alert>

            <Text ta="center" c="dimmed">
              If you believe this is an error, please contact the system administrator.
            </Text>

            <Button 
              variant="light" 
              onClick={() => {
                localStorage.removeItem('hehe-token');
                localStorage.removeItem('hehe-token_state');
                window.location.reload();
              }}
            >
              Logout and Try Again
            </Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Center>
        <Stack align="center" gap="xl">
          <HeaderLogo size={64} />
          <Title order={1} ta="center">HeheChat Admin</Title>
          
          <Text ta="center" size="lg" c="dimmed">
            Welcome to the HeheChat administration panel. 
            Please log in with your Twitch account to continue.
          </Text>

          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="Admin Access Required" 
            color="blue"
            variant="light"
          >
            <Text>
              This panel is restricted to authorized administrators only. 
              You must be logged in with an admin account to access the dashboard.
            </Text>
          </Alert>

          <Login color1="#9146FF" color2="#772CE8" />
        </Stack>
      </Center>
    </Container>
  );
}
