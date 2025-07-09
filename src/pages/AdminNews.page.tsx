import { 
  Container, 
  Title, 
  Text, 
  Button, 
  Alert, 
  Stack, 
  Card, 
  Group, 
  LoadingOverlay, 
  Badge,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Table,
  Tooltip,
  Menu
} from '@mantine/core';
import { 
  IconNews, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconEye,
  IconEyeOff,
  IconDots,
  IconAlertCircle,
  IconCheck,
  IconClock
} from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { NewsApiClient, NewsMessage, CreateNewsRequest, UpdateNewsRequest } from '../api/news';

interface NewsFormData {
  headline: string;
  text: string;
  active_hours: number;
}

const DEFAULT_FORM_DATA: NewsFormData = {
  headline: '',
  text: '',
  active_hours: 168 // 1 week default
};

export function AdminNewsPage() {
  const [newsMessages, setNewsMessages] = useState<NewsMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpened, { open: openCreateModal, close: closeCreateModal }] = useDisclosure(false);
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [formData, setFormData] = useState<NewsFormData>(DEFAULT_FORM_DATA);
  const [editingMessage, setEditingMessage] = useState<NewsMessage | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchNews = async () => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!adminToken) {
      setError('No admin token found');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await NewsApiClient.getAllNews(adminToken);
      setNewsMessages(data.messages);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch news messages');
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleCreateNews = async () => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!adminToken) {
      notifications.show({
        title: 'Error',
        message: 'No admin token found',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
      return;
    }

    if (!formData.headline.trim() || !formData.text.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Headline and text are required',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const createData: CreateNewsRequest = {
        headline: formData.headline.trim(),
        text: formData.text.trim(),
        active_hours: formData.active_hours
      };

      await NewsApiClient.createNews(adminToken, createData);
      
      notifications.show({
        title: 'Success',
        message: 'News message created successfully',
        color: 'green',
        icon: <IconCheck size="1rem" />
      });

      closeCreateModal();
      setFormData(DEFAULT_FORM_DATA);
      fetchNews();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to create news message',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditNews = async () => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!adminToken || !editingMessage) {
      notifications.show({
        title: 'Error',
        message: 'No admin token found or no message selected',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
      return;
    }

    if (!formData.headline.trim() || !formData.text.trim()) {
      notifications.show({
        title: 'Validation Error',
        message: 'Headline and text are required',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const updateData: UpdateNewsRequest = {
        headline: formData.headline.trim(),
        text: formData.text.trim(),
        active_hours: formData.active_hours
      };

      await NewsApiClient.updateNews(adminToken, editingMessage.id, updateData);
      
      notifications.show({
        title: 'Success',
        message: 'News message updated successfully',
        color: 'green',
        icon: <IconCheck size="1rem" />
      });

      closeEditModal();
      setFormData(DEFAULT_FORM_DATA);
      setEditingMessage(null);
      fetchNews();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update news message',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNews = async (message: NewsMessage) => {
    const adminToken = localStorage.getItem('hehe-token_state') || '';
    if (!adminToken) {
      notifications.show({
        title: 'Error',
        message: 'No admin token found',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete the news message "${message.headline}"?`)) {
      return;
    }
    
    try {
      await NewsApiClient.deleteNews(adminToken, message.id);
      
      notifications.show({
        title: 'Success',
        message: 'News message deleted successfully',
        color: 'green',
        icon: <IconCheck size="1rem" />
      });

      fetchNews();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to delete news message',
        color: 'red',
        icon: <IconAlertCircle size="1rem" />
      });
    }
  };

  const openEditModalWithMessage = (message: NewsMessage) => {
    setEditingMessage(message);
    setFormData({
      headline: message.headline,
      text: message.text,
      active_hours: Math.round((new Date(message.active_until).getTime() - new Date(message.created_at).getTime()) / (1000 * 60 * 60))
    });
    openEditModal();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (activeUntil: string) => {
    return new Date(activeUntil) < new Date();
  };

  const getStatusBadge = (message: NewsMessage) => {
    if (!message.is_active) {
      return <Badge color="red" variant="light" leftSection={<IconEyeOff size="0.8rem" />}>Deleted</Badge>;
    }
    
    if (isExpired(message.active_until)) {
      return <Badge color="orange" variant="light" leftSection={<IconClock size="0.8rem" />}>Expired</Badge>;
    }
    
    return <Badge color="green" variant="light" leftSection={<IconEye size="0.8rem" />}>Active</Badge>;
  };

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>
              <Group gap="xs">
                <IconNews size="1.5rem" />
                News Management
              </Group>
            </Title>
            <Text c="dimmed" size="sm">
              Create and manage news messages for HeheChat users
            </Text>
          </div>
          
          <Button 
            leftSection={<IconPlus size="1rem" />}
            onClick={openCreateModal}
          >
            Create News
          </Button>
        </Group>

        {error && (
          <Alert 
            icon={<IconAlertCircle size="1rem" />} 
            title="Error" 
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        <Card withBorder>
          <LoadingOverlay visible={loading} />
          
          {newsMessages.length === 0 && !loading ? (
            <Text ta="center" c="dimmed" py="xl">
              No news messages found. Create your first news message to get started.
            </Text>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Headline</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Expires</Table.Th>
                  <Table.Th>Created By</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {newsMessages.map((message) => (
                  <Table.Tr key={message.id}>
                    <Table.Td>
                      {getStatusBadge(message)}
                    </Table.Td>
                    <Table.Td>
                      <div>
                        <Text fw={500}>{message.headline}</Text>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {message.text}
                        </Text>
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(message.created_at)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatDate(message.active_until)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{message.created_by}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDots size="1rem" />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size="1rem" />}
                            onClick={() => openEditModalWithMessage(message)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={() => handleDeleteNews(message)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>

        {/* Create News Modal */}
        <Modal
          opened={createModalOpened}
          onClose={closeCreateModal}
          title="Create News Message"
          size="lg"
        >
          <Stack gap="md">
            <TextInput
              label="Headline"
              placeholder="Enter news headline"
              value={formData.headline}
              onChange={(event) => setFormData({ ...formData, headline: event.currentTarget.value })}
              maxLength={255}
              required
            />
            
            <Textarea
              label="Message Content"
              placeholder="Enter news message content"
              value={formData.text}
              onChange={(event) => setFormData({ ...formData, text: event.currentTarget.value })}
              minRows={4}
              maxRows={8}
              maxLength={10000}
              required
            />
            
            <NumberInput
              label="Active Duration (hours)"
              placeholder="168"
              value={formData.active_hours}
              onChange={(value) => setFormData({ ...formData, active_hours: typeof value === 'number' ? value : 168 })}
              min={1}
              max={8760} // 1 year
              required
            />
            
            <Group justify="flex-end" gap="sm">
              <Button variant="light" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateNews}
                loading={submitting}
                leftSection={<IconPlus size="1rem" />}
              >
                Create News
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Edit News Modal */}
        <Modal
          opened={editModalOpened}
          onClose={closeEditModal}
          title="Edit News Message"
          size="lg"
        >
          <Stack gap="md">
            <TextInput
              label="Headline"
              placeholder="Enter news headline"
              value={formData.headline}
              onChange={(event) => setFormData({ ...formData, headline: event.currentTarget.value })}
              maxLength={255}
              required
            />
            
            <Textarea
              label="Message Content"
              placeholder="Enter news message content"
              value={formData.text}
              onChange={(event) => setFormData({ ...formData, text: event.currentTarget.value })}
              minRows={4}
              maxRows={8}
              maxLength={10000}
              required
            />
            
            <NumberInput
              label="Active Duration (hours)"
              placeholder="168"
              value={formData.active_hours}
              onChange={(value) => setFormData({ ...formData, active_hours: typeof value === 'number' ? value : 168 })}
              min={1}
              max={8760} // 1 year
              required
            />
            
            <Group justify="flex-end" gap="sm">
              <Button variant="light" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditNews}
                loading={submitting}
                leftSection={<IconEdit size="1rem" />}
              >
                Update News
              </Button>
            </Group>
          </Stack>
        </Modal>
      </Stack>
    </Container>
  );
}
