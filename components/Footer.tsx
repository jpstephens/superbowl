'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FileText } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="hidden sm:block bg-white border-t border-gray-200 mt-auto w-full overflow-x-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-full">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="Michael Williams Memorial Scholarship" width={50} height={50} />
            <div className="text-center sm:text-left">
              <p className="text-base font-semibold text-[#232842]">
                Michael Williams Memorial Scholarship Fund
              </p>
              <p className="text-sm text-gray-500 mt-1">
                All proceeds support the scholarship fund
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="https://michaelwilliamsscholarship.com"
              target="_blank"
              className="text-base font-medium text-gray-600 hover:text-[#cda33b] transition-colors"
            >
              Main Website
            </Link>
            <Link
              href="/disclaimer"
              className="flex items-center gap-2 text-base font-medium text-gray-600 hover:text-[#cda33b] transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Terms</span>
            </Link>
            <Link
              href="/admin"
              className="text-base font-medium text-gray-600 hover:text-[#cda33b] transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Michael Williams Memorial Scholarship Fund
          </p>
        </div>
      </div>
    </footer>
  );
}
