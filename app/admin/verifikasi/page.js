'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function VerifikasiPage() {
  const [driverPending, setDriverPending] = useState([]);

  useEffect(() => {
    muatDriver();
    const channel = supabase
      .channel('admin-verifikasi')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, muatDriver)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function muatDriver() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('status_akun', 'pending')
      .order('created_at', { ascending: false });
    setDriverPending(data || []);
  }

  async function approve(id) {
    await supabase.from('users').update({ status_akun: 'aktif' }).eq('id', id);
  }

  async function tolak(id) {
    await supabase.from('users').update({ status_akun: 'ditolak' }).eq('id', id);
  }

  if (driverPending.length === 0) {
    return <div style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>Tidak ada pendaftaran baru.</div>;
  }

  return (
    <div>
      {driverPending.map((d) => (
        <div key={d.id} style={{ background: 'white', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: '600', fontSize: '15px' }}>{d.nama}</div>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '4px' }}>@{d.username}</div>
          <div style={{ color: '#666', fontSize: '13px', marginBottom: '12px' }}>{d.no_hp}</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => approve(d.id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#1a8a4a', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
              Setujui
            </button>
            <button onClick={() => tolak(d.id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#d63031', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
              Tolak
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}