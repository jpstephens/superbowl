'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const isPropsPage = pathname === '/props';

  return (
    <header className="sticky top-0 z-50 w-full bg-[#232842]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo & Title */}
          <Link href="/" className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white p-0.5 shadow-lg flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Michael Williams Memorial Scholarship"
                width={52}
                height={52}
                className="rounded-full"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white leading-tight">
                Super Bowl Pool
              </h1>
              <p className="text-sm text-[#d4af37] font-medium">
                Michael Williams Memorial Scholarship
              </p>
            </div>
          </Link>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-bold transition-all",
                isPropsPage
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-[#d4af37] text-[#232842] hover:bg-[#e5c65c]"
              )}
            >
              Super Bowl Pool
            </Link>
            <Link
              href="/props"
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-bold transition-all",
                isPropsPage
                  ? "bg-[#d4af37] text-[#232842] hover:bg-[#e5c65c]"
                  : "bg-white/10 text-white hover:bg-white/20"
              )}
            >
              Place Prop Bets
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
