'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function StatistikPage() {
  const [driver, setDriver] = useState(null);
  const [jumlahSelesai, setJumlahSelesai] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setDriver(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!driver) return;
    muatStatistik();
  }, [driver]);

  async function muatStatistik() {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('driver_id', driver.id)
      .eq('status', 'selesai');
    setJumlahSelesai(count || 0);
  }

  if (!driver) return null;

  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '40px', fontWeight: '700', color: '#4361ee' }}>{jumlahSelesai}</div>
      <div style={{ color: '#666', marginTop: '8px' }}>Order selesai</div>
    </div>
  );
}