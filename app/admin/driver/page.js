'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function KelolaDriverPage() {
  const [drivers, setDrivers] = useState([]);
  const [filter, setFilter] = useState('semua');
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    muatDriver();
    muatSettings();
    const channel = supabase
      .channel('admin-driver')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, muatDriver)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function muatDriver() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'driver')
      .eq('status_akun', 'aktif')
      .order('nama');
    setDrivers(data || []);
  }

  async function muatSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
    setSettings(data);
  }

  async function toggleFrioritas(id, statusSekarang) {
    await supabase.from('users').update({ is_prioritas: !statusSekarang }).eq('id', id);
  }

  async function updateSettings(field, value) {
    const updated = { ...settings, [field]: value };
    setSettings(updated);
    await supabase.from('settings').update({ [field]: value }).eq('id', 1);
  }

  const driverTerlihat = drivers.filter((d) => {
    if (filter === 'prioritas') return d.is_prioritas;
    if (filter === 'biasa') return !d.is_prioritas;
    return true;
  });

  if (!settings) return null;

  return (
    <div>
      <div style={{ background: 'white', borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
        <h3 style={{ marginTop: 0, fontSize: '15px' }}>Pengaturan Sistem</h3>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '14px' }}>
          <input type="checkbox" checked={settings.delay_aktif} onChange={(e) => updateSettings('delay_aktif', e.target.checked)} />
          Aktifkan delay prioritas
        </label>

        {settings.delay_aktif && (
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '13px', color: '#666' }}>Durasi delay (detik)</label>
            <input
              type="number" value={settings.delay_durasi_detik}
              onChange={(e) => updateSettings('delay_durasi_detik', parseInt(e.target.value) || 0)}
              style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e0e0e0', marginTop: '4px' }}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: '13px', color: '#666' }}>Maksimal order per driver</label>
          <input
            type="number" value={settings.maks_order_per_driver}
            onChange={(e) => updateSettings('maks_order_per_driver', parseInt(e.target.value) || 1)}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e0e0e0', marginTop: '4px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {['semua', 'prioritas', 'biasa'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer',
              background: filter === f ? '#4361ee' : '#e0e0e0',
              color: filter === f ? 'white' : '#333',
              fontSize: '13px', fontWeight: '600',
            }}
          >
            {f === 'semua' ? 'Semua' : f === 'prioritas' ? 'Prioritas' : 'Biasa'}
          </button>
        ))}
      </div>

      {driverTerlihat.map((d) => (
        <div key={d.id} style={{ background: 'white', borderRadius: '14px', padding: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px' }}>{d.nama}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>@{d.username}</div>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <input type="checkbox" checked={d.is_prioritas} onChange={() => toggleFrioritas(d.id, d.is_prioritas)} />
            Prioritas
          </label>
        </div>
      ))}
    </div>
  );
}