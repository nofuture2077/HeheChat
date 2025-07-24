import { Container, Title, Text, Button, Alert, Stack, Table, Badge, LoadingOverlay, Card, Group, TextInput, Modal, NumberInput, Pagination } from '@mantine/core';
import { IconRefresh, IconAlertCircle, IconCrown, IconClock, IconPlus, IconCode, IconUsers, IconHistory, IconSearch } from '@tabler/icons-react';
import { useState, useEffect, useContext } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { LoginContextContext } from '@/ApplicationContext';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;

interface PremiumUser {
  user_id: string;
  username: string;
  subscription_type: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  days_remaining: number;
}

interface RedeemCode {
  code: string;
  duration_days: number;
  created_at: string;
  used: boolean;
  used_by?: string;
  used_at?: string;
}

interface PremiumUsersResponse {
  users: PremiumUser[];
}

interface RedeemCodesResponse {
  codes: RedeemCode[];
}

interface HistoryEntry {
  id: number;
  user_id: string;
  action_type: 'paypal_payment' | 'redeem_code' | 'donation';
  details: string;
  duration_days: number;
  created_at: string;
  username?: string;
}

interface HistoryResponse {
  history: HistoryEntry[];
}

export function AdminPremiumPage() {
  const loginContext = useContext(LoginContextContext);
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [codesLoading, setCodesLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codesError, setCodesError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [generateModalOpened, { open: openGenerateModal, close: closeGenerateModal }] = useDisclosure(false);
  const [generateDays, setGenerateDays] = useState<number>(30);
  
  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit] = useState(10);
  const [historySearchUser, setHistorySearchUser] = useState('');

  const getAdminToken = () => {
    return localStorage.getItem('hehe-token_state');
  };

  const fetchPremiumUsers = async () => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      setError('No admin token found');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/admin/premium/users?active=true&token=${adminToken}`);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('hehe-token_state');
          loginContext.setAccessToken(undefined);
          setError('Authentication failed. Please log in again.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: PremiumUsersResponse = await response.json();
      setPremiumUsers(data.users || []);
      setLastUpdated(new Date());
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch premium users');
      console.error('Error fetching premium users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRedeemCodes = async () => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      setCodesError('No admin token found');
      return;
    }

    setCodesLoading(true);
    setCodesError(null);
    try {
      const response = await fetch(`${BASE_URL}/admin/premium/codes?token=${adminToken}&unused=true`);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('hehe-token_state');
          loginContext.setAccessToken(undefined);
          setCodesError('Authentication failed. Please log in again.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: RedeemCodesResponse = await response.json();
      setRedeemCodes(data.codes || []);
    } catch (error) {
      setCodesError(error instanceof Error ? error.message : 'Failed to fetch redeem codes');
      console.error('Error fetching redeem codes:', error);
    } finally {
      setCodesLoading(false);
    }
  };

  const generateRedeemCode = async () => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      setCodesError('No admin token found');
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch(`${BASE_URL}/admin/premium/generate-code?token=${adminToken}&days=${generateDays}`, {
        method: 'POST'
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('hehe-token_state');
          loginContext.setAccessToken(undefined);
          setCodesError('Authentication failed. Please log in again.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Refresh the codes list after generating
      await fetchRedeemCodes();
      closeGenerateModal();
      setGenerateDays(30); // Reset to default
    } catch (error) {
      setCodesError(error instanceof Error ? error.message : 'Failed to generate redeem code');
      console.error('Error generating redeem code:', error);
    } finally {
      setGenerating(false);
    }
  };

  const fetchHistory = async () => {
    const adminToken = getAdminToken();
    if (!adminToken) {
      setHistoryError('No admin token found');
      return;
    }

    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const offset = (historyPage - 1) * historyLimit;
      let url = `${BASE_URL}/admin/premium/history?token=${adminToken}&limit=${historyLimit}&offset=${offset}`;
      
      if (historySearchUser.trim()) {
        // Search for specific user
        url += `&username=${encodeURIComponent(historySearchUser.trim())}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('hehe-token_state');
          loginContext.setAccessToken(undefined);
          setHistoryError('Authentication failed. Please log in again.');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: HistoryResponse = await response.json();
      setHistory(data.history || []);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : 'Failed to fetch premium history');
      console.error('Error fetching premium history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchPremiumUsers(), fetchRedeemCodes(), fetchHistory()]);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (user: PremiumUser) => {
    if (!user.is_active) {
      return <Badge color="red" variant="light">Inactive</Badge>;
    }
    
    if (user.days_remaining <= 7) {
      return <Badge color="orange" variant="light">Expires Soon</Badge>;
    }
    
    return <Badge color="green" variant="light">Active</Badge>;
  };

  const getSubscriptionTypeBadge = (type: string) => {
    const color = type === 'donation' ? 'blue' : 'purple';
    return <Badge color={color} variant="light">{type}</Badge>;
  };

  const getActionTypeBadge = (actionType: string) => {
    switch (actionType) {
      case 'paypal_payment':
        return <Badge color="purple" variant="light">PayPal</Badge>;
      case 'redeem_code':
        return <Badge color="green" variant="light">Code</Badge>;
      case 'donation':
        return <Badge color="blue" variant="light">Donation</Badge>;
      default:
        return <Badge color="gray" variant="light">{actionType}</Badge>;
    }
  };

  const handleHistorySearch = () => {
    setHistoryPage(1); // Reset to first page when searching
    fetchHistory();
  };

  const handleHistoryPageChange = (page: number) => {
    setHistoryPage(page);
  };

  // Effect to fetch history when page changes
  useEffect(() => {
    if (historyPage > 1) {
      fetchHistory();
    }
  }, [historyPage]);

  const premiumUserRows = premiumUsers.map((user) => (
    <Table.Tr key={user.user_id}>
      <Table.Td>{user.username}</Table.Td>
      <Table.Td>{getSubscriptionTypeBadge(user.subscription_type)}</Table.Td>
      <Table.Td>{getStatusBadge(user)}</Table.Td>
      <Table.Td>{formatDate(user.expires_at)}</Table.Td>
      <Table.Td>
        <Badge variant="outline" color={user.days_remaining <= 7 ? 'orange' : 'blue'}>
          {user.days_remaining} days
        </Badge>
      </Table.Td>
      <Table.Td>{formatDate(user.created_at)}</Table.Td>
    </Table.Tr>
  ));

  const redeemCodeRows = redeemCodes.map((code) => (
    <Table.Tr key={code.code}>
      <Table.Td>
        <Text style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
          {code.code}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="outline" color="blue">
          {code.duration_days} days
        </Badge>
      </Table.Td>
      <Table.Td>{formatDate(code.created_at)}</Table.Td>
      <Table.Td>
        <Badge color={code.used ? 'red' : 'green'} variant="light">
          {code.used ? 'Used' : 'Available'}
        </Badge>
      </Table.Td>
    </Table.Tr>
  ));

  const historyRows = history.map((entry) => (
    <Table.Tr key={entry.id}>
      <Table.Td>{entry.username || entry.user_id}</Table.Td>
      <Table.Td>{getActionTypeBadge(entry.action_type)}</Table.Td>
      <Table.Td>
        <Text size="sm" style={{ maxWidth: '300px', wordBreak: 'break-word' }}>
          {entry.details}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge variant="outline" color="blue">
          {entry.duration_days} days
        </Badge>
      </Table.Td>
      <Table.Td>{formatDate(entry.created_at)}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div>
            <Title order={2}>
              <Group gap="xs">
                <IconCrown size="1.5rem" />
                Premium User Management
              </Group>
            </Title>
            <Text c="dimmed" size="sm">
              Manage premium users and redeem codes
            </Text>
          </div>
          <Button
            leftSection={<IconRefresh size="1rem" />}
            onClick={refreshAll}
            loading={loading || codesLoading}
            variant="light"
          >
            Refresh All
          </Button>
        </Group>

        {lastUpdated && (
          <Text size="xs" c="dimmed">
            <IconClock size="0.8rem" style={{ marginRight: '4px' }} />
            Last updated: {lastUpdated.toLocaleString()}
          </Text>
        )}

        {/* Premium Users Section */}
        <Card withBorder>
          <Card.Section p="md" withBorder>
            <Group justify="space-between">
              <Text fw={500}>
                <Group gap="xs">
                  <IconUsers size="1rem" />
                  Active Premium Users
                </Group>
              </Text>
              <Badge size="lg" variant="light" color="blue">
                {premiumUsers.length} Users
              </Badge>
            </Group>
          </Card.Section>

          <Card.Section>
            <div style={{ position: 'relative' }}>
              <LoadingOverlay visible={loading} />
              
              {error && (
                <Alert 
                  icon={<IconAlertCircle size="1rem" />} 
                  title="Error Loading Premium Users" 
                  color="red"
                  variant="light"
                  m="md"
                >
                  <Text>{error}</Text>
                  <Button 
                    size="xs" 
                    variant="light" 
                    mt="xs"
                    onClick={fetchPremiumUsers}
                  >
                    Try Again
                  </Button>
                </Alert>
              )}

              {!error && premiumUsers.length === 0 && !loading && (
                <Alert 
                  icon={<IconCrown size="1rem" />} 
                  title="No Premium Users" 
                  color="blue"
                  variant="light"
                  m="md"
                >
                  <Text>There are currently no active premium users.</Text>
                </Alert>
              )}

              {!error && premiumUsers.length > 0 && (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Username</Table.Th>
                      <Table.Th>Type</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th>Expires At</Table.Th>
                      <Table.Th>Days Remaining</Table.Th>
                      <Table.Th>Created At</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{premiumUserRows}</Table.Tbody>
                </Table>
              )}
            </div>
          </Card.Section>
        </Card>

        {/* Premium History Section */}
        <Card withBorder>
          <Card.Section p="md" withBorder>
            <Group justify="space-between">
              <Text fw={500}>
                <Group gap="xs">
                  <IconHistory size="1rem" />
                  Premium History
                </Group>
              </Text>
              <Badge size="lg" variant="light" color="orange">
                {history.length} Records
              </Badge>
            </Group>
          </Card.Section>

          <Card.Section p="md" withBorder>
            <Group gap="md">
              <TextInput
                placeholder="Search by user ID or username..."
                value={historySearchUser}
                onChange={(event) => setHistorySearchUser(event.currentTarget.value)}
                leftSection={<IconSearch size="1rem" />}
                style={{ flex: 1 }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleHistorySearch();
                  }
                }}
              />
              <Button
                onClick={handleHistorySearch}
                variant="light"
                leftSection={<IconSearch size="1rem" />}
              >
                Search
              </Button>
              {historySearchUser && (
                <Button
                  onClick={() => {
                    setHistorySearchUser('');
                    setHistoryPage(1);
                    fetchHistory();
                  }}
                  variant="subtle"
                  color="gray"
                >
                  Clear
                </Button>
              )}
            </Group>
          </Card.Section>

          <Card.Section>
            <div style={{ position: 'relative' }}>
              <LoadingOverlay visible={historyLoading} />
              
              {historyError && (
                <Alert 
                  icon={<IconAlertCircle size="1rem" />} 
                  title="Error Loading Premium History" 
                  color="red"
                  variant="light"
                  m="md"
                >
                  <Text>{historyError}</Text>
                  <Button 
                    size="xs" 
                    variant="light" 
                    mt="xs"
                    onClick={fetchHistory}
                  >
                    Try Again
                  </Button>
                </Alert>
              )}

              {!historyError && history.length === 0 && !historyLoading && (
                <Alert 
                  icon={<IconHistory size="1rem" />} 
                  title="No History Records" 
                  color="blue"
                  variant="light"
                  m="md"
                >
                  <Text>
                    {historySearchUser 
                      ? `No history found for "${historySearchUser}".`
                      : 'There are currently no premium history records.'
                    }
                  </Text>
                </Alert>
              )}

              {!historyError && history.length > 0 && (
                <>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Action</Table.Th>
                        <Table.Th>Details</Table.Th>
                        <Table.Th>Duration</Table.Th>
                        <Table.Th>Date</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{historyRows}</Table.Tbody>
                  </Table>
                  
                  {history.length === historyLimit && (
                    <Group justify="center" p="md">
                      <Pagination
                        value={historyPage}
                        onChange={handleHistoryPageChange}
                        total={Math.ceil(history.length / historyLimit) + 1} // Estimate, since we don't have total count
                        size="sm"
                      />
                    </Group>
                  )}
                </>
              )}
            </div>
          </Card.Section>
        </Card>

        {/* Redeem Codes Section */}
        <Card withBorder>
          <Card.Section p="md" withBorder>
            <Group justify="space-between">
              <Text fw={500}>
                <Group gap="xs">
                  <IconCode size="1rem" />
                  Unused Redeem Codes
                </Group>
              </Text>
              <Group gap="md">
                <Badge size="lg" variant="light" color="green">
                  {redeemCodes.filter(code => !code.used).length} Available
                </Badge>
                <Button
                  leftSection={<IconPlus size="1rem" />}
                  onClick={openGenerateModal}
                  size="sm"
                  variant="light"
                >
                  Generate Code
                </Button>
              </Group>
            </Group>
          </Card.Section>

          <Card.Section>
            <div style={{ position: 'relative' }}>
              <LoadingOverlay visible={codesLoading} />
              
              {codesError && (
                <Alert 
                  icon={<IconAlertCircle size="1rem" />} 
                  title="Error Loading Redeem Codes" 
                  color="red"
                  variant="light"
                  m="md"
                >
                  <Text>{codesError}</Text>
                  <Button 
                    size="xs" 
                    variant="light" 
                    mt="xs"
                    onClick={fetchRedeemCodes}
                  >
                    Try Again
                  </Button>
                </Alert>
              )}

              {!codesError && redeemCodes.length === 0 && !codesLoading && (
                <Alert 
                  icon={<IconCode size="1rem" />} 
                  title="No Redeem Codes" 
                  color="blue"
                  variant="light"
                  m="md"
                >
                  <Text>There are currently no unused redeem codes.</Text>
                </Alert>
              )}

              {!codesError && redeemCodes.length > 0 && (
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Code</Table.Th>
                      <Table.Th>Days</Table.Th>
                      <Table.Th>Created At</Table.Th>
                      <Table.Th>Status</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{redeemCodeRows}</Table.Tbody>
                </Table>
              )}
            </div>
          </Card.Section>
        </Card>
      </Stack>

      {/* Generate Code Modal */}
      <Modal
        opened={generateModalOpened}
        onClose={closeGenerateModal}
        title="Generate Redeem Code"
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Generate a new redeem code for premium access.
          </Text>
          
          <NumberInput
            label="Days"
            description="Number of days the code will grant premium access"
            value={generateDays}
            onChange={(value) => setGenerateDays(Number(value) || 30)}
            min={1}
            max={36500}
            required
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeGenerateModal}>
              Cancel
            </Button>
            <Button
              onClick={generateRedeemCode}
              loading={generating}
              leftSection={<IconPlus size="1rem" />}
            >
              Generate Code
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
