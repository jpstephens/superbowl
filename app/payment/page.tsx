'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import type { GridSquare } from '@/lib/supabase/types';
import { ArrowLeft, CreditCard, Heart, Shield, Lock, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface RegistrationData {
  name: string;
  email: string;
  phone: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const [selectedSquares, setSelectedSquares] = useState<GridSquare[]>([]);
  const [loading, setLoading] = useState(false);
  const [coverFees, setCoverFees] = useState(false);
  const [squarePrice, setSquarePrice] = useState(50);
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    name: '',
    email: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Partial<RegistrationData>>({});

  useEffect(() => {
    const saved = sessionStorage.getItem('selectedSquares');

    if (!saved) {
      router.push('/');
      return;
    }

    try {
      setSelectedSquares(JSON.parse(saved));
    } catch (error) {
      console.error('Error parsing squares:', error);
      router.push('/');
    }

    // Load price from settings
    loadPrice();
  }, [router]);

  const loadPrice = async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'square_price')
        .single();

      if (data?.value) {
        setSquarePrice(parseFloat(data.value));
      }
    } catch (error) {
      console.error('Error loading price:', error);
    }
  };

  const calculateStripeFee = (amount: number) => {
    return Math.round((amount * 0.029 + 0.30) * 100) / 100;
  };

  const baseAmount = selectedSquares.length * squarePrice;
  const transactionFee = calculateStripeFee(baseAmount);
  const totalAmount = coverFees ? baseAmount + transactionFee : baseAmount;

  const validateForm = (): boolean => {
    const newErrors: Partial<RegistrationData> = {};

    if (!registrationData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!registrationData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone is optional but validate format if provided
    if (registrationData.phone && !/^[+]?[\d\s()-]{10,}$/.test(registrationData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedSquares,
          registrationData,
          totalAmount,
          baseAmount,
          transactionFee: coverFees ? transactionFee : 0,
          coverFees,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  if (!selectedSquares.length) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          {/* Back Button */}
          <Link href="/grid" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to grid
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Form */}
            <div className="lg:col-span-2">
              <h1 className="text-3xl font-bold text-foreground mb-6">Checkout</h1>

              {/* Your Information */}
              <Card className="p-6 mb-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Your Information</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4" />
                      Full Name *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Smith"
                      value={registrationData.name}
                      onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                      className={errors.name ? 'border-destructive' : ''}
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={registrationData.email}
                      onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                      className={errors.email ? 'border-destructive' : ''}
                    />
                    {errors.email && <p className="text-sm text-destructive mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                      <Phone className="w-4 h-4" />
                      Phone Number (optional)
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={registrationData.phone}
                      onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                      className={errors.phone ? 'border-destructive' : ''}
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                    <p className="text-xs text-muted-foreground mt-1">For winner notifications via SMS</p>
                  </div>
                </div>
              </Card>

              {/* Selected Squares */}
              <Card className="p-6 mb-6">
                <h2 className="text-lg font-bold text-foreground mb-4">Your Squares ({selectedSquares.length})</h2>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {selectedSquares.map((square) => (
                    <div
                      key={square.id}
                      className="px-3 py-2 bg-primary/10 text-primary rounded-lg font-mono text-sm font-medium"
                    >
                      [{square.row_number}, {square.col_number}]
                    </div>
                  ))}
                </div>
              </Card>

              {/* Cover Fees Option */}
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="coverFees"
                    checked={coverFees}
                    onCheckedChange={(checked) => setCoverFees(checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor="coverFees"
                      className="text-sm font-semibold text-foreground cursor-pointer"
                    >
                      Help cover processing fees (+${transactionFee.toFixed(2)})
                    </label>
                    <p className="text-sm text-muted-foreground mt-1">
                      100% of your contribution goes to the scholarship fund when you cover the payment processing fees.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-6 shadow-lg">
                  <h2 className="text-lg font-bold text-foreground mb-4">Order Summary</h2>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>{selectedSquares.length} square{selectedSquares.length !== 1 ? 's' : ''} × ${squarePrice}</span>
                      <span>${baseAmount.toFixed(2)}</span>
                    </div>

                    {coverFees && (
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span>Processing Fee</span>
                        <span>${transactionFee.toFixed(2)}</span>
                      </div>
                    )}

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between text-xl font-bold text-foreground">
                        <span>Total</span>
                        <span>${totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={loading || !registrationData.name || !registrationData.email}
                    className="w-full h-12 mb-4 bg-primary hover:bg-primary-hover"
                    size="lg"
                  >
                    {loading ? (
                      'Processing...'
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay ${totalAmount.toFixed(2)}
                      </>
                    )}
                  </Button>

                  {/* Security Badges */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-4 h-4 text-green-600" />
                      <span>Secure payment via Stripe</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>Your payment info is encrypted</span>
                    </div>
                  </div>
                </Card>

                {/* Charity Notice */}
                <Card className="p-4 mt-4 bg-primary/10 border-primary/20">
                  <div className="flex items-start gap-3">
                    <Heart className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="currentColor" />
                    <div className="text-sm text-foreground">
                      <strong className="block mb-1">Supporting Education</strong>
                      Your contribution directly supports the Michael Williams Memorial Scholarship Fund.
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
