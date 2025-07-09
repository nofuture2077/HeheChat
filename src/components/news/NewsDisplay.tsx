import { useState, useEffect } from 'react';
import { Alert, Stack, Text, CloseButton, Collapse, ActionIcon, Group } from '@mantine/core';
import { IconNews, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { NewsApiClient, NewsMessage } from '../../api/news';

interface NewsDisplayProps {
  className?: string;
}

export function NewsDisplay({ className }: NewsDisplayProps) {
  const [newsMessages, setNewsMessages] = useState<NewsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [dismissedMessages, setDismissedMessages] = useState<Set<number>>(new Set());
  const [collapsedMessages, setCollapsedMessages] = useState<Set<number>>(new Set());

  const fetchActiveNews = async () => {
    setLoading(true);
    
    try {
      const data = await NewsApiClient.getActiveNews();
      console.log('Fetched news data:', data);
      setNewsMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching active news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveNews();
    
    // Refresh news every 5 minutes
    const interval = setInterval(fetchActiveNews, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Load dismissed messages from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('hehe-dismissed-news');
    if (dismissed) {
      try {
        const dismissedIds = JSON.parse(dismissed);
        setDismissedMessages(new Set(dismissedIds));
      } catch (error) {
        console.error('Error parsing dismissed news from localStorage:', error);
      }
    }
  }, []);

  const dismissMessage = (messageId: number) => {
    const newDismissed = new Set(dismissedMessages);
    newDismissed.add(messageId);
    setDismissedMessages(newDismissed);
    
    // Save to localStorage
    localStorage.setItem('hehe-dismissed-news', JSON.stringify(Array.from(newDismissed)));
  };

  const toggleCollapse = (messageId: number) => {
    const newCollapsed = new Set(collapsedMessages);
    if (newCollapsed.has(messageId)) {
      newCollapsed.delete(messageId);
    } else {
      newCollapsed.add(messageId);
    }
    setCollapsedMessages(newCollapsed);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isExpired = (activeUntil: string) => {
    return new Date(activeUntil) < new Date();
  };

  // Filter out dismissed messages and expired/inactive messages
  const visibleMessages = newsMessages.filter(message => {
    const isDismissed = dismissedMessages.has(message.id);
    const isActive = message.is_active;
    const isNotExpired = !isExpired(message.active_until);
    
    console.log(`Message ${message.id}: dismissed=${isDismissed}, active=${isActive}, notExpired=${isNotExpired}`);
    
    return !isDismissed && isActive && isNotExpired;
  });

  console.log(`Total messages: ${newsMessages.length}, Visible messages: ${visibleMessages.length}`);

  // Show debug info if there are messages but none are visible
  if (!loading && newsMessages.length > 0 && visibleMessages.length === 0) {
    return (
      <div className={className}>
        <Alert color="yellow" variant="light">
          <Text size="sm">
            Debug: {newsMessages.length} news messages found but none are visible. Check console for details.
          </Text>
        </Alert>
      </div>
    );
  }

  // Always show something during development to verify component is rendering
  if (loading) {
    return (
      <div className={className}>
        <Alert color="blue" variant="light">
          <Text size="sm">Loading news...</Text>
        </Alert>
      </div>
    );
  }

  if (visibleMessages.length === 0) {
    return (
      <div className={className}>
        <Alert color="gray" variant="light">
          <Text size="sm">No active news messages</Text>
        </Alert>
      </div>
    );
  }

  return (
    <div className={className}>
      <Stack gap="xs">
        {visibleMessages.map((message) => {
          const isCollapsed = collapsedMessages.has(message.id);
          const isLongText = message.text.length > 200;
          
          return (
            <Alert
              key={message.id}
              icon={<IconNews size="1rem" />}
              title={
                <Group justify="space-between" align="center" gap="xs">
                  <Text fw={500} size="sm">
                    {message.headline}
                  </Text>
                  <Group gap="xs">
                    {isLongText && (
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => toggleCollapse(message.id)}
                      >
                        {isCollapsed ? <IconChevronDown size="0.8rem" /> : <IconChevronUp size="0.8rem" />}
                      </ActionIcon>
                    )}
                    <CloseButton
                      size="sm"
                      onClick={() => dismissMessage(message.id)}
                    />
                  </Group>
                </Group>
              }
              color="blue"
              variant="light"
              styles={{
                title: { width: '100%' },
                body: { paddingTop: '0.5rem' }
              }}
            >
              <Collapse in={!isCollapsed || !isLongText}>
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </Text>
                <Text size="xs" c="dimmed" mt="xs">
                  Posted: {formatDate(message.created_at)} • Expires: {formatDate(message.active_until)}
                </Text>
              </Collapse>
              
              {isCollapsed && isLongText && (
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                  {message.text.substring(0, 200)}...
                </Text>
              )}
            </Alert>
          );
        })}
      </Stack>
    </div>
  );
}
