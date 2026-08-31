'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function AdminStatistikPage() {
  const [stat, setStat] = useState({
    hariIni: 0,
    selesaiMingguIni: 0,
    cancelMingguIni: 0,
    driverTerbanyak: [],
  });

  useEffect(() => {
    muatStatistik();
  }, []);

  async function muatStatistik() {
    const awalHariIni = new Date();
    awalHariIni.setHours(0, 0, 0, 0);

    const awalMinggu = new Date();
    awalMinggu.setDate(awalMinggu.getDate() - 7);

    const { count: hariIni } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', awalHariIni.toISOString());

    const { count: selesaiMingguIni } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'selesai')
      .gte('created_at', awalMinggu.toISOString());

    const { count: cancelMingguIni } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'cancel')
      .gte('created_at', awalMinggu.toISOString());

    const { data: orderData } = await supabase
      .from('orders')
      .select('driver_id, driver:users(nama)')
      .eq('status', 'selesai')
      .not('driver_id', 'is', null);

    const hitungPerDriver = {};
    (orderData || []).forEach((o) => {
      const nama = o.driver?.nama || 'Tidak diketahui';
      hitungPerDriver[nama] = (hitungPerDriver[nama] || 0) + 1;
    });

    const driverTerbanyak = Object.entries(hitungPerDriver)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    setStat({
      hariIni: hariIni || 0,
      selesaiMingguIni: selesaiMingguIni || 0,
      cancelMingguIni: cancelMingguIni || 0,
      driverTerbanyak,
    });
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <KartuStat angka={stat.hariIni} label="Order hari ini" />
        <KartuStat angka={stat.selesaiMingguIni} label="Selesai (7 hari)" />
        <KartuStat angka={stat.cancelMingguIni} label="Dibatalkan (7 hari)" />
      </div>

      <div style={{ background: 'white', borderRadius: '14px', padding: '18px' }}>
        <h3 style={{ marginTop: 0, fontSize: '15px' }}>Driver Paling Aktif</h3>
        {stat.driverTerbanyak.length === 0 ? (
          <p style={{ color: '#999', fontSize: '14px' }}>Belum ada data.</p>
        ) : (
          stat.driverTerbanyak.map(([nama, jumlah], i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee', fontSize: '14px' }}>
              <span>{i + 1}. {nama}</span>
              <span style={{ fontWeight: '600' }}>{jumlah} order</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function KartuStat({ angka, label }) {
  return (
    <div style={{ background: 'white', borderRadius: '14px', padding: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', fontWeight: '700', color: '#4361ee' }}>{angka}</div>
      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{label}</div>
    </div>
  );
}