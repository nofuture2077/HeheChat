import React, { useContext, useState } from 'react';
import { TextInput, Button, Text, Card, Title, Group } from '@mantine/core';
import { IconTicket, IconCheck, IconX } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import classes from './Premium.module.css';

interface RedeemCodeProps {
  onSuccess?: (result: any) => void;
}

export const RedeemCode: React.FC<RedeemCodeProps> = ({ onSuccess }) => {
  const premium = useContext(PremiumContext);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    premium.loading = true;
    setError(null);

    try {
      const result = await premium.redeemCode(code);
        if (result.success) {
          setSuccess(result.message);
          setCode('');
          premium.loading = false;
          if (onSuccess) onSuccess(result);
        } else {
          setError(result.message);
          premium.loading = false;
        }
    } catch (error) {
        setError('An error occurred while redeeming the code');
        console.error('Error redeeming code:', error);
        premium.loading = false;
    }
  };

  return (
    <Card p="md" radius="md" withBorder>
      <Title order={4} mb="md">
        <Group gap="xs">
          <IconTicket size={20} />
          <span>Redeem Code</span>
        </Group>
      </Title>
      
      <form onSubmit={handleSubmit} className={classes.redeemCodeForm}>
        <TextInput
          label="Enter your code"
          placeholder="XXXX-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className={classes.redeemCodeInput}
          disabled={premium.loading}
          required
        />
        
        <Button 
          type="submit" 
          fullWidth 
          mt="md" 
          loading={premium.loading}
          disabled={!code.trim()}
        >
          Redeem
        </Button>
      </form>
      
      {error && (
        <Group className={classes.errorMessage} gap="xs">
          <IconX size={16} />
          <Text size="sm">{error}</Text>
        </Group>
      )}
      
      {success && (
        <Group className={classes.successMessage} gap="xs">
          <IconCheck size={16} />
          <Text size="sm">{success}</Text>
        </Group>
      )}
    </Card>
  );
};
