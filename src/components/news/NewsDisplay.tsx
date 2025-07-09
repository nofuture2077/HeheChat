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
      setNewsMessages(data.messages);
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
  const visibleMessages = newsMessages.filter(message => 
    !dismissedMessages.has(message.id) && 
    message.is_active && 
    !isExpired(message.active_until)
  );

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
