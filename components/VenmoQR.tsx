'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface VenmoQRProps {
  amount: number;
  username: string;
  memo: string;
}

export default function VenmoQR({ amount, username, memo }: VenmoQRProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      try {
        const venmoUrl = `venmo://paycharge?txn=pay&recipients=${username}&amount=${amount}&note=${encodeURIComponent(memo)}`;
        const qr = await QRCode.toDataURL(venmoUrl);
        setQrDataUrl(qr);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [amount, username, memo]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {qrDataUrl ? (
        <img
          src={qrDataUrl}
          alt="Venmo QR Code"
          className="w-64 h-64 border-4 border-gray-200 rounded-lg"
        />
      ) : (
        <div className="w-64 h-64 border-4 border-gray-200 rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Generating QR code...</p>
        </div>
      )}
      
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with Venmo or
        </p>
        <p className="text-sm font-semibold">
          Send ${amount} to @{username}
        </p>
        <p className="text-xs text-muted-foreground">
          {memo}
        </p>
      </div>
    </div>
  );
}

