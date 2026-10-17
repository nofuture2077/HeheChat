import { useContext, useEffect, useState } from 'react';
import {
  ActionIcon,
  Alert,
  Anchor,
  Badge,
  Container,
  Grid,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Skeleton,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from '@mantine/core';
import { AreaChart, BarChart, BarsList, DonutChart, Heatmap, Sparkline } from '@mantine/charts';
import {
  IconArrowDownRight,
  IconArrowUpRight,
  IconBroadcast,
  IconDashboard,
  IconEye,
  IconMessage,
  IconRefresh,
  IconUserPlus,
} from '@tabler/icons-react';
import { LoginContextContext } from '@/ApplicationContext';

const BASE_URL = import.meta.env.VITE_BACKEND_URL;
const REFRESH_INTERVAL = 5 * 60 * 1000; // matches the server-side cache TTL

interface SeriesPoint {
  t: number;
  streamers: number;
  viewers: number;
  messages: number;
}

interface DailyPoint {
  t: number;
  messages: number;
  subs: number;
  follows: number;
  raids: number;
  cheers: number;
}

interface StreamStats {
  streams: number;
  hours: number;
  viewers: number;
}

interface DashboardUser {
  username: string;
  created: number | null;
  last_login: number | null;
}

interface DashboardData {
  days: number;
  bucket: number;
  range_start: number;
  cached_at: number;
  live: { streamers: number; viewers: number };
  users: { total: number; active: number; new_current: number; new_previous: number };
  premium: number;
  streams: { current: StreamStats; previous: StreamStats };
  series: SeriesPoint[];
  daily: DailyPoint[];
  new_users: { t: number; count: number }[];
  event_types: { event_type: string; count: number }[];
  top_channels: { channel: string; streams: number; hours: number; peak_viewers: number }[];
  top_categories: { category: string; streams: number; hours: number }[];
  tts: { count: number; characters: number; previews: number };
  tts_series: { t: number; count: number }[];
  top_tts_users: { username: string; count: number; characters: number }[];
  latest_users: DashboardUser[];
  recent_users: DashboardUser[];
}

interface LiveStream {
  userName: string;
  title: string;
  category: string;
  viewerCount: number;
  startTime: number;
}

const EVENT_COLORS: Record<string, string> = {
  follow: 'blue.6',
  subscription: 'grape.6',
  donation: 'teal.6',
  raid: 'orange.6',
  cheer: 'pink.6',
};

// keep long names on one line; full name in tooltip
const BAR_STYLE = {
  display: 'block',
  lineHeight: 'var(--bars-list-bar-height)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;

const sum = (values: number[]) => values.reduce((a, b) => a + (b || 0), 0);

// null when there is no previous value to compare against
const percentDiff = (current: number, previous: number | null) =>
  previous ? Math.round(((current - previous) / previous) * 100) : null;

const formatDate = (ms: number | null) =>
  ms
    ? new Date(ms).toLocaleString([], {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
    : '-';

function ChannelLink({ name }: { name: string }) {
  return (
    <Anchor href={`https://twitch.tv/${name}`} target="_blank" rel="noreferrer" size="sm" fw={500}>
      {name}
    </Anchor>
  );
}

const formatMB = (bytes: number) => `${Math.round(bytes / 1024 ** 2).toLocaleString()} MB`;

interface SystemStats {
  rss: number;
  memUsed: number;
  memTotal: number;
  load: number;
}

const formatUptime = (startTime: number) => {
  const seconds = Math.floor(Date.now() / 1000) - startTime;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
};

interface KpiCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  diff?: number | null;
  description?: string;
  sparkline?: number[];
}

function KpiCard({ title, value, icon, diff, description, sparkline }: KpiCardProps) {
  const DiffIcon =
    diff !== undefined && diff !== null && diff >= 0 ? IconArrowUpRight : IconArrowDownRight;
  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between">
        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
          {title}
        </Text>
        <ThemeIcon variant="light" radius="md">
          {icon}
        </ThemeIcon>
      </Group>
      <Group align="flex-end" gap="xs" mt="sm">
        <Text fz={28} fw={700} lh={1}>
          {value.toLocaleString()}
        </Text>
        {diff !== undefined && diff !== null && (
          <Text c={diff >= 0 ? 'teal' : 'red'} fz="sm" fw={500} lh={1}>
            <Group gap={2} component="span">
              {diff}%
              <DiffIcon size={16} stroke={1.5} />
            </Group>
          </Text>
        )}
      </Group>
      <Text fz="xs" c="dimmed" mt={4}>
        {description}
      </Text>
      {sparkline && sparkline.length > 1 && (
        <Sparkline h={40} mt="sm" data={sparkline} curveType="monotone" fillOpacity={0.4} />
      )}
    </Paper>
  );
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <Text fz="lg" fw={700}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text fz="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
    </div>
  );
}

// Mirrors the dashboard grid while the first load is in flight
const SKELETON_ROWS: [number[], number][] = [
  [[8, 4], 280],
  [[4, 4, 4], 220],
  [[4, 4, 4], 220],
  [[4, 8], 280],
  [[6, 6], 300],
];

function SkeletonCard({ h }: { h: number }) {
  return (
    <Paper withBorder p="md" radius="md" h="100%">
      <Skeleton h={16} w="40%" mb="md" />
      <Skeleton h={h} />
    </Paper>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} mb="md">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} h={90} />
        ))}
      </SimpleGrid>
      <Paper withBorder p="md" radius="md" mb="md">
        <Skeleton h={44} />
      </Paper>
      {SKELETON_ROWS.map(([spans, h], row) => (
        <Grid mb="md" key={row}>
          {spans.map((span, i) => (
            <Grid.Col key={i} span={{ base: 12, md: span }}>
              <SkeletonCard h={h} />
            </Grid.Col>
          ))}
        </Grid>
      ))}
    </>
  );
}

