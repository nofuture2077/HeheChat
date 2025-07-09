import { useState, useEffect } from 'react';
import { Notification, Stack, Text, Collapse, ActionIcon, Group } from '@mantine/core';
import { IconNews, IconChevronDown, IconChevronUp, IconX } from '@tabler/icons-react';
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
    // If is_active is undefined, assume it's active (public endpoint only returns active messages)
    const isActive = message.is_active !== false;
    const isNotExpired = !isExpired(message.active_until);
    
    return !isDismissed && isActive && isNotExpired;
  });

  if (loading || visibleMessages.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <Stack gap="xs">
        {visibleMessages.map((message) => {
          const isCollapsed = collapsedMessages.has(message.id);
          const isLongText = message.text.length > 200;
          
          return (
            <Notification
              key={message.id}
              icon={<IconNews size="1rem" />}
              title={
                <Group justify="space-between" align="center" gap="xs" style={{ width: '100%' }}>
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
                    <ActionIcon
                      variant="subtle"
                      size="sm"
                      onClick={() => dismissMessage(message.id)}
                    >
                      <IconX size="0.8rem" />
                    </ActionIcon>
                  </Group>
                </Group>
              }
              color="blue"
              withCloseButton={false}
              withBorder
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
            </Notification>
          );
        })}
      </Stack>
    </div>
  );
}
