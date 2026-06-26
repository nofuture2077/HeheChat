import { Container, Title, Text, Button, Alert, Stack, Badge, LoadingOverlay, Card, Group, Anchor, Tooltip, Grid } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconUsers, IconClock, IconWifi, IconDevices, IconExternalLink } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { LoginContextContext } from '@/ApplicationContext';

// Import SVG logo assets directly
import SeventvLogo from '@/res/7tv_logo.svg?react';
import StreamelementLogo from '@/res/streamelement_logo.svg?react';
import BlerpLogo from '@/res/blerp_logo.svg?react';
import SoundalertsLogo from '@/res/soundalerts_logo.svg?react';
import YoutubeLogo from '@/res/youtube_logo.svg?react';
import PallyLogo from '@/res/pally_logo.svg?react';

interface GroupedUser {
  userName: string;
  userId: string;
  channels: string[];
  isLive: boolean;
  streamInfo?: StreamInfo;
  services: {
    sevenTV: { connected: boolean; channel: string };
    streamelements: { connected: boolean; channel: string };
    blerp: { connected: boolean; channel: string };
    soundalerts: { connected: boolean; channel: string };
    pallygg: { connected: boolean; channel: string };
    youtube: { connected: boolean; channel: string };
  };
  connections: FlatConnection[];
}

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

// Map connection source names to distinct Mantine colors
const SOURCE_COLORS: Record<string, string> = {
  "replay app": 'blue',
  "browsersource": 'grape',
  "hehechat app": 'teal',
  "scene switcher": 'orange',
};

const getSourceColor = (source: string): string => {
  const key = source?.toLowerCase?.() ?? '';
  return SOURCE_COLORS[key] ?? 'gray';
};

interface ConnectionStatus {
  sevenTV: {
    connected: boolean;
    channelname: string;
  };
  streamelements: {
    connected: boolean;
    channelname: string;
  };
  blerp: {
    connected: boolean;
    channelname: string;
  };
  soundalerts: {
    connected: boolean;
    channelname: string;
  };
  pallygg: {
    connected: boolean;
    channelname: string;
  };
  youtube: {
    connected: boolean;
    channelname: string;
  };
}

interface StreamInfo {
  title: string;
  category: string;
  viewerCount: number;
  startTime: number;
}

interface Connection {
  guid: string;
  userId: string;
  userName: string;
  profileId: string;
  profileName: string;
  source: string;
  version: string;
  channels: string[];
  connectionStatus: ConnectionStatus;
  connectedAt: number;
  streamInfo?: StreamInfo;
}

interface ConnectionsResponse {
  connection_count: number;
  user_count: number;
  connections: Connection[];
}

interface FlatConnection {
  guid: string;
  userId: string;
  userName: string;
  profileId: string;
  profileName: string;
  source: string;
  version: string;
  channels: string[];
  sevenTVConnected: boolean;
  sevenTVChannel: string;
  streamElementsConnected: boolean;
  streamElementsChannel: string;
  blerpConnected: boolean;
  blerpChannel: string;
  soundalertsConnected: boolean;
  soundalertsChannel: string;
  pallyggConnected: boolean;
  pallyggChannel: string;
  youtubeConnected: boolean;
  youtubeChannel: string;
  connectedAt: number;
  streamInfo?: StreamInfo;
}

