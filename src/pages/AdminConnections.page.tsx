import { Container, Title, Text, Button, Alert, Stack, Table, Badge, LoadingOverlay, Card, Group, Anchor } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconUsers, IconClock, IconWifi, IconDevices, IconExternalLink, IconEye } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { LoginContextContext } from '@/ApplicationContext';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

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

  const getServiceBadge = (service: '7TV' | 'SE' | 'Blerp' | 'Pally' | 'YT', connected: boolean) => {
    if (!connected) return null;
    
    const badgeProps = {
      size: 'sm',
      radius: 'sm',
      variant: 'filled',
      style: { fontWeight: 'bold' }
    };

    switch (service) {
      case '7TV':
        return <Badge {...badgeProps} color="blue">7TV</Badge>;
      case 'SE':
        return <Badge {...badgeProps} color="teal">SE</Badge>;
      case 'Blerp':
        return <Badge {...badgeProps} color="orange">BLERP</Badge>;
      case 'Pally':
        return <Badge {...badgeProps} color="grape">PALLY</Badge>;
      case 'YT':
        return <Badge {...badgeProps} color="red">YT</Badge>;
      default:
        return null;
    }
  };

  const formatStreamDuration = (startTime: number) => {
    const durationSeconds = Math.floor(Date.now() / 1000) - startTime;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatGUID = (guid: string) => {
    if (!guid) return '';
    return guid.substring(0, 8) + '...' + guid.substring(guid.length - 4);
  };

  const rows = connections.map((connection, index) => (
    <Table.Tr key={`${connection.userName}-${connection.profileId}-${connection.source}-${index}`}>
      <Table.Td>
        <Stack gap={4}>
          <Group gap="xs">
            <Text fw={500}>{connection.userName}</Text>
            {connection.streamInfo && (
              <Badge color="pink" size="xs">LIVE</Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">{connection.userId}</Text>
          {connection.streamInfo && (
            <Group gap="xs" mt={2}>
              <Badge 
                size="xs" 
                color="violet" 
                leftSection={<IconUsers size="0.7rem" />}
              >
                {connection.streamInfo.viewerCount}
              </Badge>
              <Badge 
                size="xs" 
                color="gray" 
                leftSection={<IconClock size="0.7rem" />}
              >
                {formatStreamDuration(connection.streamInfo.startTime)}
              </Badge>
            </Group>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Stack gap={4}>
          <Text fw={500}>{connection.profileName}</Text>
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            {formatGUID(connection.guid)}
          </Text>
          {connection.streamInfo && connection.streamInfo.title && (
            <Text size="xs" c="dimmed" fw={500}>
              {connection.streamInfo.title.length > 30 
                ? `${connection.streamInfo.title.substring(0, 30)}...` 
                : connection.streamInfo.title}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Stack gap={4}>
          <Text fw={500}>{connection.source}</Text>
          <Badge size="xs" variant="light" color="gray">{connection.version}</Badge>
          {connection.streamInfo && connection.streamInfo.category && (
            <Text size="xs" c="dimmed">
              {connection.streamInfo.category}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="wrap">
          {connection.channels.map((channel, channelIndex) => (
            <Badge 
              key={channelIndex}
              variant="light"
              color="blue"
              rightSection={
                <Anchor
                  href={`https://twitch.tv/${channel}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit' }}
                >
                  <IconExternalLink size="0.7rem" />
                </Anchor>
              }
            >
              {channel}
            </Badge>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          {getServiceBadge('7TV', connection.sevenTVConnected)}
          {getServiceBadge('SE', connection.streamElementsConnected)}
          {getServiceBadge('Blerp', connection.blerpConnected)}
          {getServiceBadge('Pally', connection.pallyggConnected)}
          {getServiceBadge('YT', connection.youtubeConnected)}
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

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
            Last updated: {lastUpdated.toLocaleString()}
          </Text>
        )}

        <Card withBorder shadow="sm">
          <Card.Section p="md" withBorder>
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
          </Card.Section>

          <Card.Section>
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

              {!error && connections.length > 0 && (
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        <Group gap={4} align="center">
                          <IconUsers size="0.9rem" />
                          <Text fw={700}>Username</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Group gap={4} align="center">
                          <IconDevices size="0.9rem" />
                          <Text fw={700}>Profile</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Group gap={4} align="center">
                          <IconWifi size="0.9rem" />
                          <Text fw={700}>Source</Text>
                        </Group>
                      </Table.Th>
                      <Table.Th>
                        <Text fw={700}>Channels</Text>
                      </Table.Th>
                      <Table.Th>
                        <Text fw={700}>Services</Text>
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{rows}</Table.Tbody>
                </Table>
              )}
            </div>
          </Card.Section>
        </Card>
      </Stack>
    </Container>
  );
}
