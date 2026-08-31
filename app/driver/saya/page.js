'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../../lib/supabase';

export default function OrderanSayaPage() {
  const [orders, setOrders] = useState([]);
  const [driver, setDriver] = useState(null);
  const [chatAktif, setChatAktif] = useState(null);
  const [pesanList, setPesanList] = useState([]);
  const [inputChat, setInputChat] = useState('');
  const [mengupload, setMengupload] = useState(false);
  const inputFileRef = useRef(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setDriver(JSON.parse(stored));
  }, []);

  useEffect(() => {
    if (!driver) return;
    muatOrder();
    const channel = supabase
      .channel('driver-saya')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, muatOrder)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [driver]);

  useEffect(() => {
    if (!chatAktif) return;
    muatChat(chatAktif.id);
    const channel = supabase
      .channel(`chat-${chatAktif.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${chatAktif.id}` }, () => muatChat(chatAktif.id))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [chatAktif]);

  async function muatOrder() {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('driver_id', driver.id)
      .not('status', 'in', '("selesai","cancel")')
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  async function muatChat(orderId) {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    setPesanList(data || []);
  }

  async function kirimChat() {
    const teks = inputChat.trim();
    if (!teks || !chatAktif) return;
    await supabase.from('messages').insert({
      order_id: chatAktif.id,
      pengirim: 'driver',
      tipe_pesan: 'teks',
      isi_pesan: teks,
    });
    setInputChat('');
  }

  async function pilihFoto(e) {
    const file = e.target.files[0];
    if (!file || !chatAktif) return;

    setMengupload(true);

    const namaFile = `${chatAktif.id}-${Date.now()}.${file.name.split('.').pop()}`;

    const { error: uploadError } = await supabase.storage
      .from('foto-chat')
      .upload(namaFile, file);

    if (uploadError) {
      alert('Gagal upload foto: ' + uploadError.message);
      setMengupload(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('foto-chat').getPublicUrl(namaFile);

    await supabase.from('messages').insert({
      order_id: chatAktif.id,
      pengirim: 'driver',
      tipe_pesan: 'foto',
      foto_url: urlData.publicUrl,
    });

    setMengupload(false);
    e.target.value = '';
  }

  async function batalkan(orderId) {
    await supabase
      .from('orders')
      .update({ status: 'baru', driver_id: null, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    setChatAktif(null);
  }

  async function tandaiSelesai(orderId) {
    await supabase
      .from('orders')
      .update({ status: 'selesai', updated_at: new Date().toISOString(), selesai_at: new Date().toISOString() })
      .eq('id', orderId);
    setChatAktif(null);
  }

  if (chatAktif) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'white', display: 'flex', flexDirection: 'column', zIndex: 100 }}>
        <div style={{ background: '#1a1a2e', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{chatAktif.nama_pelanggan || chatAktif.nomor_pelanggan.replace('@s.whatsapp.net', '').replace('@lid', '')}</span>
          <span onClick={() => setChatAktif(null)} style={{ cursor: 'pointer', fontSize: '22px' }}>&times;</span>
        </div>

        <div style={{ flex: 1, padding: '14px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', background: '#e9ebee' }}>
          {pesanList.map((p) => (
            <div key={p.id} style={{
              maxWidth: '75%', borderRadius: '12px', fontSize: '14px',
              alignSelf: p.pengirim === 'driver' ? 'flex-end' : 'flex-start',
              background: p.tipe_pesan === 'foto' ? 'transparent' : (p.pengirim === 'driver' ? '#4361ee' : 'white'),
              color: p.pengirim === 'driver' ? 'white' : '#1a1a2e',
              padding: p.tipe_pesan === 'foto' ? '0' : '8px 12px',
              overflow: 'hidden',
            }}>
              {p.tipe_pesan === 'foto' ? (
                <img src={p.foto_url} alt="Foto" style={{ maxWidth: '100%', borderRadius: '12px', display: 'block' }} />
              ) : (
                p.isi_pesan
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: '12px', display: 'flex', gap: '8px', borderTop: '1px solid #eee', alignItems: 'center' }}>
          <input
            type="file" accept="image/*" ref={inputFileRef} onChange={pilihFoto}
            style={{ display: 'none' }}
          />
          <button
            onClick={() => inputFileRef.current?.click()}
            disabled={mengupload}
            style={{ padding: '10px', border: 'none', borderRadius: '50%', background: '#e0e0e0', cursor: 'pointer', width: '40px', height: '40px', flexShrink: 0 }}
            title="Kirim foto"
          >
            📷
          </button>
          <input
            type="text" value={inputChat} onChange={(e) => setInputChat(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && kirimChat()}
            placeholder={mengupload ? 'Mengupload foto...' : 'Ketik pesan...'}
            disabled={mengupload}
            style={{ flex: 1, padding: '10px 12px', borderRadius: '20px', border: '1.5px solid #e0e0e0' }}
          />
          <button onClick={kirimChat} disabled={mengupload} style={{ padding: '10px 18px', border: 'none', borderRadius: '20px', background: '#4361ee', color: 'white', fontWeight: '600' }}>
            Kirim
          </button>
        </div>

        <div style={{ padding: '12px', display: 'flex', gap: '8px', borderTop: '1px solid #eee' }}>
          <button onClick={() => batalkan(chatAktif.id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#d63031', color: 'white', fontWeight: '600' }}>
            Cancel Order
          </button>
          <button onClick={() => tandaiSelesai(chatAktif.id)} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', background: '#1a8a4a', color: 'white', fontWeight: '600' }}>
            Tandai Selesai
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return <div style={{ textAlign: 'center', color: '#999', padding: '60px 20px' }}>Kamu belum pegang order apapun.</div>;
  }

  return (
    <div>
      {orders.map((order) => (
        <div key={order.id} style={{ background: 'white', borderRadius: '14px', padding: '18px', marginBottom: '14px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '8px' }}>
            {order.nama_pelanggan || order.nomor_pelanggan.replace('@s.whatsapp.net', '').replace('@lid', '')}
          </div>
          <div style={{ background: '#f7f8fa', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', marginBottom: '10px' }}>
            {order.pesan_awal}
          </div>
          <button onClick={() => setChatAktif(order)} style={{ padding: '10px 16px', border: 'none', borderRadius: '8px', background: '#1a1a2e', color: 'white', fontWeight: '600', cursor: 'pointer' }}>
            Buka chat
          </button>
        </div>
      ))}
    </div>
  );
}