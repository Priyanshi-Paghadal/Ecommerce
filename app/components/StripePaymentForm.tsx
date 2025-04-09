'use client';

import { useEffect, useState } from 'react';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import type { StripeError } from '@stripe/stripe-js';
import type { PaymentMethod } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface StripePaymentFormProps {
  onPaymentComplete: (paymentMethod: PaymentMethod) => void;
  onError: (error: StripeError) => void;
}

function CheckoutForm({ onPaymentComplete, onError }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          billing_details: {
            // Add billing details if needed
          },
        },
      });

      if (error) {
        onError(error);
        return;
      }

      if (paymentMethod) {
        onPaymentComplete(paymentMethod);
      }
    } catch (error) {
      onError(error as StripeError);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch the client secret from your backend
    const fetchClientSecret = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if we're in development mode
        if (process.env.NODE_ENV === 'development') {
          // For development, use a mock client secret
          console.log('Using mock client secret for development');
          setClientSecret('mock_client_secret_for_development');
          setIsLoading(false);
          return;
        }
        
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: 1000, // Amount in cents
            currency: 'usd',
          }),
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.clientSecret) {
          throw new Error('No client secret returned from API');
        }
        
        setClientSecret(data.clientSecret);
      } catch (error) {
        console.error('Error fetching client secret:', error);
        setError(error instanceof Error ? error.message : 'Failed to load payment form');
        // Create a mock error for Stripe
        const stripeError = {
          type: 'invalid_request_error',
          message: 'Failed to initialize payment form',
          code: 'payment_form_error',
        } as StripeError;
        props.onError(stripeError);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientSecret();
  }, [props]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading payment form...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">Error: {error}</p>
        <p className="text-sm text-red-500 mt-2">
          Please try again later or contact support if the problem persists.
        </p>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p className="text-yellow-600">Unable to initialize payment form</p>
        <p className="text-sm text-yellow-500 mt-2">
          Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
          },
        },
      }}
    >
      <CheckoutForm {...props} />
    </Elements>
  );
} 