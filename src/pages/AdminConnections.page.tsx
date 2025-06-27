import { Container, Title, Text, Button, Alert, Stack, Table, Badge, LoadingOverlay, Card, Group, Accordion } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconUsers, IconClock, IconWifi, IconDevices } from '@tabler/icons-react';
import { useState, useEffect } from 'react';

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
}

interface SourceData {
  userId: string;
  userName: string;
  channels: string[];
  guid: string;
  connectionStatus: ConnectionStatus;
}

interface SessionData {
  profileName: string;
  sources: Record<string, SourceData>;
}

interface UserConnections {
  [sessionId: string]: SessionData;
}

interface ConnectionsResponse {
  connection_count: number;
  user_count: number;
  connections: Record<string, UserConnections>;
}

interface FlatConnection {
  username: string;
  sessionId: string;
  profileName: string;
  sourceName: string;
  userId: string;
  channels: string[];
  guid: string;
  sevenTVConnected: boolean;
  sevenTVChannel: string;
  streamElementsConnected: boolean;
  streamElementsChannel: string;
}

export function AdminConnectionsPage() {
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ConnectionsResponse = await response.json();
      
      // Flatten the nested structure for easier display
      const flatConnections: FlatConnection[] = [];
      
      Object.entries(data.connections || {}).forEach(([username, userConnections]) => {
        Object.entries(userConnections).forEach(([sessionId, sessionData]) => {
          Object.entries(sessionData.sources || {}).forEach(([sourceName, sourceData]) => {
            flatConnections.push({
              username,
              sessionId,
              profileName: sessionData.profileName,
              sourceName,
              userId: sourceData.userId,
              channels: sourceData.channels,
              guid: sourceData.guid,
              sevenTVConnected: sourceData.connectionStatus?.sevenTV?.connected || false,
              sevenTVChannel: sourceData.connectionStatus?.sevenTV?.channelname || 'N/A',
              streamElementsConnected: sourceData.connectionStatus?.streamelements?.connected || false,
              streamElementsChannel: sourceData.connectionStatus?.streamelements?.channelname || 'N/A',
            });
          });
        });
      });
      
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

  const getConnectionStatusBadge = (connected: boolean) => (
    <Badge color={connected ? 'green' : 'red'} variant="light" size="xs">
      {connected ? 'Connected' : 'Disconnected'}
    </Badge>
  );

  const rows = connections.map((connection, index) => (
    <Table.Tr key={`${connection.username}-${connection.sessionId}-${connection.sourceName}-${index}`}>
      <Table.Td>{connection.username}</Table.Td>
      <Table.Td>{connection.profileName}</Table.Td>
      <Table.Td>{connection.sourceName}</Table.Td>
      <Table.Td>{connection.channels.join(', ')}</Table.Td>
      <Table.Td>
        <Stack gap="xs">
          <Group gap="xs">
            <Text size="xs">7TV:</Text>
            {getConnectionStatusBadge(connection.sevenTVConnected)}
            <Text size="xs" c="dimmed">({connection.sevenTVChannel})</Text>
          </Group>
          <Group gap="xs">
            <Text size="xs">SE:</Text>
            {getConnectionStatusBadge(connection.streamElementsConnected)}
            <Text size="xs" c="dimmed">({connection.streamElementsChannel})</Text>
          </Group>
        </Stack>
      </Table.Td>
      <Table.Td>
        <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
          {connection.guid.substring(0, 8)}...
        </Text>
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
                      <Table.Th>Username</Table.Th>
                      <Table.Th>Profile</Table.Th>
                      <Table.Th>Source</Table.Th>
                      <Table.Th>Channels</Table.Th>
                      <Table.Th>Service Status</Table.Th>
                      <Table.Th>GUID</Table.Th>
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
