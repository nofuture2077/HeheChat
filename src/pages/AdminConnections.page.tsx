import { Container, Title, Text, Button, Alert, Stack, Table, Badge, LoadingOverlay, Card, Group, Accordion, Anchor } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconUsers, IconClock, IconWifi, IconDevices, IconExternalLink } from '@tabler/icons-react';
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

  const getServiceLogo = (service: '7TV' | 'SE' | 'Blerp' | 'Pally', connected: boolean) => {
    if (!connected) return null;
    
    const logoStyle = {
      width: '20px',
      height: '20px',
      borderRadius: '4px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '8px',
      fontWeight: 'bold',
      color: 'white',
      marginRight: '4px'
    };

    if (service === '7TV') {
      return (
        <div style={{ ...logoStyle, backgroundColor: '#1976d2' }}>
          7TV
        </div>
      );
    } else if (service === 'SE') {
      return (
        <div style={{ ...logoStyle, backgroundColor: '#00d4aa' }}>
          SE
        </div>
      );
    } else if (service === 'Blerp') {
      return (
        <div style={{ ...logoStyle, backgroundColor: '#ff6b35' }}>
          BLERP
        </div>
      );
    } else if (service === 'Pally') {
      return (
        <div style={{ ...logoStyle, backgroundColor: '#9c27b0' }}>
          PALLY
        </div>
      );
    }
    
    return null;
  };

  const formatStreamDuration = (startTime: number) => {
    const durationSeconds = Math.floor(Date.now() / 1000) - startTime;
    const hours = Math.floor(durationSeconds / 3600);
    const minutes = Math.floor((durationSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const rows = connections.map((connection, index) => (
    <Table.Tr key={`${connection.userName}-${connection.profileId}-${connection.source}-${index}`}>
      <Table.Td>
        <Stack gap={0}>
          <Group gap="xs">
            <Text>{connection.userName}</Text>
            {connection.streamInfo && (
              <Badge color="red" size="xs">LIVE</Badge>
            )}
          </Group>
          <Text size="xs" c="dimmed">{connection.userId}</Text>
          {connection.streamInfo && (
            <Text size="xs" c="dimmed">
              <Group gap={4}>
                <span>🔴 {connection.streamInfo.viewerCount} viewers</span>
                <span>⏱️ {formatStreamDuration(connection.streamInfo.startTime)}</span>
              </Group>
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Stack gap={0}>
          <Text>{connection.profileName}</Text>
          <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
            {connection.guid.substring(0, 8)}...
          </Text>
          {connection.streamInfo && (
            <Text size="xs" c="dimmed" fw={500}>
              {connection.streamInfo.title}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Stack gap={0}>
          <Text>{connection.source}</Text>
          <Text size="xs" c="dimmed">{connection.version}</Text>
          {connection.streamInfo && (
            <Text size="xs" c="dimmed">
              {connection.streamInfo.category}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="wrap">
          {connection.channels.map((channel, channelIndex) => (
            <Anchor
              key={channelIndex}
              href={`https://twitch.tv/${channel}`}
              target="_blank"
              rel="noopener noreferrer"
              size="sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {channel}
              <IconExternalLink size="0.75rem" />
            </Anchor>
          ))}
        </Group>
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          {getServiceLogo('7TV', connection.sevenTVConnected)}
          {getServiceLogo('SE', connection.streamElementsConnected)}
          {getServiceLogo('Blerp', connection.blerpConnected)}
          {getServiceLogo('Pally', connection.pallyggConnected)}
        </Group>
      </Table.Td>
      <Table.Td>
        
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

        <Card withBorder>
          <Card.Section p="md" withBorder>
            <Group justify="space-between">
              <Text fw={500}>Connection Statistics</Text>
              <Group gap="md">
                <Badge size="lg" variant="light" color="blue">
                  {connectionStats.user_count} Users
                </Badge>
                <Badge size="lg" variant="light" color="green">
                  {connectionStats.connection_count} Total Connections
                </Badge>
                <Badge size="lg" variant="light" color="orange">
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
                  color="red"
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
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>
                        <Stack gap={0}>
                          <Text fw={900}>Username</Text>
                          <Text fw={600} size="xs" c="dimmed">User ID / Stream Info</Text>
                        </Stack>
                      </Table.Th>
                      <Table.Th>
                        <Stack gap={0}>
                          <Text fw={900}>Profile</Text>
                          <Text fw={600} size="xs" c="dimmed">GUID / Stream Title</Text>
                        </Stack>
                      </Table.Th>
                      <Table.Th>
                        <Stack gap={0}>
                          <Text fw={900}>Source</Text>
                          <Text fw={600} size="xs" c="dimmed">Version / Category</Text>
                        </Stack>
                      </Table.Th>
                      <Table.Th>
                        <Stack gap={0}>
                          <Text fw={900}>Channels</Text>
                          <Text fw={600} size="xs" c="dimmed">&nbsp;</Text>
                        </Stack>
                      </Table.Th>
                      <Table.Th>
                        <Stack gap={0}>
                          <Text fw={900}>Service Status</Text>
                          <Text fw={600} size="xs" c="dimmed">&nbsp;</Text>
                        </Stack>
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
