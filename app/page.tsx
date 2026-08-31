'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('user');

    if (!stored) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(stored);

    if (user.role === 'admin') {
      router.push('/admin/verifikasi');
    } else if (user.role === 'driver') {
      router.push('/driver/aktif');
    } else {
      router.push('/login');
    }
  }, []);

  return null;
}