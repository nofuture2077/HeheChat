import { AdminHomePage } from './pages/AdminHome.page';
import { AdminConnectionsPage } from './pages/AdminConnections.page';
import { AdminAnalyticsPage } from './pages/AdminAnalytics.page';
import { LoginContextContext } from './ApplicationContext';
import { useContext, useState } from 'react';
import { AppShell, Burger, Group, NavLink } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconDashboard, IconUsers, IconChartBar } from '@tabler/icons-react';
import { HeaderLogo } from './components/header/HeaderLogo';

export function AdminRouter() {
  const loginContext = useContext(LoginContextContext);
  const [opened, { toggle }] = useDisclosure();
  const [activeSection, setActiveSection] = useState('dashboard');

  // Check if user is logged in
  if (!loginContext.isLoggedIn()) {
    return <AdminHomePage />;
  }

  // Check if user is admin
  if (!loginContext.isAdmin || !loginContext.isAdmin()) {
    return <AdminHomePage showAccessDenied={true} />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'connections':
        return <AdminConnectionsPage />;
      case 'analytics':
        return <AdminAnalyticsPage />;
      default:
        return <AdminConnectionsPage />; // Default to connections page
    }
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group>
            <HeaderLogo size={32} />
            <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>HeheChat Admin</span>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          href="#"
          label="Active Connections"
          leftSection={<IconUsers size="1rem" />}
          active={activeSection === 'connections'}
          onClick={() => setActiveSection('connections')}
        />
        <NavLink
          href="#"
          label="Analytics"
          leftSection={<IconChartBar size="1rem" />}
          active={activeSection === 'analytics'}
          onClick={() => setActiveSection('analytics')}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {renderContent()}
      </AppShell.Main>
    </AppShell>
  );
}
