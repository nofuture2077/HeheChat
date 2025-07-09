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
    <div className={className} style={{ padding: '0 16px' }}>
      <Stack gap="sm">
        {visibleMessages.map((message) => {
          const isCollapsed = collapsedMessages.has(message.id);
          const isLongText = message.text.length > 200;
          
          return (
            <div
              key={message.id}
              style={{
                maxWidth: '600px',
                margin: '0 auto',
                width: '100%'
              }}
            >
              <Notification
                icon={<IconNews size="1.2rem" style={{ color: 'white' }} />}
                title={
                  <Group justify="space-between" align="flex-start" gap="md" style={{ width: '100%' }}>
                    <Text fw={600} size="sm" style={{ flex: 1, lineHeight: 1.3, color: 'white' }}>
                      {message.headline}
                    </Text>
                    <Group gap="sm" style={{ flexShrink: 0 }}>
                      {isLongText && (
                        <ActionIcon
                          variant="filled"
                          size="lg"
                          onClick={() => toggleCollapse(message.id)}
                          style={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            minWidth: '44px',
                            minHeight: '44px'
                          }}
                        >
                          {isCollapsed ? <IconChevronDown size="1.1rem" /> : <IconChevronUp size="1.1rem" />}
                        </ActionIcon>
                      )}
                      <ActionIcon
                        variant="filled"
                        size="lg"
                        onClick={() => dismissMessage(message.id)}
                        style={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          minWidth: '44px',
                          minHeight: '44px'
                        }}
                      >
                        <IconX size="1.1rem" />
                      </ActionIcon>
                    </Group>
                  </Group>
                }
                withCloseButton={false}
                withBorder={false}
                radius="xl"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                  border: 'none',
                  color: 'white',
                  padding: '16px 20px'
                }}
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    padding: '16px 20px'
                  },
                  icon: {
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    color: 'white',
                    borderRadius: '12px'
                  },
                  title: {
                    color: 'white',
                    marginBottom: '8px'
                  },
                  description: {
                    color: 'rgba(255, 255, 255, 0.95)'
                  },
                  body: {
                    padding: '0'
                  }
                }}
              >
                <Collapse in={!isCollapsed || !isLongText}>
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4, color: 'rgba(255, 255, 255, 0.95)' }}>
                    {message.text}
                  </Text>
                  <Text size="xs" mt="sm" style={{ opacity: 0.8, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Posted {formatDate(message.created_at)}
                  </Text>
                </Collapse>
                
                {isCollapsed && isLongText && (
                  <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.4, color: 'rgba(255, 255, 255, 0.8)' }}>
                    {message.text.substring(0, 200)}...
                  </Text>
                )}
              </Notification>
            </div>
          );
        })}
      </Stack>
    </div>
  );
}
