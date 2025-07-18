import { Container, Title, Text, Stack, Select, Card, Group, Grid, Table, Badge, ScrollArea, Divider, Paper, ActionIcon } from '@mantine/core';
import { IconChartBar, IconTrendingUp, IconUsers, IconHeart, IconGift, IconMessageCircle, IconRefresh } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { StreamAnalyticsChart } from '../components/analytics/StreamAnalyticsChart';
import { useChannels } from '../hooks/useChannels';

// New interfaces for the additional features
interface StreamEvent {
  id: number;
  channel: string;
  stream_session_id: number | null;
  event_type: 'follow' | 'subscription' | 'donation' | 'raid';
  event_subtype: string | null;
  username: string;
  user_id: string | null;
  display_name: string;
  timestamp: number;
  amount: number | null;
  metadata: any;
  created_at: string;
}

interface ChatUser {
  id: number;
  channel: string;
  stream_session_id: number | null;
  username: string;
  user_id: string;
  display_name: string;
  first_message_time: number;
  last_message_time: number;
  message_count: number;
  is_first_time_chatter: boolean;
  created_at: string;
}

interface EventSummary {
  follows: number;
  subscriptions: {
    total: number;
    tier1: number;
    tier2: number;
    tier3: number;
    prime: number;
  };
  donations: {
    total: number;
    total_amount: number;
    by_platform: {
      [platform: string]: {
        count: number;
        amount: number;
      };
    };
  };
  raids: {
    total: number;
    total_viewers: number;
  };
  chat_users: {
    total: number;
    first_time_chatters: number;
  };
}


