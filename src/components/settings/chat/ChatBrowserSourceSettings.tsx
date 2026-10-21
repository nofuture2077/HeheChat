import {
  Stack,
  Text,
  Switch,
  Fieldset,
  ActionIcon,
  Group,
  TextInput,
  NumberInput,
  Select,
  ColorInput,
  TagsInput,
  Box,
  Flex,
  Modal,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure, useElementSize, useMediaQuery } from '@mantine/hooks';
import { useContext, useState, useEffect } from 'react';
import { IconCopy, IconArrowsMaximize } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { ConfigContext } from '@/ApplicationContext';

// above the settings drawer (zIndex 300); dropdowns inside the modal must sit above it
const PREVIEW_MODAL_Z_INDEX = 400;
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;
const MIN_BOX_SIZE = 100;

interface ChatBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 600x400 in the lower left of a 1080p scene
const DEFAULT_CHAT_BOX: ChatBox = { x: 40, y: CANVAS_HEIGHT - 440, width: 600, height: 400 };

// Embeds the real chat browser source as a box inside a scaled 1920x1080 scene, like it would sit
// in OBS. The box can be moved (drag) and resized (corner handle); it picks up config changes via
// the auto-saved profile and adds demo messages in preview mode.
function ChatPreviewFrame({
  src,
  box,
  onBoxChange,
  onExpand,
}: {
  src: string;
  box: ChatBox;
  onBoxChange: (box: ChatBox) => void;
  onExpand?: () => void;
}) {
  const { ref, width } = useElementSize();
  const scale = width / CANVAS_WIDTH || 1;

  const startDrag = (mode: 'move' | 'resize') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const start = box;
    const onMove = (ev: PointerEvent) => {
      const dx = Math.round((ev.clientX - startX) / scale);
      const dy = Math.round((ev.clientY - startY) / scale);
      onBoxChange(
        mode === 'move'
          ? {
              ...start,
              x: Math.min(Math.max(start.x + dx, 0), CANVAS_WIDTH - start.width),
              y: Math.min(Math.max(start.y + dy, 0), CANVAS_HEIGHT - start.height),
            }
          : {
              ...start,
              width: Math.min(Math.max(start.width + dx, MIN_BOX_SIZE), CANVAS_WIDTH - start.x),
              height: Math.min(Math.max(start.height + dy, MIN_BOX_SIZE), CANVAS_HEIGHT - start.y),
            }
      );
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <Box
      ref={ref}
      pos="relative"
      style={{
        width: '100%',
        aspectRatio: '16 / 9',
        overflow: 'hidden',
        borderRadius: 'var(--mantine-radius-md)',
        border: '1px solid var(--mantine-color-dark-4)',
        backgroundColor: '#3a3a3a',
        backgroundImage: 'repeating-conic-gradient(#444 0% 25%, #3a3a3a 0% 50%)',
        backgroundSize: '32px 32px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: box.x,
            top: box.y,
            width: box.width,
            height: box.height,
            outline: `${1 / scale}px dashed rgba(255,255,255,0.5)`,
          }}
        >
          <iframe
            src={src}
            title="Chat browser source preview"
            style={{
              width: '100%',
              height: '100%',
              border: 0,
              background: 'transparent',
              colorScheme: 'normal',
              pointerEvents: 'none',
            }}
          />
          {/* drag surface above the iframe; touch-action none so dragging doesn't scroll */}
          <div
            onPointerDown={startDrag('move')}
            style={{ position: 'absolute', inset: 0, cursor: 'move', touchAction: 'none' }}
          />
          <div
            onPointerDown={startDrag('resize')}
            aria-label="Resize chat box"
            style={{
              position: 'absolute',
              right: 0,
              bottom: 0,
              width: 16 / scale,
              height: 16 / scale,
              cursor: 'nwse-resize',
              touchAction: 'none',
              background: 'rgba(255,255,255,0.7)',
            }}
          />
        </div>
      </div>
      {onExpand && (
        <ActionIcon
          pos="absolute"
          top={8}
          right={8}
          variant="filled"
          color="dark"
          onClick={onExpand}
          aria-label="Expand preview"
        >
          <IconArrowsMaximize size={16} />
        </ActionIcon>
      )}
    </Box>
  );
}

