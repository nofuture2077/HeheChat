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
}

export const RadialDial: React.FC<RadialDialProps> = ({
  actions,
  icon,
  radius = 80,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      if (hoveredIndex !== null) {
        actions[hoveredIndex].onClick();
      }
      setIsOpen(false);
      onClose?.();
    };

    if (isOpen) {
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isOpen, hoveredIndex, actions, onClose]);

  // Auto-open the dial when it's mounted
  useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <div ref={containerRef} className={styles.container}>
      <button
        className={`${styles.trigger} ${isOpen ? styles.open : ''}`}
      >
        {icon}
      </button>
      <div className={`${styles.actions} ${isOpen ? styles.open : ''}`}>
        {actions.map((action, index) => {
          // Calculate angle for full circle distribution
          const angle = (2 * Math.PI * index) / actions.length - Math.PI / 2;
          const x = Math.cos(angle) * radius -36;
          const y = Math.sin(angle) * radius -36;
          
          return (
            <ActionIcon
              key={index}
              variant="default"
              className={`${styles.actionButton} ${hoveredIndex === index ? styles.hovered : ''}`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
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
