'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

export default function OrderanAktifPage() {
  const [orders, setOrders] = useState([]);
  const [driver, setDriver] = useState(null);
  const [settings, setSettings] = useState(null);
  const urutanTombol = useRef({});
  const idOrderSebelumnya = useRef(new Set());

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setDriver(JSON.parse(stored));
    muatSettings();

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!driver) return;
    muatOrder();
    const channel = supabase
      .channel('driver-aktif')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, muatOrder)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [driver]);

  async function muatSettings() {
    const { data } = await supabase.from('settings').select('*').eq('id', 1).single();
    setSettings(data);
  }

  async function muatOrder() {
    const { data } = await supabase
      .from('orders')
      .select('*, driver:users(nama)')
      .not('status', 'in', '("selesai","cancel")')
      .order('updated_at', { ascending: false });

    const orderBaru = data || [];

    const idOrderBaruSaja = orderBaru
      .filter((o) => o.status === 'baru' && !idOrderSebelumnya.current.has(o.id));

    if (idOrderBaruSaja.length > 0 && idOrderSebelumnya.current.size > 0) {
      mainkanNotifikasi();
    }

    idOrderSebelumnya.current = new Set(orderBaru.map((o) => o.id));
    setOrders(orderBaru);
  }

  function mainkanNotifikasi() {
    try {
      const audio = new Audio('/notif.mp3');
      audio.play().catch(() => {});
    } catch (e) {}

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Order baru masuk!', { body: 'Ada orderan baru yang bisa diambil.' });
    }
  }

  function bisaLihatOrder(order) {
    if (order.ditolak_oleh?.includes(driver.id)) return false;
    if (order.status !== 'baru' || !settings?.delay_aktif || order.dilepas_dini) return true;
    if (driver.is_prioritas) return true;
    const detikBerlalu = (Date.now() - new Date(order.created_at).getTime()) / 1000;
    return detikBerlalu >= settings.delay_durasi_detik;
  }

  function sisaDetikDelay(order) {
    const detikBerlalu = (Date.now() - new Date(order.created_at).getTime()) / 1000;
    return Math.max(0, settings.delay_durasi_detik - detikBerlalu);
  }

  function getUrutanTombol(orderId) {
    if (!urutanTombol.current[orderId]) {
      urutanTombol.current[orderId] = Math.random() < 0.5 ? 'ambil-dulu' : 'tolak-dulu';
    }
    return urutanTombol.current[orderId];
  }

  async function ambilOrder(orderId) {
    const { data } = await supabase
      .from('orders')
      .update({ status: 'diambil', driver_id: driver.id, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .eq('status', 'baru')
      .select();

    if (!data || data.length === 0) {
      alert('Order ini sudah diambil driver lain!');
      return;
    }

    await supabase.from('messages').insert({
      order_id: orderId,
      pengirim: 'driver',
      tipe_pesan: 'teks',
      isi_pesan: `Here we go, Driver ${driver.nama} siap otw ka 🛵`,
    });
  }

  async function tolakOrder(order) {
    const daftarBaru = [...(order.ditolak_oleh || []), driver.id];
    await supabase.from('orders').update({ ditolak_oleh: daftarBaru }).eq('id', order.id);
  }

  async function lepasKeSemua(orderId) {
    await supabase.from('orders').update({ dilepas_dini: true }).eq('id', orderId);
  }

  const label = { baru: 'Order baru', diambil: 'Sedang diproses' };
  const orderTerlihat = orders.filter(bisaLihatOrder);

  if (!driver || !settings) return null;

  if (orderTerlihat.length === 0) {
    return <div style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>Belum ada order aktif.</div>;
  }

  return (
    <div>
      {orderTerlihat.map((order) => {
        const dalamMasaDelay = order.status === 'baru' && settings.delay_aktif && !order.dilepas_dini &&
          sisaDetikDelay(order) > 0 && driver.is_prioritas;

        const urutan = getUrutanTombol(order.id);

        return (
          <div key={order.id} style={{ background: 'white', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                background: order.status === 'baru' ? '#fff4e5' : '#e5edff',
                color: order.status === 'baru' ? '#b3641b' : '#2649c7',
              }}>
                {label[order.status]}
              </span>
              <span style={{ fontSize: '11px', color: '#999' }}>#{order.nomor_order}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              {order.foto_profil_url ? (
                <img src={order.foto_profil_url} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: '#888' }}>
                  {(order.nama_pelanggan || '?')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px' }}>
                  {order.nama_pelanggan || order.nomor_pelanggan.replace('@s.whatsapp.net', '').replace('@lid', '')}
                </div>
                {order.nama_pelanggan && (
                  <div style={{ fontSize: '11px', color: '#999' }}>
                    {order.nomor_pelanggan.replace('@s.whatsapp.net', '').replace('@lid', '')}
                  </div>
                )}
              </div>
            </div>

            {order.status === 'diambil' && (
              <div style={{ fontSize: '12px', color: '#2649c7', marginBottom: '8px', fontWeight: '600' }}>
                Diambil oleh: {order.driver?.nama || '-'}
              </div>
            )}
            <div style={{ background: '#f7f8fa', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', marginBottom: '10px' }}>
              {order.pesan_awal}
            </div>

            {order.status === 'baru' && (
              <div style={{ display: 'flex', gap: '8px', flexDirection: urutan === 'ambil-dulu' ? 'row' : 'row-reverse' }}>
                <button
                  onClick={() => ambilOrder(order.id)}
                  style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#4361ee', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  Ambil Orderan
                </button>
                <button
                  onClick={() => tolakOrder(order)}
                  style={{ flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#888', color: 'white', fontWeight: '600', cursor: 'pointer' }}
                >
                  Tolak Orderan
                </button>
              </div>
            )}

            {dalamMasaDelay && (
              <button
                onClick={() => lepasKeSemua(order.id)}
                style={{ width: '100%', marginTop: '8px', padding: '10px', border: '1px dashed #b3641b', borderRadius: '8px', background: 'none', color: '#b3641b', fontWeight: '600', cursor: 'pointer' }}
              >
                Lepas ke Semua Driver
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}