export function ChatBrowserSourceSettings() {
  const [sink, setSink] = useState<string | undefined>(undefined);

  useEffect(() => {
    const state = localStorage.getItem('hehe-token_state') || '';
    fetch(`${import.meta.env.VITE_BACKEND_URL}/sink/get?state=${state}`)
      .then((res) => res.json())
      .then((data) => setSink(data.sink));
  }, []);

  const chatUrl = sink
    ? `${new URL('chat.html', import.meta.env.VITE_SINK_URL).href}#token=${encodeURIComponent(sink)}`
    : '';
  const previewUrl = `${chatUrl}&preview=true`;
  const [previewOpened, { open: openPreview, close: closePreview }] = useDisclosure(false);
  const isDesktop = useMediaQuery('(min-width: 62em)');
  // ponytail: preview-only placement, not persisted - it just mirrors how the source sits in OBS
  const [chatBox, setChatBox] = useState<ChatBox>(DEFAULT_CHAT_BOX);
  const frameProps = { src: previewUrl, box: chatBox, onBoxChange: setChatBox };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(chatUrl);
      notifications.show({
        title: 'Copied!',
        message: 'Chat browser source URL copied to clipboard',
        color: 'green',
      });
    } catch {
      notifications.show({ title: 'Error', message: 'Failed to copy to clipboard', color: 'red' });
    }
  };

  return (
    <Stack mt={30} mb={30} gap={30}>
      <Fieldset legend="Chat Browser Source" variant="filled">
        <Stack gap="md">
          <Text fs="italic" size="14px">
            Add this URL as a browser source in OBS to display chat as an overlay. All settings
            below are saved to your profile and take effect immediately in the browser source.
          </Text>

          {sink ? (
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Browser Source URL
              </Text>
              <Group gap="xs" align="flex-start">
                <TextInput
                  value={chatUrl}
                  readOnly
                  style={{ flex: 1, fontFamily: 'monospace' }}
                  styles={{ input: { fontSize: 11 } }}
                />
                <ActionIcon
                  variant="light"
                  color="blue"
                  size="lg"
                  mt={1}
                  onClick={copyUrl}
                  title="Copy URL"
                >
                  <IconCopy size={16} />
                </ActionIcon>
              </Group>
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              Loading token…
            </Text>
          )}
        </Stack>
      </Fieldset>

      {/* only one chat iframe (and its WebSocket) at a time - hidden while the modal is open */}
      {sink && !previewOpened && (
        <Fieldset
          legend="Chat Preview"
          variant="filled"
          style={{ position: 'sticky', top: 0, zIndex: 2 }}
        >
          <Stack gap="xs">
            <ChatPreviewFrame {...frameProps} onExpand={openPreview} />
            <Text size="xs" c="dimmed">
              Live preview with demo messages in a 1920x1080 scene - drag the chat box to move it,
              drag its corner to resize. Chat box: {chatBox.width}x{chatBox.height} at {chatBox.x},
              {chatBox.y}.
            </Text>
          </Stack>
        </Fieldset>
      )}

      <ChatBsOptions />

      <Modal
        opened={previewOpened}
        onClose={closePreview}
        title="Chat Preview"
        fullScreen
        zIndex={PREVIEW_MODAL_Z_INDEX}
      >
        {isDesktop ? (
          <Flex gap="md" align="flex-start">
            <Box style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
              <Box style={{ width: 'min(100%, calc((100dvh - 100px) * 16 / 9))' }}>
                <ChatPreviewFrame {...frameProps} />
              </Box>
            </Box>
            <ScrollArea.Autosize mah="calc(100dvh - 100px)" w={380} style={{ flexShrink: 0 }}>
              <Stack gap={30} pr="sm">
                <ChatBsOptions />
              </Stack>
            </ScrollArea.Autosize>
          </Flex>
        ) : (
          <Stack gap="md">
            <Box
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 2,
                background: 'var(--mantine-color-body)',
                paddingBottom: 'var(--mantine-spacing-xs)',
              }}
            >
              <ChatPreviewFrame {...frameProps} />
            </Box>
            <Stack gap={30}>
              <ChatBsOptions />
            </Stack>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

function ChatBsOptions() {
  const config = useContext(ConfigContext);

  return (
    <>
      <Fieldset legend="Appearance" variant="filled">
        <Stack gap="md">
          <TextInput
            label="Font Family"
            description='CSS font-family value, e.g. "Arial" or "Roboto, sans-serif". Leave empty for default.'
            placeholder="default"
            value={config.chatBsFontFamily ?? ''}
            onChange={(e) => config.setChatBsFontFamily(e.currentTarget.value)}
          />
          <NumberInput
            label="Font Size (px)"
            value={config.chatBsFontSize ?? 14}
            onChange={(val) => config.setChatBsFontSize(Number(val))}
            min={8}
            max={48}
          />
          <ColorInput
            popoverProps={{ zIndex: PREVIEW_MODAL_Z_INDEX + 1 }}
            label="Text Color"
            description="Leave empty to use the default chat colors"
            value={config.chatBsTextColor ?? ''}
            onChange={(val) => config.setChatBsTextColor(val)}
            placeholder="inherit"
          />
          <Switch
            label="Transparent Background"
            description="No background — ideal for OBS overlays"
            checked={config.chatBsTransparentBg ?? true}
            onChange={(e) => config.setChatBsTransparentBg(e.currentTarget.checked)}
            size="lg"
          />
          <Switch
            label="Text Shadow"
            description="Adds a drop shadow behind text for readability on bright backgrounds"
            checked={config.chatBsTextShadow ?? true}
            onChange={(e) => config.setChatBsTextShadow(e.currentTarget.checked)}
            size="lg"
          />
          <Select
            comboboxProps={{ zIndex: PREVIEW_MODAL_Z_INDEX + 1 }}
            label="Message Background"
            description="Adds a semi-transparent box behind each message"
            value={config.chatBsMsgBackground ?? 'none'}
            onChange={(val) =>
              config.setChatBsMsgBackground((val ?? 'none') as 'none' | 'dark' | 'light')
            }
            data={[
              { value: 'none', label: 'None' },
              { value: 'dark', label: 'Dark (semi-transparent black)' },
              { value: 'light', label: 'Light (semi-transparent white)' },
            ]}
          />
        </Stack>
      </Fieldset>

      <Fieldset legend="Layout" variant="filled">
        <Stack gap="md">
          <TextInput
            label="Width"
            placeholder="100%"
            value={config.chatBsWidth ?? '100%'}
            onChange={(e) => config.setChatBsWidth(e.currentTarget.value)}
            description="CSS value, e.g. 400px or 100%"
          />
          <TextInput
            label="Height"
            placeholder="100%"
            value={config.chatBsHeight ?? '100%'}
            onChange={(e) => config.setChatBsHeight(e.currentTarget.value)}
            description="CSS value, e.g. 600px or 100%"
          />
          <NumberInput
            label="Message Spacing (px)"
            description="Vertical gap between messages"
            value={config.chatBsMsgSpacing ?? 2}
            onChange={(val) => config.setChatBsMsgSpacing(Number(val))}
            min={0}
            max={40}
          />
          <NumberInput
            label="Padding (px)"
            value={config.chatBsPadding ?? 4}
            onChange={(val) => config.setChatBsPadding(Number(val))}
            min={0}
            max={80}
          />
        </Stack>
      </Fieldset>

      <Fieldset legend="Messages" variant="filled">
        <Stack gap="md">
          <NumberInput
            label="Max Visible Messages"
            value={config.chatBsMaxMessages ?? 5}
            onChange={(val) => config.setChatBsMaxMessages(Number(val))}
            min={1}
            max={100}
          />
          <NumberInput
            label="Message Lifetime (seconds)"
            description="Messages disappear after this many seconds. Set to 0 to keep forever."
            value={config.chatBsMessageLifetime ?? 15}
            onChange={(val) => config.setChatBsMessageLifetime(Number(val))}
            min={0}
            max={300}
          />
          <Switch
            label="Show System Messages"
            description="Raids, follows, subs, etc."
            checked={config.chatBsShowSystem ?? false}
            onChange={(e) => config.setChatBsShowSystem(e.currentTarget.checked)}
            size="lg"
          />
          <TagsInput
            label="Ignored Usernames"
            description="Messages from these users will be hidden. Press Enter to add."
            placeholder="username"
            value={config.chatBsIgnoredUsers ?? []}
            onChange={(val) => config.setChatBsIgnoredUsers(val)}
          />
          <Switch
            label="Show Username"
            checked={config.chatBsShowUsername ?? true}
            onChange={(e) => config.setChatBsShowUsername(e.currentTarget.checked)}
            size="lg"
          />
        </Stack>
      </Fieldset>

      <Fieldset legend="Animations" variant="filled">
        <Stack gap="md">
          <Select
            comboboxProps={{ zIndex: PREVIEW_MODAL_Z_INDEX + 1 }}
            label="Animate In"
            value={config.chatBsAnimateIn ?? 'slide'}
            onChange={(val) =>
              config.setChatBsAnimateIn((val ?? 'slide') as 'slide' | 'fade' | 'none')
            }
            data={[
              { value: 'slide', label: 'Slide up' },
              { value: 'fade', label: 'Fade in' },
              { value: 'none', label: 'None' },
            ]}
          />
          <Select
            comboboxProps={{ zIndex: PREVIEW_MODAL_Z_INDEX + 1 }}
            label="Animate Out"
            value={config.chatBsAnimateOut ?? 'fade'}
            onChange={(val) => config.setChatBsAnimateOut((val ?? 'fade') as 'fade' | 'none')}
            data={[
              { value: 'fade', label: 'Fade out' },
              { value: 'none', label: 'None' },
            ]}
          />
        </Stack>
      </Fieldset>

      <Fieldset legend="Badges" variant="filled">
        <Stack gap="md">
          <Switch
            label="Important Badges"
            description="Moderator, broadcaster, VIP, staff, partner"
            checked={config.chatBsShowImportantBadges ?? true}
            onChange={(e) => config.setChatBsShowImportantBadges(e.currentTarget.checked)}
            size="lg"
          />
          <Switch
            label="Subscriber Badges"
            description="Subscriber and founder badges"
            checked={config.chatBsShowSubBadges ?? true}
            onChange={(e) => config.setChatBsShowSubBadges(e.currentTarget.checked)}
            size="lg"
          />
          <Switch
            label="Other Badges"
            description="Any badge not in the above categories"
            checked={config.chatBsShowOtherBadges ?? false}
            onChange={(e) => config.setChatBsShowOtherBadges(e.currentTarget.checked)}
            size="lg"
          />
          <Switch
            label="7TV Badges"
            description="7TV cosmetic badges"
            checked={config.chatBsShow7TVBadges ?? true}
            onChange={(e) => config.setChatBsShow7TVBadges(e.currentTarget.checked)}
            size="lg"
          />
          <Switch
            label="HeheChat Badges"
            description="HeheChat admin and pro badges"
            checked={config.chatBsShowHeheBadges ?? true}
            onChange={(e) => config.setChatBsShowHeheBadges(e.currentTarget.checked)}
            size="lg"
          />
          <NumberInput
            label="Max Badges"
            value={config.chatBsMaxBadges ?? 3}
            onChange={(val) => config.setChatBsMaxBadges(Number(val))}
            min={0}
            max={5}
          />
        </Stack>
      </Fieldset>
    </>
  );
}
