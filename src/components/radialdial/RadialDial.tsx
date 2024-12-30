import { useEffect, useCallback, useState, useRef } from 'react';
import styles from './RadialDial.module.css';
import { ActionIcon } from '@mantine/core';

export interface RadialAction {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
  disabled?: boolean;
}

interface RadialDialProps {
  actions: RadialAction[];
  radius?: number;
  onClose?: () => void;
  messageRef: React.RefObject<HTMLElement>;
  position: { x: number; y: number };
}

export const RadialDial: React.FC<RadialDialProps> = ({
  actions,
  radius = 80,
  onClose,
  messageRef,
  position,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleInteractionEnd = useCallback(() => {
    if (hoveredIndex !== null) {
      actions[hoveredIndex].onClick();
    }
    if (messageRef?.current) {
      messageRef.current.classList.remove(styles.highlightedMessage);
    }
    onClose?.();
  }, [hoveredIndex, actions, onClose, messageRef]);

  // Calculate which action button is being hovered based on coordinates
  const calculateHoveredButton = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const buttons = containerRef.current.querySelectorAll(`.${styles.actionButton}`);

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );

      if (distance < rect.width / 2) {
        setHoveredIndex(i);
        return;
      }
    }

    setHoveredIndex(null);
  }, []);

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      calculateHoveredButton(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleInteractionEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [calculateHoveredButton, handleInteractionEnd]);

  // Touch move handler
  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      calculateHoveredButton(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleInteractionEnd();
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [calculateHoveredButton, handleInteractionEnd]);

  // Highlight message on mount
  useEffect(() => {
    if (messageRef?.current) {
      messageRef.current.classList.add(styles.highlightedMessage);
    }
  }, [messageRef]);

  return (
    <div 
      ref={containerRef} 
      className={styles.container}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
      }}
    >
      <div className={styles.actions}>
        {actions.map((action, index) => {
          const angle = (2 * Math.PI * index) / actions.length - Math.PI / 2;
          const x = Math.cos(angle) * radius - 36;
          const y = Math.sin(angle) * radius - 36;
          
          return (
            <ActionIcon
              key={index}
              disabled={action.disabled}
              variant="default"
              className={`${styles.actionButton} ${hoveredIndex === index ? styles.hovered : ''}`}
              style={{
                transform: `translate(${x}px, ${y}px) scale(1)`,
                transitionDelay: `${index * 0.03}s`,
              }}
            >
              <>
                {action.icon}
                {action.tooltip && (
                  <span className={styles.tooltip}>{action.tooltip}</span>
                )}
              </>
            </ActionIcon>
          );
        })}
      </div>
    </div>
  );
};