export function AdminConnectionsPage() {
  const loginContext = useContext(LoginContextContext);
  const [connections, setConnections] = useState<FlatConnection[]>([]);
  const [connectionStats, setConnectionStats] = useState({ connection_count: 0, user_count: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchConnections = async () => {
    const adminToken = localStorage.getItem('hehe-token_state');
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/api/admin/connections?token=${adminToken}`);
      if (!response.ok) {
        // Handle 401 Unauthorized - clear accessToken from localStorage and loginContext
        if (response.status === 401) {
          localStorage.removeItem('hehe-token_state');
          loginContext.setAccessToken(undefined);
          setError('Authentication failed. Please log in again.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ConnectionsResponse = await response.json();
      
      // Map the flat structure to our display format
      const flatConnections: FlatConnection[] = data.connections.map(conn => ({
        guid: conn.guid,
        userId: conn.userId,
        userName: conn.userName,
        profileId: conn.profileId,
        profileName: conn.profileName,
        source: conn.source,
        version: conn.version,
        channels: conn.channels,
        sevenTVConnected: conn.connectionStatus?.sevenTV?.connected || false,
        sevenTVChannel: conn.connectionStatus?.sevenTV?.channelname || 'N/A',
        streamElementsConnected: conn.connectionStatus?.streamelements?.connected || false,
        streamElementsChannel: conn.connectionStatus?.streamelements?.channelname || 'N/A',
        blerpConnected: conn.connectionStatus?.blerp?.connected || false,
        blerpChannel: conn.connectionStatus?.blerp?.channelname || 'N/A',
        soundalertsConnected: conn.connectionStatus?.soundalerts?.connected || false,
        soundalertsChannel: conn.connectionStatus?.soundalerts?.channelname || 'N/A',
        pallyggConnected: conn.connectionStatus?.pallygg?.connected || false,
        pallyggChannel: conn.connectionStatus?.pallygg?.channelname || 'N/A',
        youtubeConnected: conn.connectionStatus?.youtube?.connected || false,
        youtubeChannel: conn.connectionStatus?.youtube?.channelname || 'N/A',
        connectedAt: conn.connectedAt,
        streamInfo: conn.streamInfo
      }));
      
      setConnections(flatConnections);
      setConnectionStats({
        connection_count: data.connection_count || 0,
        user_count: data.user_count || 0
      });
      setLastUpdated(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch connections');
      console.error('Error fetching connections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchConnections, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatStreamDuration = (startTime: number) => {
    const durationSeconds = Math.floor(Date.now() / 1000) - startTime;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const renderServiceLogo = (
    name: string,
    connected: boolean,
    channel: string,
    Comp: React.ComponentType<React.ComponentProps<"svg">>
  ) => {
    return (
      <Tooltip 
        label={connected ? `${name}: Connected (${channel})` : `${name}: Not Connected`}
        position="top"
        withArrow
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '8px',
            border: '1px solid',
            borderColor: connected ? 'var(--mantine-color-default-border)' : 'transparent',
            backgroundColor: connected ? 'var(--mantine-color-default-hover)' : 'transparent',
            opacity: connected ? 1 : 0.25,
            transition: 'all 0.2s ease',
          }}
        >
          <Comp
            style={{ 
              width: 20, 
              height: 20,
              color: 'var(--mantine-color-text)',
              objectFit: 'contain'
            }} 
          />
        </div>
      </Tooltip>
    );
  };

  // Group connections by userName
  const groupedUsersMap: Record<string, GroupedUser> = {};

  connections.forEach(conn => {
    const name = conn.userName;
    if (!groupedUsersMap[name]) {
      groupedUsersMap[name] = {
        userName: name,
        userId: conn.userId,
        channels: [],
        isLive: false,
        services: {
          sevenTV: { connected: false, channel: 'N/A' },
          streamelements: { connected: false, channel: 'N/A' },
          blerp: { connected: false, channel: 'N/A' },
          soundalerts: { connected: false, channel: 'N/A' },
          pallygg: { connected: false, channel: 'N/A' },
          youtube: { connected: false, channel: 'N/A' },
        },
        connections: [],
      };
    }

    const user = groupedUsersMap[name];

    // Add unique channels
    conn.channels.forEach(ch => {
      if (!user.channels.includes(ch)) {
        user.channels.push(ch);
      }
    });

    // Check if live
    if (conn.streamInfo) {
      user.isLive = true;
      user.streamInfo = conn.streamInfo;
    }

    // Merge services status
    if (conn.sevenTVConnected) {
      user.services.sevenTV = { connected: true, channel: conn.sevenTVChannel };
    }
    if (conn.streamElementsConnected) {
      user.services.streamelements = { connected: true, channel: conn.streamElementsChannel };
    }
    if (conn.blerpConnected) {
      user.services.blerp = { connected: true, channel: conn.blerpChannel };
    }
    if (conn.soundalertsConnected) {
      user.services.soundalerts = { connected: true, channel: conn.soundalertsChannel };
    }
    if (conn.pallyggConnected) {
      user.services.pallygg = { connected: true, channel: conn.pallyggChannel };
    }
    if (conn.youtubeConnected) {
      user.services.youtube = { connected: true, channel: conn.youtubeChannel };
    }

    user.connections.push(conn);
  });

  const groupedUsers = Object.values(groupedUsersMap).sort((a, b) => {
    if (a.isLive === b.isLive) return a.userName.localeCompare(b.userName);
    return a.isLive ? -1 : 1;
  });

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>
              <Group gap="xs">
                <IconUsers size="1.5rem" />
                Active Connections
              </Group>
            </Title>
            <Text c="dimmed" size="sm">
              Monitor real-time connections to HeheChat servers
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size="1rem" />}
            onClick={fetchConnections}
            loading={loading}
            variant="light"
          >
            Refresh
          </Button>
        </Group>

        {lastUpdated && (
          <Text size="xs" c="dimmed">
            <IconClock size="0.8rem" style={{ marginRight: '4px' }} />
            Last updated: {lastUpdated?.toLocaleString()}
          </Text>
        )}

        <Group justify="space-between">
          <Text fw={700} size="lg">Connection Statistics</Text>
          <Group gap="md">
            <Badge size="lg" variant="filled" color="blue" leftSection={<IconUsers size="0.9rem" />}>
              {connectionStats.user_count} Users
            </Badge>
            <Badge size="lg" variant="filled" color="green" leftSection={<IconWifi size="0.9rem" />}>
              {connectionStats.connection_count} Total Connections
            </Badge>
            <Badge size="lg" variant="filled" color="orange" leftSection={<IconDevices size="0.9rem" />}>
              {connections.length} Active Sources
            </Badge>
          </Group>
        </Group>

        <div style={{ position: 'relative' }}>
          <LoadingOverlay visible={loading} />
          
          {error && (
            <Alert 
              icon={<IconAlertCircle size="1rem" />} 
              title="Error Loading Connections" 
              color="pink"
              variant="light"
              m="md"
            >
              <Text>{error}</Text>
              <Button 
                size="xs" 
                variant="light" 
                mt="xs"
                onClick={fetchConnections}
              >
                Try Again
              </Button>
            </Alert>
          )}

          {!error && connections.length === 0 && !loading && (
            <Alert 
              icon={<IconWifi size="1rem" />} 
              title="No Active Connections" 
              color="blue"
              variant="light"
              m="md"
            >
              <Text>There are currently no active connections to display.</Text>
            </Alert>
          )}

          {!error && groupedUsers.length > 0 && (
            <Stack gap="md" w="100%">
              {groupedUsers.map((user) => (
                <Card
                  key={user.userName}
                  withBorder
                  shadow="sm"
                  radius="md"
                  p="md"
                  w="100%"
                >
                  <Stack gap="sm">
                    <Grid align="center" gap="md">
                      {/* Left Column: Username, UserID, linked Channels, and source tags */}
                      <Grid.Col span={{ base: 12, md: 8 }}>
                        <Stack gap={6}>
                          <Group gap="xs">
                            {user.isLive && (
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Text fw={700} size="lg" c="blue">{user.userName}</Text>
                            <Text size="xs" c="dimmed">({user.userId})</Text>
                          </Group>

                          {user.channels.length > 0 && (
                            <Group gap="xs" wrap="wrap">
                              <Text size="xs" fw={600} c="dimmed">Channels:</Text>
                              {user.channels.map((channel) => (
                                <Badge 
                                  key={channel}
                                  variant="light"
                                  color="blue"
                                  size="lg"
                                  rightSection={
                                    <Anchor
                                      href={`https://twitch.tv/${channel}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}
                                    >
                                      <IconExternalLink size="0.75rem" />
                                    </Anchor>
                                  }
                                >
                                  {channel}
                                </Badge>
                              ))}
                            </Group>
                          )}

                          <Group gap="xs" wrap="wrap">
                            <Text size="xs" fw={600} c="dimmed">Sources:</Text>
                            {user.connections.map((conn, idx) => (
                              <Badge 
                                key={`${conn.guid}-${idx}`}
                                variant="outline"
                                color={getSourceColor(conn.source)}
                                size="lg"
                                tt="none"
                                rightSection={
                                  <Text component="span" size="xs" c="dimmed" tt="none">
                                    v{conn.version}
                                  </Text>
                                }
                              >{conn.source}</Badge>
                            ))}
                          </Group>
                        </Stack>
                      </Grid.Col>

                      {/* Right Column: Services (monochrome logos) only */}
                      <Grid.Col span={{ base: 12, md: 4 }}>
                        <Stack align="flex-start" gap={4}>
                          <Text size="xs" fw={700} c="dimmed">SERVICES</Text>
                          <Group gap="xs">
                            {renderServiceLogo('7TV', user.services.sevenTV.connected, user.services.sevenTV.channel, SeventvLogo)}
                            {renderServiceLogo('StreamElements', user.services.streamelements.connected, user.services.streamelements.channel, StreamelementLogo)}
                            {renderServiceLogo('Blerp', user.services.blerp.connected, user.services.blerp.channel, BlerpLogo)}
                            {renderServiceLogo('SoundAlerts', user.services.soundalerts.connected, user.services.soundalerts.channel, SoundalertsLogo)}
                            {renderServiceLogo('Pally.gg', user.services.pallygg.connected, user.services.pallygg.channel, PallyLogo)}
                            {renderServiceLogo('YouTube', user.services.youtube.connected, user.services.youtube.channel, YoutubeLogo)}
                          </Group>
                        </Stack>
                      </Grid.Col>
                    </Grid>

                    {/* Full-width Stream Info banner */}
                    {user.streamInfo && (
                      <Card
                        withBorder
                        shadow="none"
                        p="sm"
                        radius="sm"
                        style={{
                          backgroundColor: 'var(--mantine-color-dark-8)',
                        }}
                      >
                        <Stack gap={6}>
                          <Group justify="space-between" wrap="wrap" gap="sm">
                            <Badge color="pink" variant="filled" size="xs">LIVE</Badge>
                            <Group gap="md" wrap="nowrap">
                              <Text size="xs" c="dimmed">{user.streamInfo.category}</Text>
                              <Group gap={4} wrap="nowrap">
                                <IconUsers size="0.75rem" style={{ color: 'var(--mantine-color-violet-5)' }} />
                                <Text size="xs" fw={600}>{user.streamInfo.viewerCount?.toLocaleString()}</Text>
                              </Group>
                              <Group gap={4} wrap="nowrap">
                                <IconClock size="0.75rem" style={{ color: 'var(--mantine-color-gray-5)' }} />
                                <Text size="xs">{formatStreamDuration(user.streamInfo.startTime)}</Text>
                              </Group>
                            </Group>
                          </Group>
                          <Text size="sm" fw={600} lineClamp={2}>
                            {user.streamInfo.title}
                          </Text>
                        </Stack>
                      </Card>
                    )}
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </div>
      </Stack>
    </Container>
  );
}
