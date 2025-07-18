import { Container, Title, Text, Button, Alert, Stack, Select, Card, Group, LoadingOverlay, Grid, Tabs, Table, Badge, ScrollArea, Divider, Paper, ActionIcon, Tooltip } from '@mantine/core';
import { IconChartBar, IconAlertCircle, IconCalendar, IconTrendingUp, IconUsers, IconHeart, IconGift, IconMessageCircle, IconRefresh, IconEye, IconClock, IconTrophy } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { AnalyticsApiClient, StreamAnalyticsResponse } from '../api/analytics';
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

interface StreamSession {
  id: number;
  start_timestamp: number;
  end_timestamp: number;
  duration_seconds: number;
  title: string;
  category: string;
  peak_viewers: number;
  avg_viewers: number;
  total_messages: number;
  is_active: boolean;
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
  const [analyticsData, setAnalyticsData] = useState<StreamAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New state for additional features
  const [currentStreamStats, setCurrentStreamStats] = useState<CurrentStreamStats | null>(null);
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [streamSessions, setStreamSessions] = useState<StreamSession[]>([]);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [eventsLoading, setEventsLoading] = useState(false);
  const [chatUsersLoading, setChatUsersLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [currentStatsLoading, setCurrentStatsLoading] = useState(false);
  
  // State to track the selected channel and stream from the chart component
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedStreamId, setSelectedStreamId] = useState<string>('');
  const [selectedStreamData, setSelectedStreamData] = useState<any>(null);

