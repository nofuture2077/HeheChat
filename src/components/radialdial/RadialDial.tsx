import { useEffect, useCallback, useState, useRef } from 'react';
import styles from './RadialDial.module.css';
import { ActionIcon } from '@mantine/core';

export interface RadialAction {
  icon: React.ReactNode;
  onClick: () => void;
  tooltip?: string;
}

interface RadialDialProps {
  actions: RadialAction[];
  icon: React.ReactNode;
  radius?: number;
  onClose?: () => void;
  messageRef: React.RefObject<HTMLElement>;
}

export const RadialDial: React.FC<RadialDialProps> = ({
  actions,
  icon,
  radius = 80,
  onClose,
  messageRef,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isTouchingRef = useRef<boolean>(false);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    if (messageRef?.current) {
      messageRef.current.classList.remove(styles.highlightedMessage);
    }
    onClose?.();
  }, [onClose, messageRef]);

  const handleInteractionEnd = useCallback((isTouch: boolean = false) => {
    // Only process if it matches the current interaction type
    if (isTouch !== isTouchingRef.current) return;
    
    if (hoveredIndex !== null) {
      actions[hoveredIndex].onClick();
    }
    closeMenu();
    if (isTouch) {
      isTouchingRef.current = false;
    }
  }, [hoveredIndex, actions, closeMenu]);

  // Calculate which action button is being hovered/touched based on coordinates
  const calculateHoveredButton = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;

    const buttons = containerRef.current.querySelectorAll(`.${styles.actionButton}`);
    const containerRect = containerRef.current.getBoundingClientRect();

    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const rect = button.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Check if the pointer is within the button's area
      const distance = Math.sqrt(
        Math.pow(clientX - centerX, 2) + Math.pow(clientY - centerY, 2)
      );

      if (distance < rect.width) {
        setHoveredIndex(i);
        return;
      }
    }

    setHoveredIndex(null);
  }, []);

  // Mouse event handlers
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (isTouchingRef.current) return; // Ignore if touch interaction
      handleInteractionEnd(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isTouchingRef.current) return; // Ignore if touch interaction
      calculateHoveredButton(e.clientX, e.clientY);
    };

    if (isOpen) {
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isOpen, handleInteractionEnd, calculateHoveredButton]);

  // Touch event handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      isTouchingRef.current = true;
      const touch = e.touches[0];
      calculateHoveredButton(touch.clientX, touch.clientY);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault();
      handleInteractionEnd(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!isTouchingRef.current) return;
      const touch = e.touches[0];
      calculateHoveredButton(touch.clientX, touch.clientY);
    };

    const handleTouchCancel = (e: TouchEvent) => {
      e.preventDefault();
      isTouchingRef.current = false;
      setHoveredIndex(null);
      closeMenu();
    };

    if (isOpen && containerRef.current) {
      const element = containerRef.current;
      element.addEventListener('touchstart', handleTouchStart, { passive: false });
      element.addEventListener('touchend', handleTouchEnd, { passive: false });
      element.addEventListener('touchmove', handleTouchMove, { passive: false });
      element.addEventListener('touchcancel', handleTouchCancel, { passive: false });
    }

    return () => {
      if (containerRef.current) {
        const element = containerRef.current;
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchcancel', handleTouchCancel);
      }
    };
  }, [isOpen, handleInteractionEnd, calculateHoveredButton, closeMenu]);

  // Auto-open the dial when it's mounted and highlight the message
  useEffect(() => {
    setIsOpen(true);
    if (messageRef?.current) {
      messageRef.current.classList.add(styles.highlightedMessage);
    }
  }, [messageRef]);

  return (
    <div 
      ref={containerRef} 
      className={styles.container}
    >
      <button
        className={`${styles.trigger}`}
      >
        {icon}
      </button>
      <div className={`${styles.actions} ${isOpen ? styles.open : ''}`}>
        {actions.map((action, index) => {
          // Calculate angle for full circle distribution
          const angle = (2 * Math.PI * index) / actions.length - Math.PI / 2;
          const x = Math.cos(angle) * radius - 36;
          const y = Math.sin(angle) * radius - 36;
          
          return (
            <ActionIcon
              key={index}
              variant="default"
              className={`${styles.actionButton} ${hoveredIndex === index ? styles.hovered : ''}`}
              onMouseEnter={() => !isTouchingRef.current && setHoveredIndex(index)}
              onMouseLeave={() => !isTouchingRef.current && setHoveredIndex(null)}
              style={{
                transform: isOpen
                  ? `translate(${x}px, ${y}px) scale(1)`
                  : 'translate(0, 0) scale(0)',
                transitionDelay: isOpen
                  ? `${index * 0.03}s`
                  : `${(actions.length - 1 - index) * 0.03}s`,
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
