'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3x3, LayoutDashboard, Grid2X2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Pool', icon: Grid3x3 },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { href: '/my-squares', label: 'My Squares', icon: Grid2X2, requiresAuth: true },
];

export default function MobileNav() {
  // Disabled - using hamburger menu in Header instead
  return null;
}