  const fetchAnalytics = async (channel: string) => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!channel) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get analytics for the last 7 days
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (7 * 24 * 60 * 60); // 7 days ago
      
      const data = await AnalyticsApiClient.getStreamAnalytics(
        channel,
        adminToken,
        startTime,
        endTime,
        '1h',
        true,
        true
      );
      
      setAnalyticsData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics');
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // New API methods for additional features
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

  const fetchStreamSessions = async (channel: string) => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!channel) return;
    
    setSessionsLoading(true);
    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - (30 * 24 * 60 * 60); // 30 days ago
      
      const params = new URLSearchParams({
        token: adminToken,
        channelname: channel,
        start: startTime.toString(),
        end: endTime.toString()
      });
      
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/streams?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStreamSessions(data.streams || []);
      }
    } catch (error) {
      console.error('Error fetching stream sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChannel) {
      fetchAnalytics(selectedChannel);
      fetchCurrentStreamStats(selectedChannel);
      fetchStreamEvents(selectedChannel);
      fetchChatUsers(selectedChannel);
      fetchEventSummary(selectedChannel);
      fetchStreamSessions(selectedChannel);
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

        <StreamAnalyticsChart admin={true} />

        {/* New Features Section */}
        <Divider my="xl" />
        
        <Card withBorder p="md" mb="md">
          <Group justify="space-between" align="center">
            <div>
              <Title order={3}>Detailed Analytics</Title>
              <Text c="dimmed" size="sm">
                Select a channel to view detailed event tracking, chat analytics, and stream sessions
              </Text>
            </div>
            <Select
              label="Channel"
              placeholder="Select a channel for detailed analytics"
              value={selectedChannel}
              onChange={(value) => setSelectedChannel(value || '')}
              data={useChannels().channels.map(channel => ({ value: channel, label: channel }))}
              searchable
              w={300}
              disabled={useChannels().loading}
            />
          </Group>
        </Card>
        
        {!selectedChannel ? (
          <Alert icon={<IconAlertCircle size="1rem" />} title="Select a Channel" color="blue">
            Please select a channel above to view detailed analytics features.
          </Alert>
        ) : (
          <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'overview')}>
          <Tabs.List>
            <Tabs.Tab value="overview" leftSection={<IconTrendingUp size="0.8rem" />}>
              Overview
            </Tabs.Tab>
            <Tabs.Tab value="current-stream" leftSection={<IconEye size="0.8rem" />}>
              Current Stream
            </Tabs.Tab>
            <Tabs.Tab value="events" leftSection={<IconHeart size="0.8rem" />}>
              Stream Events
            </Tabs.Tab>
            <Tabs.Tab value="chat-users" leftSection={<IconUsers size="0.8rem" />}>
              Chat Users
            </Tabs.Tab>
            <Tabs.Tab value="sessions" leftSection={<IconClock size="0.8rem" />}>
              Stream Sessions
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" pt="xs">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Event Summary (Last 7 Days)</Title>
                <ActionIcon 
                  variant="light" 
                  onClick={() => selectedChannel && fetchEventSummary(selectedChannel)}
                  loading={summaryLoading}
                >
                  <IconRefresh size="1rem" />
                </ActionIcon>
              </Group>
              
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

              {eventSummary && (
                <Grid>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card withBorder p="md">
                      <Title order={4} mb="md">Subscription Breakdown</Title>
                      <Stack gap="xs">
                        <Group justify="space-between">
                          <Text>Tier 1:</Text>
                          <Badge color="blue">{formatNumber(eventSummary.subscriptions.tier1)}</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text>Tier 2:</Text>
                          <Badge color="purple">{formatNumber(eventSummary.subscriptions.tier2)}</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text>Tier 3:</Text>
                          <Badge color="gold">{formatNumber(eventSummary.subscriptions.tier3)}</Badge>
                        </Group>
                        <Group justify="space-between">
                          <Text>Prime:</Text>
                          <Badge color="violet">{formatNumber(eventSummary.subscriptions.prime)}</Badge>
                        </Group>
                      </Stack>
                    </Card>
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, md: 6 }}>
                    <Card withBorder p="md">
                      <Title order={4} mb="md">Donations by Platform</Title>
                      <Stack gap="xs">
                        {Object.entries(eventSummary.donations.by_platform).map(([platform, data]) => (
                          <Group key={platform} justify="space-between">
                            <Text tt="capitalize">{platform}:</Text>
                            <Badge color="green">
                              {formatNumber(data.count)} ({formatCurrency(data.amount)})
                            </Badge>
                          </Group>
                        ))}
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="current-stream" pt="xs">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Current Stream Stats</Title>
                <ActionIcon 
                  variant="light" 
                  onClick={() => selectedChannel && fetchCurrentStreamStats(selectedChannel)}
                  loading={currentStatsLoading}
                >
                  <IconRefresh size="1rem" />
                </ActionIcon>
              </Group>
              
              {currentStreamStats ? (
                <Stack gap="md">
                  <Card withBorder p="md">
                    <Group justify="space-between" mb="md">
                      <div>
                        <Title order={4}>{currentStreamStats.stream_info.title}</Title>
                        <Text c="dimmed">{currentStreamStats.stream_info.category}</Text>
                      </div>
                      <Badge color="green" size="lg">LIVE</Badge>
                    </Group>
                    <Text>
                      Duration: {formatDuration(currentStreamStats.stream_info.duration_seconds)}
                    </Text>
                    <Text>
                      Started: {formatTimestamp(currentStreamStats.stream_info.start_time)}
                    </Text>
                  </Card>

                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Card withBorder p="md">
                        <Title order={4} mb="md">New Followers</Title>
                        <ScrollArea h={200}>
                          <Stack gap="xs">
                            {currentStreamStats.supporters.new_followers.map((follower, index) => (
                              <Group key={index} justify="space-between">
                                <Text>{follower.display_name}</Text>
                                <Text size="sm" c="dimmed">
                                  {formatTimestamp(follower.timestamp)}
                                </Text>
                              </Group>
                            ))}
                          </Stack>
                        </ScrollArea>
                      </Card>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Card withBorder p="md">
                        <Title order={4} mb="md">New Subscribers</Title>
                        <ScrollArea h={200}>
                          <Stack gap="xs">
                            {currentStreamStats.supporters.new_subscribers.map((sub, index) => (
                              <Group key={index} justify="space-between">
                                <div>
                                  <Text>{sub.display_name}</Text>
                                  <Text size="xs" c="dimmed">
                                    {sub.tier} • {sub.months} months
                                  </Text>
                                </div>
                                <Text size="sm" c="dimmed">
                                  {formatTimestamp(sub.timestamp)}
                                </Text>
                              </Group>
                            ))}
                          </Stack>
                        </ScrollArea>
                      </Card>
                    </Grid.Col>
                  </Grid>

                  <Grid>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Card withBorder p="md">
                        <Title order={4} mb="md">Recent Donations</Title>
                        <ScrollArea h={200}>
                          <Stack gap="xs">
                            {currentStreamStats.supporters.donations.map((donation, index) => (
                              <div key={index}>
                                <Group justify="space-between">
                                  <Text>{donation.display_name}</Text>
                                  <Badge color="green">{formatCurrency(donation.amount)}</Badge>
                                </Group>
                                <Text size="xs" c="dimmed">{donation.message}</Text>
                                <Text size="xs" c="dimmed">
                                  {donation.platform} • {formatTimestamp(donation.timestamp)}
                                </Text>
                              </div>
                            ))}
                          </Stack>
                        </ScrollArea>
                      </Card>
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <Card withBorder p="md">
                        <Title order={4} mb="md">Top Chatters</Title>
                        <ScrollArea h={200}>
                          <Stack gap="xs">
                            {currentStreamStats.supporters.top_chatters.map((chatter, index) => (
                              <Group key={index} justify="space-between">
                                <div>
                                  <Text>{chatter.display_name}</Text>
                                  {chatter.is_first_time_chatter && (
                                    <Badge size="xs" color="blue">First Time</Badge>
                                  )}
                                </div>
                                <Badge variant="light">{formatNumber(chatter.message_count)} messages</Badge>
                              </Group>
                            ))}
                          </Stack>
                        </ScrollArea>
                      </Card>
                    </Grid.Col>
                  </Grid>
                </Stack>
              ) : (
                <Alert icon={<IconAlertCircle size="1rem" />} title="No Active Stream" color="yellow">
                  No active stream session found for this channel.
                </Alert>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="events" pt="xs">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Stream Events (Last 7 Days)</Title>
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
                    onChange={(value) => selectedChannel && fetchStreamEvents(selectedChannel, value || undefined)}
                  />
                  <ActionIcon 
                    variant="light" 
                    onClick={() => selectedChannel && fetchStreamEvents(selectedChannel)}
                    loading={eventsLoading}
                  >
                    <IconRefresh size="1rem" />
                  </ActionIcon>
                </Group>
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
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="chat-users" pt="xs">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Chat Users (Last 7 Days)</Title>
                <ActionIcon 
                  variant="light" 
                  onClick={() => selectedChannel && fetchChatUsers(selectedChannel)}
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

          <Tabs.Panel value="sessions" pt="xs">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Stream Sessions (Last 30 Days)</Title>
                <ActionIcon 
                  variant="light" 
                  onClick={() => selectedChannel && fetchStreamSessions(selectedChannel)}
                  loading={sessionsLoading}
                >
                  <IconRefresh size="1rem" />
                </ActionIcon>
              </Group>
              
              <Paper withBorder>
                <ScrollArea>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Title</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Duration</Table.Th>
                        <Table.Th>Peak Viewers</Table.Th>
                        <Table.Th>Avg Viewers</Table.Th>
                        <Table.Th>Messages</Table.Th>
                        <Table.Th>Start Time</Table.Th>
                        <Table.Th>Status</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {streamSessions.map((session) => (
                        <Table.Tr key={session.id}>
                          <Table.Td>
                            <Text truncate maw={200}>{session.title}</Text>
                          </Table.Td>
                          <Table.Td>{session.category}</Table.Td>
                          <Table.Td>{formatDuration(session.duration_seconds)}</Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <IconTrophy size="0.8rem" />
                              {formatNumber(session.peak_viewers)}
                            </Group>
                          </Table.Td>
                          <Table.Td>{formatNumber(session.avg_viewers)}</Table.Td>
                          <Table.Td>{formatNumber(session.total_messages)}</Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatTimestamp(session.start_timestamp)}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Badge color={session.is_active ? 'green' : 'gray'}>
                              {session.is_active ? 'Live' : 'Ended'}
                            </Badge>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
        )}
      </Stack>
    </Container>
  );
}
