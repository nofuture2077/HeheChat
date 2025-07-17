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
  ActionIcon,
  Modal,
  TextInput,
  Notification,
  Collapse,
  Tooltip
} from '@mantine/core';
import { 
  IconRefresh, 
  IconAlertCircle, 
  IconSettings, 
  IconClock, 
  IconReload,
  IconInfoCircle,
  IconCheck,
  IconX,
  IconChevronDown,
  IconChevronRight,
  IconExclamationCircle
} from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { LoginContextContext } from '@/ApplicationContext';
import { LOGIN_SCOPES } from '@/commons/login';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface AuthorizedChannel {
  channelid: string;
  channelname: string;
  scope: string[];
}

interface ChannelInfo extends AuthorizedChannel {
  is_loaded: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  channels?: T[];
  channel?: T;
  message?: string;
  error?: string;
}

export function AdminChannelManagementPage() {
  const loginContext = useContext(LoginContextContext);
  const [channels, setChannels] = useState<AuthorizedChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reinitializeLoading, setReinitializeLoading] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState<string | null>(null);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set());
  
  const [infoModalOpened, { open: openInfoModal, close: closeInfoModal }] = useDisclosure(false);

  const getAdminToken = () => {
    return localStorage.getItem('hehe-token_state');
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchAuthorizedChannels = async () => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      setError('No admin token found. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${BASE_URL}/api/channels/authorized?token=${adminToken}`);
      
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

      const data: ApiResponse<AuthorizedChannel> = await response.json();
      
      if (data.success && data.channels) {
        setChannels(data.channels);
        setLastUpdated(new Date());
      } else {
        setError(data.error || 'Failed to fetch channels');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch authorized channels');
      console.error('Error fetching authorized channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const reinitializeChannel = async (channelname: string) => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      showNotification('error', 'No admin token found. Please log in again.');
      return;
    }

    setReinitializeLoading(channelname);
    
    try {
      const response = await fetch(`${BASE_URL}/api/channels/reinitialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: adminToken,
          channelname: channelname
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('hehe-token_state');
          loginContext.setAccessToken(undefined);
          showNotification('error', 'Authentication failed. Please log in again.');
          return;
        }
        if (response.status === 403) {
          showNotification('error', 'Access denied. Admin privileges required.');
          return;
        }
        if (response.status === 404) {
          showNotification('error', `Channel '${channelname}' not found.`);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<AuthorizedChannel> = await response.json();
      
      if (data.success) {
        showNotification('success', data.message || `Channel '${channelname}' has been reinitialized`);
        // Refresh the channels list
        fetchAuthorizedChannels();
      } else {
        showNotification('error', data.error || 'Failed to reinitialize channel');
      }
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to reinitialize channel');
      console.error('Error reinitializing channel:', error);
    } finally {
      setReinitializeLoading(null);
    }
  };

  const getChannelInfo = async (channelname: string) => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      showNotification('error', 'No admin token found. Please log in again.');
      return;
    }

    setInfoLoading(channelname);
    
    try {
      const response = await fetch(`${BASE_URL}/api/channels/info?token=${adminToken}&channelname=${channelname}`);

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('hehe-token_state');
          loginContext.setAccessToken(undefined);
          showNotification('error', 'Authentication failed. Please log in again.');
          return;
        }
        if (response.status === 403) {
          showNotification('error', 'Access denied. Admin privileges required.');
          return;
        }
        if (response.status === 404) {
          showNotification('error', `Channel '${channelname}' not found.`);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<ChannelInfo> = await response.json();
      
      if (data.success && data.channel) {
        setChannelInfo(data.channel);
        openInfoModal();
      } else {
        showNotification('error', data.error || 'Failed to get channel info');
      }
    } catch (error) {
      showNotification('error', error instanceof Error ? error.message : 'Failed to get channel info');
      console.error('Error getting channel info:', error);
    } finally {
      setInfoLoading(null);
    }
  };

  useEffect(() => {
    fetchAuthorizedChannels();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAuthorizedChannels, 60000);
    return () => clearInterval(interval);
  }, []);

  const hasAllRequiredScopes = (channelScopes: string[]) => {
    return LOGIN_SCOPES.every(requiredScope => channelScopes.includes(requiredScope));
  };

  const getMissingScopes = (channelScopes: string[]) => {
    return LOGIN_SCOPES.filter(requiredScope => !channelScopes.includes(requiredScope));
  };

  const toggleScopeExpansion = (channelId: string) => {
    const newExpanded = new Set(expandedScopes);
    if (newExpanded.has(channelId)) {
      newExpanded.delete(channelId);
    } else {
      newExpanded.add(channelId);
    }
    setExpandedScopes(newExpanded);
  };

  const getScopeBadges = (scope: string[]) => {
    const scopeColors: Record<string, string> = {
      'chat:read': 'blue',
      'chat:edit': 'green',
      'channel:moderate': 'orange',
      'channel:manage:broadcast': 'red',
      'user:read:email': 'purple'
    };

    return scope.map((s, index) => (
      <Badge 
        key={index} 
        size="xs" 
        variant="light" 
        color={scopeColors[s] || 'gray'}
      >
        {s}
      </Badge>
    ));
  };

  const rows = channels.map((channel) => {
    const hasAllScopes = hasAllRequiredScopes(channel.scope);
    const missingScopes = getMissingScopes(channel.scope);
    const isExpanded = expandedScopes.has(channel.channelid);

    return (
      <Table.Tr key={channel.channelid}>
        <Table.Td>
          <Group gap="xs">
            <Text fw={500}>{channel.channelname}</Text>
            {!hasAllScopes && (
              <Tooltip label={`Missing ${missingScopes.length} required scope${missingScopes.length > 1 ? 's' : ''}`}>
                <IconExclamationCircle size="1rem" color="orange" />
              </Tooltip>
            )}
          </Group>
        </Table.Td>
        <Table.Td>
          <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
            {channel.channelid}
          </Text>
        </Table.Td>
        <Table.Td>
          <Stack gap="xs">
            <Group gap="xs" align="center">
              <Badge size="sm" variant="light" color={hasAllScopes ? 'green' : 'orange'}>
                {channel.scope.length} scope{channel.scope.length !== 1 ? 's' : ''}
                {!hasAllScopes && ` (${missingScopes.length} missing)`}
              </Badge>
              <ActionIcon
                variant="subtle"
                size="sm"
                onClick={() => toggleScopeExpansion(channel.channelid)}
                title={isExpanded ? 'Hide scopes' : 'Show scopes'}
              >
                {isExpanded ? <IconChevronDown size="0.8rem" /> : <IconChevronRight size="0.8rem" />}
              </ActionIcon>
            </Group>
            <Collapse in={isExpanded}>
              <Stack gap="xs">
                <Group gap="xs" wrap="wrap">
                  {getScopeBadges(channel.scope)}
                </Group>
                {!hasAllScopes && (
                  <div>
                    <Text size="xs" fw={500} c="orange" mb="xs">Missing required scopes:</Text>
                    <Group gap="xs" wrap="wrap">
                      {missingScopes.map((scope, index) => (
                        <Badge key={index} size="xs" variant="light" color="red">
                          {scope}
                        </Badge>
                      ))}
                    </Group>
                  </div>
                )}
              </Stack>
            </Collapse>
          </Stack>
        </Table.Td>
        <Table.Td>
          <Group gap="xs">
            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              onClick={() => getChannelInfo(channel.channelname)}
              loading={infoLoading === channel.channelname}
              title="Get Channel Info"
            >
              <IconInfoCircle size="1rem" />
            </ActionIcon>
            <ActionIcon
              variant="light"
              color="orange"
              size="sm"
              onClick={() => reinitializeChannel(channel.channelname)}
              loading={reinitializeLoading === channel.channelname}
              title="Reinitialize Channel"
            >
              <IconReload size="1rem" />
            </ActionIcon>
          </Group>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="xl">
      <Stack gap="md">
        {notification && (
          <Notification
            icon={notification.type === 'success' ? <IconCheck size="1.1rem" /> : <IconX size="1.1rem" />}
            color={notification.type === 'success' ? 'teal' : 'red'}
            title={notification.type === 'success' ? 'Success' : 'Error'}
            onClose={() => setNotification(null)}
          >
            {notification.message}
          </Notification>
        )}

        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>
              <Group gap="xs">
                <IconSettings size="1.5rem" />
                Channel Management
              </Group>
            </Title>
            <Text c="dimmed" size="sm">
              Manage authorized channels and perform administrative operations
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size="1rem" />}
            onClick={fetchAuthorizedChannels}
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
              <Text fw={500}>Authorized Channels</Text>
              <Badge size="lg" variant="light" color="blue">
                {channels.length} Channels
              </Badge>
            </Group>
          </Card.Section>

          <Card.Section>
            <div style={{ position: 'relative' }}>
              <LoadingOverlay visible={loading} />
              
              {error && (
                <Alert 
                  icon={<IconAlertCircle size="1rem" />} 
                  title="Error Loading Channels" 
                  color="red"
                  variant="light"
                  m="md"
                >
                  <Text>{error}</Text>
                  <Button 
                    size="xs" 
                    variant="light" 
                    mt="xs"
                    onClick={fetchAuthorizedChannels}
                  >
                    Try Again
                  </Button>
                </Alert>
              )}

              {!error && channels.length === 0 && !loading && (
                <Alert 
                  icon={<IconSettings size="1rem" />} 
                  title="No Authorized Channels" 
                  color="blue"
                  variant="light"
                  m="md"
                >
                  <Text>There are currently no authorized channels to display.</Text>
                </Alert>
              )}

              {!error && channels.length > 0 && (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Channel Name</Table.Th>
                      <Table.Th>Channel ID</Table.Th>
                      <Table.Th>Permissions</Table.Th>
                      <Table.Th>Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{rows}</Table.Tbody>
                </Table>
              )}
            </div>
          </Card.Section>
        </Card>

        <Modal 
          opened={infoModalOpened} 
          onClose={closeInfoModal} 
          title="Channel Information"
          size="md"
        >
          {channelInfo && (
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500}>Channel Name:</Text>
                <Text>{channelInfo.channelname}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500}>Channel ID:</Text>
                <Text style={{ fontFamily: 'monospace' }}>{channelInfo.channelid}</Text>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500}>Status:</Text>
                <Badge 
                  color={channelInfo.is_loaded ? 'green' : 'red'}
                  variant="light"
                >
                  {channelInfo.is_loaded ? 'Loaded' : 'Not Loaded'}
                </Badge>
              </Group>
              
              <Group justify="space-between">
                <Text fw={500}>Scope Status:</Text>
                <Badge 
                  color={hasAllRequiredScopes(channelInfo.scope) ? 'green' : 'orange'}
                  variant="light"
                >
                  {hasAllRequiredScopes(channelInfo.scope) ? 'Complete' : 'Missing Scopes'}
                </Badge>
              </Group>
              
              <div>
                <Text fw={500} mb="xs">Current Permissions ({channelInfo.scope.length}):</Text>
                <Group gap="xs" wrap="wrap">
                  {getScopeBadges(channelInfo.scope)}
                </Group>
              </div>

              {!hasAllRequiredScopes(channelInfo.scope) && (
                <div>
                  <Text fw={500} mb="xs" c="orange">Missing Required Scopes ({getMissingScopes(channelInfo.scope).length}):</Text>
                  <Group gap="xs" wrap="wrap">
                    {getMissingScopes(channelInfo.scope).map((scope, index) => (
                      <Badge key={index} size="xs" variant="light" color="red">
                        {scope}
                      </Badge>
                    ))}
                  </Group>
                </div>
              )}
            </Stack>
          )}
        </Modal>
      </Stack>
    </Container>
  );
}
