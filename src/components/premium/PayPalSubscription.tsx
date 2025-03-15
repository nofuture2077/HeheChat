import React, { useContext, useState, useEffect, useRef } from 'react';
import { Card, Title, Text, Group, Loader } from '@mantine/core';
import { IconBrandPaypal, IconCheck, IconX } from '@tabler/icons-react';
import { PremiumContext } from '@/ApplicationContext';
import classes from './Premium.module.css';

// Note: This is a placeholder for the actual PayPal button component
// In a real implementation, you would import the PayPal button from react-paypal-button-v2
// and configure it with your PayPal client ID
const PayPalButtonPlaceholder: React.FC<{
  amount: string;
  currency: string;
  onSuccess: (details: any, data: any) => void;
}> = ({ amount, currency, onSuccess }) => {
  const handleClick = () => {
    // Simulate a successful PayPal payment
    const mockDetails = {
      id: 'PAYID-' + Math.random().toString(36).substr(2, 9),
      status: 'COMPLETED',
      purchase_units: [
        {
          amount: {
            value: amount,
            currency_code: currency
          }
        }
      ],
      payer: {
        email_address: 'test@example.com'
      },
      create_time: new Date().toISOString()
    };
    
    const mockData = {
      orderID: 'ORDER-' + Math.random().toString(36).substr(2, 9)
    };
    
    onSuccess(mockDetails, mockData);
  };
  
  return (
    <>
      <div 
        className={classes.paypalButton}
        style={{ 
          backgroundColor: '#8ba3c1', 
          color: 'white', 
          padding: '10px 15px', 
          borderRadius: '4px',
          cursor: 'not-allowed',
          textAlign: 'center',
          fontWeight: 'bold',
          opacity: 0.7
        }}
      >
        <IconBrandPaypal style={{ marginRight: '8px' }} />
        Pay with PayPal
      </div>
      <Text size="xs" c="dimmed" mt="xs" ta="center">
        Pro Version soon
      </Text>
    </>
  );
};

interface PayPalSubscriptionProps {
  onSuccess?: (result: any) => void;
}

export const PayPalSubscription: React.FC<PayPalSubscriptionProps> = ({ onSuccess }) => {
  const premium = useContext(PremiumContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Use a ref to track if the component is mounted
  const isMounted = useRef(true);

  // Set up the cleanup function when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePayPalSuccess = async (details: any, data: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const paymentData = {
        id: details.id,
        status: details.status,
        amount: details.purchase_units[0].amount.value,
        currency: details.purchase_units[0].amount.currency_code,
        details: details
      };
      
      const result = await premium.processPayment(paymentData);
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        if (result.success) {
          setSuccess(result.message);
          setLoading(false); // Ensure loading is set to false before callback
          if (onSuccess) onSuccess(result);
        } else {
          setError(result.message);
          setLoading(false);
        }
      }
    } catch (error) {
      // Only update state if component is still mounted
      if (isMounted.current) {
        setError('An error occurred while processing the payment');
        console.error('Error processing payment:', error);
        setLoading(false);
      }
    }
  };

  return (
    <Card p="md" radius="md" withBorder>
      <Title order={4} mb="md">
        <Group gap="xs">
          <IconBrandPaypal size={20} />
          <span>Subscribe with PayPal</span>
        </Group>
      </Title>
      
      <Text mb="md">Get HeheChat Pro for just $4.99 per month</Text>
      
      <div className={classes.paypalContainer}>
        {loading ? (
          <Group justify="center" p="md">
            <Loader size="sm" />
            <Text size="sm">Processing payment...</Text>
          </Group>
        ) : (
          <PayPalButtonPlaceholder
            amount="4.99"
            currency="USD"
            onSuccess={handlePayPalSuccess}
          />
        )}
      </div>
      
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
      
      <Text size="xs" c="dimmed" mt="md">
        Note: This is a placeholder for the actual PayPal integration. In a production environment, 
        you would use the official PayPal button component with your PayPal client ID.
      </Text>
    </Card>
  );
};
