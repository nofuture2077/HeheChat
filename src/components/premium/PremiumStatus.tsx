import React, { useContext, useEffect, useState } from 'react';
import { Badge, Tooltip } from '@mantine/core';
import { IconCrown } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import classes from './Premium.module.css';

interface PremiumStatusProps {
  showText?: boolean;
  onClick?: () => void;
}

export const PremiumStatus: React.FC<PremiumStatusProps> = ({ showText = true, onClick }) => {
  const premium = useContext(PremiumContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        await premium.checkPremiumStatus();
      } catch (error) {
        console.error('Error checking premium status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [premium]);

  if (loading) {
    return null;
  }

  if (!premium.isPremium) {
    return null;
  }

  const tooltipContent = premium.expiresAt 
    ? `HeheChat Pro active until ${new Date(premium.expiresAt).toLocaleDateString()}`
    : 'HeheChat Pro active';

  return (
    <Tooltip label={tooltipContent} position="bottom" withArrow>
      <Badge 
        className={classes.premiumBadge} 
        leftSection={<IconCrown size={14} />}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {showText ? 'HeheChat Pro' : ''}
      </Badge>
    </Tooltip>
  );
};
