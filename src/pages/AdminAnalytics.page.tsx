import { Container, Title, Text, Alert, Stack, Select, Card, Group, Grid, Tabs, Table, Badge, ScrollArea, Divider, Paper, ActionIcon } from '@mantine/core';
import { IconChartBar, IconAlertCircle, IconTrendingUp, IconUsers, IconHeart, IconGift, IconMessageCircle, IconRefresh, IconEye } from '@tabler/icons-react';
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

interface CurrentStreamStats {
  success: boolean;
  channel: string;
  stream_info: {
    title: string;
    category: string;
    start_time: number;
    duration_seconds: number;
  };
  summary: EventSummary;
  supporters: {
    new_followers: Array<{
      username: string;
      display_name: string;
      timestamp: number;
    }>;
    new_subscribers: Array<{
      username: string;
      display_name: string;
      tier: string;
      timestamp: number;
      months: number;
      is_gift: boolean;
      gifter: string | null;
    }>;
    donations: Array<{
      username: string;
      display_name: string;
      amount: number;
      platform: string;
      timestamp: number;
      message: string;
    }>;
    raids: Array<{
      username: string;
      display_name: string;
      viewer_count: number;
    }>;
    top_chatters: Array<{
      username: string;
      display_name: string;
      message_count: number;
      is_first_time_chatter: boolean;
    }>;
    top_donators: Array<{
      username: string;
      display_name: string;
      amount: number;
      platform: string;
      message: string;
    }>;
  };
}

export function AdminAnalyticsPage() {
  // State for additional features
  const [currentStreamStats, setCurrentStreamStats] = useState<CurrentStreamStats | null>(null);
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [activeTab, setActiveTab] = useState<string>('events');
  const [eventsLoading, setEventsLoading] = useState(false);
  const [chatUsersLoading, setChatUsersLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [currentStatsLoading, setCurrentStatsLoading] = useState(false);
  
  // Channel and stream selection for additional features
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [selectedStreamData, setSelectedStreamData] = useState<any>(null);
  const { channels } = useChannels();

  // API methods for additional features
  const fetchCurrentStreamStats = async (channel: string) => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!channel) return;
    
    setCurrentStatsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analytics/stream/current?token=${encodeURIComponent(adminToken)}&channelname=${channel}`);
      if (response.ok) {
        const data = await response.json();
        setCurrentStreamStats(data);
      }
    } catch (error) {
      console.error('Error fetching current stream stats:', error);
    } finally {
      setCurrentStatsLoading(false);
    }
  };

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
      fetchCurrentStreamStats(selectedChannel);
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
            setSelectedStreamId(streamId);
            setSelectedStreamData(streamData);
          }}
        />

        {/* Additional Analytics Features */}
        <Divider my="xl" />
        
        <Card withBorder p="md" mb="md">
          <Group justify="space-between" align="center">
            <div>
              <Title order={3}>Additional Analytics</Title>
              <Text c="dimmed" size="sm">
                Additional analytics will automatically use the channel selected in the Stream Analytics above
              </Text>
            </div>
            {selectedChannel && (
              <Badge size="lg" variant="light">
                Channel: {selectedChannel}
              </Badge>
            )}
          </Group>
        </Card>
        
        {!selectedChannel ? (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Select a Channel" color="blue">
            Please select a channel in the Stream Analytics section above to view additional analytics features.
          </Alert>
        ) : (
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'events')}>
            <Tabs.List>
              <Tabs.Tab value="events" leftSection={<IconHeart size="0.8rem" />}>
                Event Tracking
              </Tabs.Tab>
              <Tabs.Tab value="chat-analytics" leftSection={<IconUsers size="0.8rem" />}>
                Chat Analytics
              </Tabs.Tab>
              <Tabs.Tab value="stream-details" leftSection={<IconChartBar size="0.8rem" />}>
                Stream Details
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="events" pt="xs">
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Title order={4}>Stream Events (Last 7 Days)</Title>
                  <Group>
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
                    />
                    <ActionIcon 
                      variant="light" 
                      onClick={() => fetchStreamEvents(selectedChannel)}
                      loading={eventsLoading}
                    >
                      <IconRefresh size="1rem" />
                    </ActionIcon>
                  </Group>
                </Group>

                {/* Event Summary Cards */}
                {eventSummary && (
                  <Grid mb="md">
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
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="chat-analytics" pt="xs">
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <Title order={4}>Chat Users (Last 7 Days)</Title>
                  <ActionIcon 
                    variant="light" 
                    onClick={() => fetchChatUsers(selectedChannel)}
                    loading={chatUsersLoading}
                  >
                    <IconRefresh size="1rem" />
                  </ActionIcon>
                </Group>
                
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
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="stream-details" pt="xs">
              <Stack gap="md">
                {!selectedStreamData ? (
                  <Alert icon={<IconAlertCircle size="1rem" />} title="Select a Stream" color="blue">
                    Please select a stream from the Stream Analytics section above to view detailed analytics for that specific stream.
                  </Alert>
                ) : (
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <Title order={4}>Stream Details</Title>
                      <Badge size="lg" variant="light">
                        {selectedStreamData.title}
                      </Badge>
                    </Group>

                    {/* Stream Information Card */}
                    <Card withBorder p="md">
                      <Group justify="space-between" mb="md">
                        <div>
                          <Title order={5}>{selectedStreamData.title}</Title>
                          <Text c="dimmed">Stream Analytics</Text>
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
                        <Title order={5}>Stream Events</Title>
                        <Text size="sm" c="dimmed">
                          Events that occurred during this stream
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
                                  // Filter events that occurred during this stream
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

                    {/* Chat Users for Selected Stream */}
                    <Card withBorder p="md">
                      <Group justify="space-between" mb="md">
                        <Title order={5}>Chat Users</Title>
                        <Text size="sm" c="dimmed">
                          Users who chatted during this stream
                        </Text>
                      </Group>
                      
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
                              {chatUsers
                                .filter(user => {
                                  // Filter users who chatted during this stream
                                  return user.first_message_time >= selectedStreamData.start_timestamp && 
                                         user.first_message_time <= selectedStreamData.end_timestamp;
                                })
                                .map((user) => (
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
            </Tabs.Panel>
          </Tabs>
        )}
      </Stack>
    </Container>
  );
}
