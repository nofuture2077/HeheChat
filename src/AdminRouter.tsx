import { useContext, useState } from 'react';
import { AppShell, Burger, Group, NavLink, Text } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconDashboard,
  IconUsers,
  IconChartBar,
  IconNews,
  IconCrown,
  IconSettings,
  IconBell,
} from '@tabler/icons-react';
import { AdminHomePage } from './pages/AdminHome.page';
import { AdminConnectionsPage } from './pages/AdminConnections.page';
import { AdminChannelManagementPage } from './pages/AdminChannelManagement.page';
import { AdminAnalyticsPage } from './pages/AdminAnalytics.page';
import { AdminNewsPage } from './pages/AdminNews.page';
import { AdminPremiumPage } from './pages/AdminPremium.page';
import { AdminAlertsPage } from './pages/AdminAlerts.page';
import { AdminDashboardPage } from './pages/AdminDashboard.page';
import { LoginContextContext } from './ApplicationContext';
import { HeaderLogo } from './components/header/HeaderLogo';

const NAV_GROUPS = [
  {
    label: 'Overview',
    links: [
      { key: 'dashboard', label: 'Dashboard', icon: IconDashboard },
      { key: 'analytics', label: 'Stream Analytics', icon: IconChartBar },
      { key: 'connections', label: 'Active Connections', icon: IconUsers },
    ],
  },
  {
    label: 'Management',
    links: [
      { key: 'channels', label: 'Channel Management', icon: IconSettings },
      { key: 'alerts', label: 'Alert Tokens', icon: IconBell },
      { key: 'news', label: 'News Management', icon: IconNews },
    ],
  },
  {
    label: 'Monetization',
    links: [{ key: 'premium', label: 'Premium Management', icon: IconCrown }],
  },
];

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
    return <AdminHomePage showAccessDenied />;
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'connections':
        return <AdminConnectionsPage />;
      case 'channels':
        return <AdminChannelManagementPage />;
      case 'analytics':
        return <AdminAnalyticsPage />;
      case 'news':
        return <AdminNewsPage />;
      case 'premium':
        return <AdminPremiumPage />;
      case 'alerts':
        return <AdminAlertsPage />;
      default:
        return <AdminDashboardPage />;
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
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <Text size="xs" fw={600} c="dimmed" tt="uppercase" mt="sm" mb={4} px="sm">
              {group.label}
            </Text>
            {group.links.map(({ key, label, icon: Icon }) => (
              <NavLink
                key={key}
                href="#"
                label={label}
                leftSection={<Icon size="1rem" />}
                active={activeSection === key}
                onClick={() => setActiveSection(key)}
              />
            ))}
          </div>
        ))}
      </AppShell.Navbar>

      <AppShell.Main>{renderContent()}</AppShell.Main>
    </AppShell>
  );
}
