import { useState, type ReactElement } from 'react';
import { Button, TextInput, Group, Modal, Text, Fieldset } from '@mantine/core';
import { GradientSegmentedControl } from '../../GradientSegmentedControl/GradientSegmentedControl';
import { formatDuration } from '../../../commons/helper';

const durations = [60, 600, 3600, 86400, 604800];
export function TimeoutView(props: {
  userId: string;
  userName: string;
  channelId: string;
  channelName: string;
  timeoutUser: (channelId: string, userId: string, duration: number, reason: string) => void;
  close: () => void;
}): ReactElement {
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<number>(600);

  return (
    <Modal zIndex={400} opened onClose={props.close} withCloseButton={false}>
      <Fieldset legend={['Timeout', props.userName, 'in', props.channelName].join(' ')}>
        <Group justify="center">
          <GradientSegmentedControl
            data={durations.map((x) => ({
              label: formatDuration(x * 1000),
              value: (x * 1000).toString(),
            }))}
            value={(duration * 1000).toString()}
            setValue={(v: string) => {
              setDuration(parseInt(v, 10) / 1000);
            }}
          />
        </Group>
        <TextInput
          label="Reason"
          placeholder="Optional: Why?"
          value={reason}
          onChange={(ev) => setReason(ev.target.value)}
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={props.close}>Cancel</Button>
          <Button
            color="primary"
            onClick={() => {
              props.timeoutUser(props.channelId, props.userId, duration, reason);
              props.close();
            }}
          >
            Timeout
          </Button>
        </Group>
      </Fieldset>
    </Modal>
  );
}

export function BanView(props: {
  userId: string;
  userName: string;
  channelId: string;
  channelName: string;
  banUser: (channelId: string, userId: string, reason: string) => void;
  close: () => void;
}): ReactElement {
  const [reason, setReason] = useState('');

  return (
    <Modal zIndex={400} opened onClose={props.close} withCloseButton={false}>
      <Fieldset legend={['Ban', props.userName, 'in', props.channelName].join(' ')}>
        <TextInput
          label="Reason"
          placeholder="Optional: Why?"
          value={reason}
          onChange={(ev) => setReason(ev.target.value)}
        />
        <Group justify="flex-end" mt="md">
          <Button onClick={props.close}>Cancel</Button>
          <Button
            color="primary"
            onClick={() => {
              props.banUser(props.channelId, props.userId, reason);
              props.close();
            }}
          >
            Ban
          </Button>
        </Group>
      </Fieldset>
    </Modal>
  );
}

export function DeleteMessageView(props: {
  messageId: string;
  messageText: string;
  userName: string;
  channelId: string;
  channelName: string;
  deleteMessage: (channelId: string, messageId: string) => void;
  close: () => void;
}): ReactElement {
  return (
    <Modal zIndex={400} opened onClose={props.close} withCloseButton={false}>
      <Fieldset legend={['Delete message from', props.userName, 'in', props.channelName].join(' ')}>
        <Text size="sm" c="dimmed" mb="md">
          &quot;{props.messageText}&quot;
        </Text>
        <Group justify="flex-end" mt="md">
          <Button onClick={props.close}>Cancel</Button>
          <Button
            color="red"
            onClick={() => {
              props.deleteMessage(props.channelId, props.messageId);
              props.close();
            }}
          >
            Delete
          </Button>
        </Group>
      </Fieldset>
    </Modal>
  );
}
