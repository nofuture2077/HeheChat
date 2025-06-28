import { Container, Title, Space } from '@mantine/core';
import { StreamAnalyticsChart } from '../components/analytics/StreamAnalyticsChart';

export function AnalyticsPage() {
  return (
    <Container size="xl" py="md">
      <Title order={1} mb="lg">Stream Analytics</Title>
      <StreamAnalyticsChart admin={false} />
    </Container>
  );
}
