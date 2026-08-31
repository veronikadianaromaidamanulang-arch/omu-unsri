'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AdminOrderPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    muatOrder();
    const channel = supabase
      .channel('admin-order')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, muatOrder)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function muatOrder() {
    const { data } = await supabase
      .from('orders')
      .select('*, driver:users(nama)')
      .order('created_at', { ascending: false })
      .limit(50);
    setOrders(data || []);
  }

  const label = { baru: 'Baru', diambil: 'Diproses', selesai: 'Selesai', cancel: 'Dibatalkan' };
  const warna = {
    baru: { bg: '#fff4e5', text: '#b3641b' },
    diambil: { bg: '#e5edff', text: '#2649c7' },
    selesai: { bg: '#e5f7ec', text: '#1a8a4a' },
    cancel: { bg: '#fde8e8', text: '#d63031' },
  };

  if (orders.length === 0) {
    return <div style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>Belum ada order.</div>;
  }

  return (
    <div>
      {orders.map((o) => (
        <div key={o.id} style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', background: warna[o.status]?.bg, color: warna[o.status]?.text }}>
              {label[o.status]}
            </span>
            <span style={{ fontSize: '11px', color: '#999' }}>{new Date(o.created_at).toLocaleString('id-ID')}</span>
          </div>
          <div style={{ fontWeight: '600', fontSize: '14px' }}>{o.nomor_pelanggan.replace('@s.whatsapp.net', '').replace('@lid', '')}</div>
          <div style={{ fontSize: '13px', color: '#666', margin: '4px 0' }}>{o.pesan_awal}</div>
          <div style={{ fontSize: '12px', color: '#2649c7' }}>Driver: {o.driver?.nama || '-'}</div>
        </div>
      ))}
    </div>
  );
}