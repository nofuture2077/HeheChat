import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Alert, 
  Stack, 
  Table, 
  Badge, 
  LoadingOverlay, 
  Card, 
  Group, 
  Pagination,
  Anchor
} from '@mantine/core';
import { 
  IconRefresh, 
  IconAlertCircle, 
  IconClock, 
  IconBell
} from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { LoginContextContext } from '@/ApplicationContext';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const EDITOR_URL = import.meta.env.VITE_EDITOR_URL;

interface AlertToken {
  id: number;
  name: string;
  created: string;
  userid: string;
  channelname: string;
  token: string;
}

interface ApiResponse {
  success: boolean;
  tokens?: AlertToken[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
}

export function AdminAlertsPage() {
  const loginContext = useContext(LoginContextContext);
  const [alertTokens, setAlertTokens] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const getAdminToken = () => {
    return localStorage.getItem('hehe-token_state');
  };

  const fetchAlertTokens = async () => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      setError('No admin token found. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const offset = (page - 1) * limit;
      const response = await fetch(`${BASE_URL}/api/admin/alerts/token?token=${adminToken}&limit=${limit}&offset=${offset}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('hehe-token_state');
          loginContext.setAccessToken(undefined);
          setError('Authentication failed. Please log in again.');
          return;
        }
        if (response.status === 403) {
          setError('Access denied. Admin privileges required.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success && data.tokens) {
        setAlertTokens(data);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch alert tokens');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch alert tokens');
      console.error('Error fetching alert tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Initial load
  useEffect(() => {
    fetchAlertTokens();
    // Auto-refresh every 60 seconds
    const interval = setInterval(() => {
      fetchAlertTokens();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Effect to fetch tokens when page changes
  useEffect(() => {
    fetchAlertTokens();
  }, [page]);

  if (!alertTokens) {
    return null;
  }

  const rows = alertTokens?.tokens?.map((token) => (
    <Table.Tr key={token.id}>
      <Table.Td>
        <Text fw={500}>{token.name}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{token.channelname}</Text>
      </Table.Td>
      <Table.Td>
        <Text size="sm">{new Date(token.created).toLocaleString()}</Text>
      </Table.Td>
      <Table.Td>
        <Anchor 
          href={`${EDITOR_URL}?token=${token.token}`} 
          target="_blank" 
          rel="noopener noreferrer"
          size="sm"
        >
          {token.token.substring(0, 10)}...
        </Anchor>
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
                <IconBell size="1.5rem" />
                Alert Editor Tokens
              </Group>
            </Title>
            <Text c="dimmed" size="sm">
              Manage alert editor tokens for channels
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size="1rem" />}
            onClick={fetchAlertTokens}
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
              <Text fw={500}>Alert Editor Tokens</Text>
              <Badge size="lg" variant="light" color="blue">
                {alertTokens?.total} Tokens
              </Badge>
            </Group>
          </Card.Section>

          <Card.Section>
            <div style={{ position: 'relative' }}>
              <LoadingOverlay visible={loading} />
              
              {error && (
                <Alert 
                  icon={<IconAlertCircle size="1rem" />} 
                  title="Error Loading Tokens" 
                  color="red"
                  variant="light"
                  m="md"
                >
                  <Text>{error}</Text>
                  <Button 
                    size="xs" 
                    variant="light" 
                    mt="xs"
                    onClick={fetchAlertTokens}
                  >
                    Try Again
                  </Button>
                </Alert>
              )}

              {!error && alertTokens?.total === 0 && !loading && (
                <Alert 
                  icon={<IconBell size="1rem" />} 
                  title="No Alert Tokens" 
                  color="blue"
                  variant="light"
                  m="md"
                >
                  <Text>There are currently no alert editor tokens to display.</Text>
                </Alert>
              )}

              {!error && (alertTokens?.total || 0) > 0 && (
                <>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Channel</Table.Th>
                        <Table.Th>Created</Table.Th>
                        <Table.Th>Token</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                  </Table>
                  
                  <Group justify="center" p="md">
                    <Pagination
                      value={page}
                      onChange={handlePageChange}
                      total={Math.ceil((alertTokens?.total || 0) / limit)}
                      size="sm"
                    />
                  </Group>
                </>
              )}
            </div>
          </Card.Section>
        </Card>
      </Stack>
    </Container>
  );
}