export function AdminDashboardPage() {
  const loginContext = useContext(LoginContextContext);
  const [days, setDays] = useState('7');
  const [data, setData] = useState<DashboardData | null>(null);
  const [live, setLive] = useState<{
    connections: number;
    streams: LiveStream[];
    system?: SystemStats;
  }>({
    connections: 0,
    streams: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adminFetch = async (path: string) => {
    const token = localStorage.getItem('hehe-token_state') || '';
    const response = await fetch(
      `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}token=${token}`
    );
    if (response.status === 401) {
      localStorage.removeItem('hehe-token_state');
      loginContext.setAccessToken(undefined);
      throw new Error('Authentication failed. Please log in again.');
    }
    if (response.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    }
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  };

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch(`/api/admin/dashboard?days=${days}`);
      setData(result.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchLive = async () => {
    try {
      const result = await adminFetch('/api/admin/connections');
      // One entry per streamer, a user can have several connections
      const streams = new Map<string, LiveStream>();
      for (const conn of result.connections || []) {
        if (conn.streamInfo) {
          streams.set(conn.userName, { userName: conn.userName, ...conn.streamInfo });
        }
      }
      setLive({
        connections: result.connection_count || 0,
        streams: [...streams.values()].sort((a, b) => b.viewerCount - a.viewerCount),
        system: result.system,
      });
    } catch (e) {
      console.error('Error fetching live connections:', e);
    }
  };

  useEffect(() => {
    setData(null);
    fetchDashboard();
    const interval = setInterval(fetchDashboard, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [days]);

  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 30000);
    return () => clearInterval(interval);
  }, []);

  const rangeStart = data?.range_start || 0;
  const current = data?.series.filter((p) => p.t >= rangeStart) || [];
  const previous = data?.series.filter((p) => p.t < rangeStart) || [];
  // Analytics are kept 90 days, so there is no full previous period for the 90d range
  const hasPrevious = Number(days) < 90;
  const messages = sum(current.map((p) => p.messages));
  const dayStart = Math.floor(rangeStart / 86400) * 86400;
  const daily = data?.daily.filter((p) => p.t >= dayStart) || [];
  const timeLabel = (t: number) =>
    data && data.bucket < 86400
      ? new Date(t * 1000).toLocaleString([], { weekday: 'short', hour: '2-digit' })
      : dayLabel(t);
  // Daily buckets start at UTC midnight
  const dayLabel = (t: number) =>
    new Date(t * 1000).toLocaleDateString(
      [],
      Number(days) <= 7
        ? { weekday: 'short', timeZone: 'UTC' }
        : { day: 'numeric', month: 'short', timeZone: 'UTC' }
    );

  return (
    <Container size="xl">
      <Group justify="space-between" mb="md">
        <div>
          <Group gap="xs">
            <IconDashboard size={28} />
            <Title order={2}>Dashboard</Title>
          </Group>
          <Text c="dimmed" size="sm">
            {data ? `Data as of ${new Date(data.cached_at).toLocaleTimeString()}` : 'Loading…'}
          </Text>
        </div>
        <Group>
          <SegmentedControl
            value={days}
            onChange={setDays}
            data={[
              { label: '24h', value: '1' },
              { label: '7d', value: '7' },
              { label: '30d', value: '30' },
              { label: '90d', value: '90' },
            ]}
          />
          <Tooltip label="Refresh">
            <ActionIcon
              variant="light"
              size="lg"
              loading={loading}
              onClick={() => {
                setData(null);
                fetchDashboard();
                fetchLive();
              }}
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {error && (
        <Alert color="red" mb="md">
          {error}
        </Alert>
      )}

      {!data && !error && <DashboardSkeleton />}

      {data && (
        <>
          <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} mb="md">
            <KpiCard
              title="Live now"
              value={data.live.streamers}
              icon={<IconBroadcast size={18} />}
              description={`${data.live.viewers.toLocaleString()} viewers watching`}
              sparkline={current.map((p) => p.streamers)}
            />
            <KpiCard
              title="Viewers served"
              value={data.streams.current.viewers}
              icon={<IconEye size={18} />}
              diff={
                hasPrevious
                  ? percentDiff(data.streams.current.viewers, data.streams.previous.viewers)
                  : null
              }
              description="Sum of average viewers per stream"
              sparkline={current.map((p) => p.viewers)}
            />
            <KpiCard
              title="Messages"
              value={messages}
              icon={<IconMessage size={18} />}
              diff={
                hasPrevious ? percentDiff(messages, sum(previous.map((p) => p.messages))) : null
              }
              description="Chat messages in tracked streams"
              sparkline={current.map((p) => p.messages)}
            />
            <KpiCard
              title="New users"
              value={data.users.new_current}
              icon={<IconUserPlus size={18} />}
              diff={percentDiff(data.users.new_current, data.users.new_previous)}
              description="First login in this range"
              sparkline={data.new_users.filter((p) => p.t >= dayStart).map((p) => p.count)}
            />
          </SimpleGrid>

          <Paper withBorder p="md" radius="md" mb="md">
            <SimpleGrid cols={{ base: 2, sm: 4, md: 8 }}>
              <SmallStat label="Registered users" value={data.users.total} />
              <SmallStat label="Active users" value={data.users.active} />
              <SmallStat label="Streams" value={data.streams.current.streams} />
              <SmallStat label="Hours streamed" value={data.streams.current.hours} />
              <SmallStat label="Active premium" value={data.premium} />
              <SmallStat label="Connections" value={live.connections} />
              {live.system && (
                <>
                  <Tooltip
                    label={`Server process: ${formatMB(live.system.rss)} / host: ${formatMB(live.system.memUsed)} of ${formatMB(live.system.memTotal)}`}
                  >
                    <div>
                      <SmallStat label="RAM (process)" value={formatMB(live.system.rss)} />
                    </div>
                  </Tooltip>
                  <Tooltip label="1-minute load average per CPU core">
                    <div>
                      <SmallStat
                        label="CPU load"
                        value={`${Math.round(live.system.load * 100)}%`}
                      />
                    </div>
                  </Tooltip>
                </>
              )}
            </SimpleGrid>
          </Paper>

          <Grid mb="md">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper withBorder p="md" radius="md" h="100%">
                <Text fw={600} mb="md">
                  Live streamers &amp; concurrent viewers
                </Text>
                <AreaChart
                  h={280}
                  data={current.map((p) => ({ ...p, label: timeLabel(p.t) }))}
                  dataKey="label"
                  withLegend
                  withRightYAxis
                  curveType="monotone"
                  series={[
                    { name: 'viewers', label: 'Viewers', color: 'violet.6' },
                    { name: 'streamers', label: 'Streamers', color: 'teal.6', yAxisId: 'right' },
                  ]}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md" h="100%">
                <Text fw={600} mb="md">
                  Events by type
                </Text>
                {data.event_types.length > 0 ? (
                  <Group justify="center">
                    <DonutChart
                      size={200}
                      thickness={28}
                      withLabelsLine
                      withLabels
                      data={data.event_types.map((e) => ({
                        name: e.event_type,
                        value: e.count,
                        color: EVENT_COLORS[e.event_type] || 'gray.6',
                      }))}
                    />
                  </Group>
                ) : (
                  <Text c="dimmed" size="sm">
                    No events in this range
                  </Text>
                )}
              </Paper>
            </Grid.Col>
          </Grid>

          <Grid mb="md">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md">
                <Text fw={600} mb="md">
                  Messages per day
                </Text>
                <BarChart
                  h={220}
                  data={daily.map((p) => ({
                    ...p,
                    label: dayLabel(p.t),
                  }))}
                  dataKey="label"
                  series={[{ name: 'messages', label: 'Messages', color: 'blue.6' }]}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md">
                <Text fw={600} mb="md">
                  Events per day
                </Text>
                <BarChart
                  h={220}
                  type="stacked"
                  data={daily.map((p) => ({
                    ...p,
                    label: dayLabel(p.t),
                  }))}
                  dataKey="label"
                  series={[
                    { name: 'follows', label: 'Follows', color: 'blue.6' },
                    { name: 'subs', label: 'Subs', color: 'grape.6' },
                    { name: 'cheers', label: 'Cheers', color: 'pink.6' },
                    { name: 'raids', label: 'Raids', color: 'orange.6' },
                  ]}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md">
                <Text fw={600} mb="md">
                  New users per day
                </Text>
                <BarChart
                  h={220}
                  data={data.new_users
                    .filter((p) => p.t >= dayStart)
                    .map((p) => ({ ...p, label: dayLabel(p.t) }))}
                  dataKey="label"
                  series={[{ name: 'count', label: 'New users', color: 'teal.6' }]}
                />
              </Paper>
            </Grid.Col>
          </Grid>

          <Grid mb="md">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md" h="100%">
                <Text fw={600} mb="md">
                  Top channels (hours streamed)
                </Text>
                <BarsList
                  barsLabel="Channel"
                  valueLabel="Hours"
                  minBarSize="40%"
                  variant="filled"
                  getBarProps={(d) => ({ title: d.name, style: BAR_STYLE })}
                  data={data.top_channels.map((c) => ({
                    name: c.channel,
                    value: c.hours,
                    color: 'violet.7',
                  }))}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md" h="100%">
                <Text fw={600} mb="md">
                  Top categories (hours streamed)
                </Text>
                <BarsList
                  barsLabel="Category"
                  valueLabel="Hours"
                  minBarSize="40%"
                  variant="filled"
                  getBarProps={(d) => ({ title: d.name, style: BAR_STYLE })}
                  data={data.top_categories.map((c) => ({
                    name: c.category,
                    value: c.hours,
                    color: 'teal.7',
                  }))}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md" h="100%" style={{ overflowX: 'auto' }}>
                <Text fw={600} mb="md">
                  Chat activity (90 days)
                </Text>
                <Heatmap
                  withTooltip
                  withMonthLabels
                  rectSize={12}
                  startDate={new Date(Date.now() - 90 * 86400000)}
                  endDate={new Date()}
                  data={Object.fromEntries(
                    data.daily.map((p) => [
                      new Date(p.t * 1000).toISOString().slice(0, 10),
                      p.messages,
                    ])
                  )}
                  getTooltipLabel={({ date, value }) =>
                    `${date}: ${(value || 0).toLocaleString()} messages`
                  }
                />
              </Paper>
            </Grid.Col>
          </Grid>

          <Grid mb="md">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Paper withBorder p="md" radius="md" h="100%">
                <Text fw={600} mb="md">
                  Text-to-speech
                </Text>
                <SimpleGrid cols={3}>
                  <SmallStat label="TTS messages" value={data.tts.count} />
                  <SmallStat label="Characters" value={data.tts.characters} />
                  <SmallStat label="Previews" value={data.tts.previews} />
                </SimpleGrid>
                <BarChart
                  h={160}
                  mt="md"
                  data={data.tts_series.map((p) => ({ ...p, label: timeLabel(p.t) }))}
                  dataKey="label"
                  series={[{ name: 'count', label: 'TTS messages', color: 'cyan.6' }]}
                />
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Paper withBorder p="md" radius="md" h="100%">
                <Text fw={600} mb="md">
                  Top TTS users
                </Text>
                {data.top_tts_users.length > 0 ? (
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>User</Table.Th>
                        <Table.Th>TTS</Table.Th>
                        <Table.Th>Characters</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {data.top_tts_users.map((u) => (
                        <Table.Tr key={u.username}>
                          <Table.Td>
                            <ChannelLink name={u.username} />
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{u.count.toLocaleString()}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{u.characters.toLocaleString()}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                ) : (
                  <Text c="dimmed" size="sm">
                    No TTS usage in this range
                  </Text>
                )}
              </Paper>
            </Grid.Col>
          </Grid>

          <Grid mb="md">
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="md" radius="md" h="100%">
                <Group justify="space-between" mb="md">
                  <Text fw={600}>Live now</Text>
                  <Badge color="red" variant="light">
                    {live.streams.length} live
                  </Badge>
                </Group>
                <Table.ScrollContainer minWidth={400}>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Streamer</Table.Th>
                        <Table.Th>Category</Table.Th>
                        <Table.Th>Viewers</Table.Th>
                        <Table.Th>Uptime</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {live.streams.map((s) => (
                        <Table.Tr key={s.userName}>
                          <Table.Td>
                            <ChannelLink name={s.userName} />
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {s.title}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{s.category}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{s.viewerCount?.toLocaleString()}</Text>
                          </Table.Td>
                          <Table.Td>
                            <Text size="sm">{formatUptime(s.startTime)}</Text>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Paper withBorder p="md" radius="md" h="100%">
                <Tabs defaultValue="latest">
                  <Tabs.List mb="sm">
                    <Tabs.Tab value="latest">Newest users</Tabs.Tab>
                    <Tabs.Tab value="recent">Recently active</Tabs.Tab>
                  </Tabs.List>
                  {(['latest', 'recent'] as const).map((list) => (
                    <Tabs.Panel value={list} key={list}>
                      <Table striped highlightOnHover>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>User</Table.Th>
                            <Table.Th>Joined</Table.Th>
                            <Table.Th>Last login</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {(list === 'latest' ? data.latest_users : data.recent_users).map((u) => (
                            <Table.Tr key={u.username}>
                              <Table.Td>
                                <ChannelLink name={u.username} />
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{formatDate(u.created)}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{formatDate(u.last_login)}</Text>
                              </Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </Tabs.Panel>
                  ))}
                </Tabs>
              </Paper>
            </Grid.Col>
          </Grid>
        </>
      )}
    </Container>
  );
}
