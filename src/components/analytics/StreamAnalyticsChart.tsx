import React, { useState, useEffect, useContext } from 'react';
import {
  Stack,
  Text,
  Fieldset,
  Select,
  Group,
  Button,
  Alert,
  LoadingOverlay,
  Card,
  Grid,
  Badge,
  Tooltip
} from '@mantine/core';
import { TextInput } from '@mantine/core';
import { LineChart, AreaChart, CompositeChart } from '@mantine/charts';
import { IconInfoCircle, IconTrendingUp, IconUsers, IconMessage, IconGift, IconBolt } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import { AnalyticsApiClient, StreamAnalyticsData, StreamAnalyticsSummary, fillMissingTimestamps } from '@/api/analytics';

interface ChartDataPoint {
  timestamp: string;
  time: string;
  viewer_count: number | null;
  message_count: number;
  sub_count: number;
  cheer_count: number;
  cheer_bits_total: number;
  raid_count: number;
  raid_viewers_total: number;
  follow_count: number;
}

const INTERVAL_OPTIONS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '6h', label: '6 Hours' },
  { value: '12h', label: '12 Hours' },
  { value: '1d', label: '1 Day' }
];

const CHART_TYPE_OPTIONS = [
  { value: 'composed', label: 'Composed Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'area', label: 'Area Chart' }
];

const TIME_RANGE_OPTIONS = [
  { value: 'last24h', label: 'Last 24 Hours' },
  { value: 'last7d', label: 'Last 7 Days' },
  { value: 'last30d', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' }
];

export function StreamAnalyticsChart(props: {channel: string, admin: boolean}) {
  const premium = useContext(PremiumContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [summary, setSummary] = useState<StreamAnalyticsSummary | null>(null);
  const [interval, setInterval] = useState<string>('1h');
  const [chartType, setChartType] = useState<string>('composed');
  const [timeRange, setTimeRange] = useState<string>('last24h');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const getToken = () => {
    return localStorage.getItem('hehe-token_state') || '';
  };

  const getTimeRange = () => {
    const now = Math.floor(Date.now() / 1000);
    
    switch (timeRange) {
      case 'last24h':
        return { start: now - 24 * 60 * 60, end: now };
      case 'last7d':
        return { start: now - 7 * 24 * 60 * 60, end: now };
      case 'last30d':
        return { start: now - 30 * 24 * 60 * 60, end: now };
      case 'custom':
        if (startDate && endDate) {
          return {
            start: Math.floor(startDate.getTime() / 1000),
            end: Math.floor(endDate.getTime() / 1000)
          };
        }
        return { start: now - 24 * 60 * 60, end: now };
      default:
        return { start: now - 24 * 60 * 60, end: now };
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    
    if (interval === '1m' || interval === '5m' || interval === '15m' || interval === '30m') {
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else if (interval === '1h' || interval === '6h' || interval === '12h') {
      return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const transformData = (rawData: StreamAnalyticsData[]): ChartDataPoint[] => {
    return rawData.map(item => ({
      timestamp: item.timestamp_minute.toString(),
      time: formatTimestamp(item.timestamp_minute),
      viewer_count: item.viewer_count,
      message_count: item.message_count,
      sub_count: item.sub_count,
      cheer_count: item.cheer_count,
      cheer_bits_total: item.cheer_bits_total,
      raid_count: item.raid_count,
      raid_viewers_total: item.raid_viewers_total,
      follow_count: item.follow_count
    }));
  };

  const fetchAnalytics = async () => {
    if (!premium.isPremium && !props.admin) {
      setError('Premium subscription required for analytics');
      return;
    }

    const token = getToken();
    if (!token) {
      setError('Authentication token not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getTimeRange();
      const response = await AnalyticsApiClient.getStreamAnalytics(
        props.channel,
        token,
        start,
        end,
        interval as any,
        true,
        false
      );

      if (response.success) {
        // Fill missing timestamps with zero values for better chart visualization
        const filledData = fillMissingTimestamps(
          response.data,
          start,
          end,
          interval as any
        );
        const transformedData = transformData(filledData);
        setData(transformedData);
        setSummary(response.summary || null);
      } else {
        setError('Failed to fetch analytics data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (premium.isPremium || props.admin) {
      fetchAnalytics();
    }
  }, [premium.isPremium, interval, timeRange, startDate, endDate, props.admin]);

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <Alert icon={<IconInfoCircle size={16} />} title="No Data" color="blue">
          No analytics data available for the selected time range.
        </Alert>
      );
    }

    const chartProps = {
      h: 400,
      data,
      dataKey: 'time',
      withLegend: true
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart
            {...chartProps}
            series={[
              { name: 'viewer_count', label: 'Viewers', color: 'blue.6' },
              { name: 'message_count', label: 'Messages', color: 'green.6' },
              { name: 'sub_count', label: 'Subs', color: 'purple.6' },
              { name: 'cheer_count', label: 'Bits', color: 'orange.6' },
              { name: 'follow_count', label: 'Follows', color: 'pink.6' }
            ]}
          />
        );
      case 'area':
        return (
          <AreaChart
            {...chartProps}
            series={[
              { name: 'viewer_count', label: 'Viewers', color: 'blue.6' },
              { name: 'message_count', label: 'Messages', color: 'green.6' },
              { name: 'sub_count', label: 'Subs', color: 'purple.6' },
              { name: 'cheer_count', label: 'Bits', color: 'orange.6' },
              { name: 'follow_count', label: 'Follows', color: 'pink.6' }
            ]}
          />
        );
      case 'composed':
      default:
        return (
          <CompositeChart
            {...chartProps}
            series={[
              { name: 'viewer_count', label: 'Viewers', color: 'blue.6', type: 'line' },
              { name: 'message_count', label: 'Messages', color: 'green.6', type: 'area' },
              { name: 'sub_count', label: 'Subs', color: 'purple.6', type: 'bar', yAxisId: 'right' },
              { name: 'cheer_count', label: 'Bits', color: 'orange.6', type: 'bar', yAxisId: 'right' },
              { name: 'follow_count', label: 'Follows', color: 'pink.6', type: 'bar', yAxisId: 'right' }
            ]}
          />
        );
    }
  };

  const renderSummaryCards = () => {
    if (!summary) return null;

    return (
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconUsers size={24} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="xs" c="dimmed">Average Viewers</Text>
                <Text size="lg" fw={700}>{summary.avg_viewers.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconTrendingUp size={24} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="xs" c="dimmed">Peak Viewers</Text>
                <Text size="lg" fw={700}>{summary.peak_viewers.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconMessage size={24} color="var(--mantine-color-purple-6)" />
              <div>
                <Text size="xs" c="dimmed">Total Messages</Text>
                <Text size="lg" fw={700}>{summary.total_messages.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <Card withBorder>
            <Group>
              <IconBolt size={24} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="xs" c="dimmed">Total Bits</Text>
                <Text size="lg" fw={700}>{summary.total_bits.toLocaleString()}</Text>
              </div>
            </Group>
          </Card>
        </Grid.Col>
      </Grid>
    );
  };

  if (!premium.isPremium && !props.admin) {
    return (
      <Alert icon={<IconInfoCircle size={16} />} title="Premium Required" color="yellow">
        Stream analytics are only available for HeheChat Pro subscribers.
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      <Fieldset legend="Stream Analytics" variant="filled">
        <Stack gap="md">
          {/* Controls */}
          <Group>
            <Select
              label="Time Range"
              value={timeRange}
              onChange={(value) => setTimeRange(value || 'last24h')}
              data={TIME_RANGE_OPTIONS}
              w={150}
            />
            
            {timeRange === 'custom' && (
              <>
                <TextInput
                  label="Start Date"
                  placeholder="YYYY-MM-DD"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(event) => {
                    const dateStr = event.currentTarget.value;
                    setStartDate(dateStr ? new Date(dateStr) : null);
                  }}
                />
                <TextInput
                  label="End Date"
                  placeholder="YYYY-MM-DD"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(event) => {
                    const dateStr = event.currentTarget.value;
                    setEndDate(dateStr ? new Date(dateStr) : null);
                  }}
                />
              </>
            )}
            
            <Select
              label="Interval"
              value={interval}
              onChange={(value) => setInterval(value || '1h')}
              data={INTERVAL_OPTIONS}
              w={120}
            />
            
            <Select
              label="Chart Type"
              value={chartType}
              onChange={(value) => setChartType(value || 'composed')}
              data={CHART_TYPE_OPTIONS}
              w={150}
            />
            
            <Button onClick={fetchAnalytics} loading={loading} mt="auto">
              Refresh
            </Button>
          </Group>

          {/* Error Display */}
          {error && (
            <Alert icon={<IconInfoCircle size={16} />} title="Error" color="red">
              {error}
            </Alert>
          )}

          {/* Summary Cards */}
          {renderSummaryCards()}

          {/* Chart */}
          <Card withBorder pos="relative">
            <LoadingOverlay visible={loading} />
            {renderChart()}
          </Card>
        </Stack>
      </Fieldset>
    </Stack>
  );
}