export function AdminAnalyticsPage() {
  // State for additional features
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [chatUsersLoading, setChatUsersLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  
  // Channel and stream selection for additional features
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedStreamData, setSelectedStreamData] = useState<any>(null);

  // API methods for additional features

  const fetchStreamEvents = async (channel: string, eventType?: string) => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!channel) return;
    
    setEventsLoading(true);
    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (7 * 24 * 60 * 60); // 7 days ago
      
      const params = new URLSearchParams({
        token: adminToken,
        channelname: channel,
        start: startTime.toString(),
        end: endTime.toString()
      });
      
      if (eventType) {
        params.append('event_type', eventType);
      }
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/stream/events?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStreamEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching stream events:', error);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchChatUsers = async (channel: string) => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!channel) return;
    
    setChatUsersLoading(true);
    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (7 * 24 * 60 * 60); // 7 days ago
      
      const params = new URLSearchParams({
        token: adminToken,
        channelname: channel,
        start: startTime.toString(),
        end: endTime.toString()
      });
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/stream/chat-users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setChatUsers(data.chat_users || []);
      }
    } catch (error) {
      console.error('Error fetching chat users:', error);
    } finally {
      setChatUsersLoading(false);
    }
  };

  const fetchEventSummary = async (channel: string) => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!channel) return;
    
    setSummaryLoading(true);
    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (7 * 24 * 60 * 60); // 7 days ago
      
      const params = new URLSearchParams({
        token: adminToken,
        channelname: channel,
        start: startTime.toString(),
        end: endTime.toString()
      });
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/stream/summary?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEventSummary(data.summary);
      }
    } catch (error) {
      console.error('Error fetching event summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChannel) {
      fetchStreamEvents(selectedChannel);
      fetchChatUsers(selectedChannel);
      fetchEventSummary(selectedChannel);
    }
  }, [selectedChannel]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'follow': return <IconUsers size="1rem" />;
      case 'subscription': return <IconHeart size="1rem" />;
      case 'donation': return <IconGift size="1rem" />;
      case 'raid': return <IconTrendingUp size="1rem" />;
      default: return <IconMessageCircle size="1rem" />;
    }
  };

  const getEventTypeBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'follow': return 'blue';
      case 'subscription': return 'red';
      case 'donation': return 'green';
      case 'raid': return 'orange';
      default: return 'gray';
    }
  };

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) => (
    <Card withBorder p="md">
      <Group justify="space-between">
        <div>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed">
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
        </div>
        {icon}
      </Group>
    </Card>
  );

  return (
    <Container size="xl">
      <Stack gap="md">
        <div>
          <Title order={2}>
            <Group gap="xs">
              <IconChartBar size="1.5rem" />
              Analytics Dashboard
            </Group>
          </Title>
          <Text c="dimmed" size="sm">
            View detailed analytics for HeheChat channels
          </Text>
        </div>

        <StreamAnalyticsChart 
          admin={true} 
          onChannelChange={(channel) => setSelectedChannel(channel)}
          onStreamChange={(streamId, streamData) => {
            setSelectedStreamData(streamData);
          }}
        />

        {/* Stream Details - shown directly below the graph */}
        {selectedStreamData && (
          <Stack gap="md" mt="xl">
            <Divider />
            <Title order={3}>Stream Details</Title>
            
            {/* Stream Information Card */}
            <Card withBorder p="md">
              <Group justify="space-between" mb="md">
                <div>
                  <Title order={4}>{selectedStreamData.title}</Title>
                  <Text c="dimmed">Selected Stream Analytics</Text>
                </div>
                {selectedStreamData.id === null && (
                  <Badge color="red" size="lg">LIVE</Badge>
                )}
              </Group>
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">Duration</Text>
                  <Text fw={600}>{formatDuration(selectedStreamData.duration_seconds)}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">Peak Viewers</Text>
                  <Text fw={600}>{formatNumber(selectedStreamData.peak_viewers)}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">Avg Viewers</Text>
                  <Text fw={600}>{formatNumber(selectedStreamData.avg_viewers)}</Text>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Text size="sm" c="dimmed">Total Messages</Text>
                  <Text fw={600}>{formatNumber(selectedStreamData.total_messages)}</Text>
                </Grid.Col>
              </Grid>
            </Card>

            {/* Stream Events for Selected Stream */}
            <Card withBorder p="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>Events During This Stream</Title>
                <Text size="sm" c="dimmed">
                  {streamEvents.filter(event => 
                    event.timestamp >= selectedStreamData.start_timestamp && 
                    event.timestamp <= selectedStreamData.end_timestamp
                  ).length} events
                </Text>
              </Group>
              
              <Paper withBorder>
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Amount</Table.Th>
                        <Table.Th>Details</Table.Th>
                        <Table.Th>Time</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {streamEvents
                        .filter(event => {
                          return event.timestamp >= selectedStreamData.start_timestamp && 
                                 event.timestamp <= selectedStreamData.end_timestamp;
                        })
                        .map((event) => (
                        <Table.Tr key={event.id}>
                          <Table.Td>
                            <Group gap="xs">
                              {getEventTypeIcon(event.event_type)}
                              <Badge color={getEventTypeBadgeColor(event.event_type)} size="sm">
                                {event.event_type}
                              </Badge>
                            </Group>
                          </Table.Td>
                          <Table.Td>{event.display_name}</Table.Td>
                          <Table.Td>
                            {event.amount ? formatCurrency(event.amount) : '-'}
                          </Table.Td>
                          <Table.Td>
                            {event.event_subtype && (
                              <Badge variant="light" size="xs">{event.event_subtype}</Badge>
                            )}
                            {event.metadata?.message && (
                              <Text size="xs" c="dimmed" truncate>
                                {event.metadata.message}
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatTimestamp(event.timestamp)}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Card>
          </Stack>
        )}

        {/* Channel Data for Last 7 Days - shown below stream details */}
        {selectedChannel && (
          <Stack gap="md" mt="xl">
            <Divider />
            <Group justify="space-between" align="center">
              <Title order={3}>Channel Activity (Last 7 Days)</Title>
              <ActionIcon 
                variant="light" 
                onClick={() => {
                  fetchStreamEvents(selectedChannel);
                  fetchChatUsers(selectedChannel);
                  fetchEventSummary(selectedChannel);
                }}
                loading={eventsLoading || chatUsersLoading || summaryLoading}
              >
                <IconRefresh size="1rem" />
              </ActionIcon>
            </Group>

            {/* Event Summary Cards */}
            {eventSummary && (
              <Grid>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <StatCard 
                    title="Follows" 
                    value={formatNumber(eventSummary.follows)} 
                    icon={<IconUsers size="1.5rem" />} 
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <StatCard 
                    title="Subscriptions" 
                    value={formatNumber(eventSummary.subscriptions.total)} 
                    icon={<IconHeart size="1.5rem" />} 
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <StatCard 
                    title="Donations" 
                    value={`${formatNumber(eventSummary.donations.total)} (${formatCurrency(eventSummary.donations.total_amount)})`} 
                    icon={<IconGift size="1.5rem" />} 
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <StatCard 
                    title="Raids" 
                    value={`${formatNumber(eventSummary.raids.total)} (${formatNumber(eventSummary.raids.total_viewers)} viewers)`} 
                    icon={<IconTrendingUp size="1.5rem" />} 
                  />
                </Grid.Col>
              </Grid>
            )}
            
            {/* All Events Table */}
            <Card withBorder p="md">
              <Group justify="space-between" mb="md">
                <Title order={4}>All Events</Title>
                <Select
                  placeholder="Filter by event type"
                  data={[
                    { value: '', label: 'All Events' },
                    { value: 'follow', label: 'Follows' },
                    { value: 'subscription', label: 'Subscriptions' },
                    { value: 'donation', label: 'Donations' },
                    { value: 'raid', label: 'Raids' }
                  ]}
                  onChange={(value) => fetchStreamEvents(selectedChannel, value || undefined)}
                  w={200}
                />
              </Group>
              
              <Paper withBorder>
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Amount</Table.Th>
                        <Table.Th>Details</Table.Th>
                        <Table.Th>Time</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {streamEvents.map((event) => (
                        <Table.Tr key={event.id}>
                          <Table.Td>
                            <Group gap="xs">
                              {getEventTypeIcon(event.event_type)}
                              <Badge color={getEventTypeBadgeColor(event.event_type)} size="sm">
                                {event.event_type}
                              </Badge>
                            </Group>
                          </Table.Td>
                          <Table.Td>{event.display_name}</Table.Td>
                          <Table.Td>
                            {event.amount ? formatCurrency(event.amount) : '-'}
                          </Table.Td>
                          <Table.Td>
                            {event.event_subtype && (
                              <Badge variant="light" size="xs">{event.event_subtype}</Badge>
                            )}
                            {event.metadata?.message && (
                              <Text size="xs" c="dimmed" truncate>
                                {event.metadata.message}
                              </Text>
                            )}
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatTimestamp(event.timestamp)}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Card>

            {/* Chat Users Table */}
            <Card withBorder p="md">
              <Title order={4} mb="md">Chat Users</Title>
              
              <Paper withBorder>
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>Messages</Table.Th>
                        <Table.Th>First Message</Table.Th>
                        <Table.Th>Last Message</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {chatUsers.map((user) => (
                        <Table.Tr key={user.id}>
                          <Table.Td>{user.display_name}</Table.Td>
                          <Table.Td>
                            <Badge variant="light">{formatNumber(user.message_count)}</Badge>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatTimestamp(user.first_message_time)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatTimestamp(user.last_message_time)}</Text>
                          </Table.Td>
                          <Table.Td>
                            {user.is_first_time_chatter && (
                              <Badge color="blue" size="sm">First Time</Badge>
                            )}
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Card>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
