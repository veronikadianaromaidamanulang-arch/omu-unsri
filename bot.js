require('dotenv').config({ path: '.env.local' });
global.WebSocket = require('ws');

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const { createClient } = require('@supabase/supabase-js');
const pino = require('pino');
const qrcode = require('qrcode-terminal');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let sockAktif = null;
const kontakTersimpan = {};

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info');

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  sockAktif = sock;

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('contacts.upsert', (contacts) => {
    contacts.forEach((c) => {
      if (c.id && c.name) kontakTersimpan[c.id] = c.name;
    });
  });
  sock.ev.on('contacts.update', (contacts) => {
    contacts.forEach((c) => {
      if (c.id && c.name) kontakTersimpan[c.id] = c.name;
    });
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('Scan QR code ini pakai WhatsApp di HP kamu (Linked Devices):');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Koneksi terputus, reconnect:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('Bot WhatsApp berhasil connect!');
      try {
        await sock.sendPresenceUpdate('unavailable');
      } catch (e) {
        console.log('Gagal set status unavailable (tidak fatal):', e.message);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const nomorPengirim = msg.key.remoteJid;
    const isiPesan =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      '';

    if (!isiPesan) return;

    console.log(`Pesan masuk dari ${nomorPengirim}: ${isiPesan}`);

    const { data: orderAktif } = await supabase
      .from('orders')
      .select('*')
      .eq('nomor_pelanggan', nomorPengirim)
      .not('status', 'in', '("selesai","cancel")')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let orderId;

    if (orderAktif) {
      orderId = orderAktif.id;
      await supabase
        .from('orders')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', orderId);
    } else {
      const namaPelanggan = kontakTersimpan[nomorPengirim] || msg.pushName || null;

      let fotoProfilUrl = null;
      try {
        fotoProfilUrl = await sockAktif.profilePictureUrl(nomorPengirim, 'image');
      } catch (e) {
        fotoProfilUrl = null;
      }

      const { data: orderBaru, error } = await supabase
        .from('orders')
        .insert({
          nomor_pelanggan: nomorPengirim,
          pesan_awal: isiPesan,
          status: 'baru',
          nama_pelanggan: namaPelanggan,
          foto_profil_url: fotoProfilUrl,
        })
        .select()
        .single();

      if (error) {
        console.error('Gagal simpan order baru:', error);
        return;
      }
      orderId = orderBaru.id;
    }

    await supabase.from('messages').insert({
      order_id: orderId,
      pengirim: 'pelanggan',
      isi_pesan: isiPesan,
    });
  });

  return sock;
}

// ============================
// ANTRIAN PENGIRIMAN PESAN
// ============================
const antrianPesan = [];
let sedangProses = false;

function tambahKeAntrian(item) {
  antrianPesan.push(item);
  prosesAntrian();
}

function jedaAcak(minDetik, maxDetik) {
  const ms = (minDetik + Math.random() * (maxDetik - minDetik)) * 1000;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function hitungDurasiTyping(panjangTeks) {
  const dasarDetik = panjangTeks / 3;
  const variasi = dasarDetik * (0.8 + Math.random() * 0.4);
  return Math.min(variasi, 20) * 1000;
}

async function prosesAntrian() {
  if (sedangProses || antrianPesan.length === 0) return;
  sedangProses = true;

  while (antrianPesan.length > 0) {
    const item = antrianPesan.shift();

    await jedaAcak(3, 6);

    if (!sockAktif) {
      console.log('Bot belum siap, pesan dibatalkan.');
      continue;
    }

    // Presence update dibungkus try-catch SENDIRI biar kalau gagal, tidak menghalangi pengiriman pesan asli
    try {
      await sockAktif.sendPresenceUpdate('composing', item.nomorTujuan);
    } catch (e) {
      console.log('Gagal kirim status mengetik (tidak fatal):', e.message);
    }

    try {
      if (item.tipe === 'foto') {
        await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 2000));
        await sockAktif.sendMessage(item.nomorTujuan, { image: { url: item.fotoUrl } });
        console.log(`Foto terkirim ke ${item.nomorTujuan}`);
      } else {
        const durasiTyping = hitungDurasiTyping(item.teks.length);
        await new Promise((resolve) => setTimeout(resolve, durasiTyping));
        await sockAktif.sendMessage(item.nomorTujuan, { text: item.teks });
        console.log(`Pesan terkirim ke ${item.nomorTujuan}: ${item.teks}`);
      }
    } catch (err) {
      console.error('Gagal kirim pesan:', err.message);
    }
  }

  sedangProses = false;
}

// ============================
// DENGARKAN PESAN BARU DARI DRIVER (via dashboard)
// ============================
supabase
  .channel('messages-channel')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
    const pesanBaru = payload.new;
    if (pesanBaru.pengirim !== 'driver') return;

    const { data: order } = await supabase
      .from('orders')
      .select('nomor_pelanggan')
      .eq('id', pesanBaru.order_id)
      .single();

    if (!order) return;

    if (pesanBaru.tipe_pesan === 'foto') {
      tambahKeAntrian({
        nomorTujuan: order.nomor_pelanggan,
        tipe: 'foto',
        fotoUrl: pesanBaru.foto_url,
      });
    } else {
      tambahKeAntrian({
        nomorTujuan: order.nomor_pelanggan,
        tipe: 'teks',
        teks: pesanBaru.isi_pesan,
      });
    }
  })
  .subscribe();

// ============================
// AUTO-SELESAI: order "diambil" yang tidak diselesaikan 2 jam
// ============================
async function cekOrderKelamaan() {
  const duaJamLalu = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  const { data: orderKelamaan } = await supabase
    .from('orders')
    .select('id')
    .eq('status', 'diambil')
    .lt('updated_at', duaJamLalu);

  if (orderKelamaan && orderKelamaan.length > 0) {
    for (const o of orderKelamaan) {
      await supabase
        .from('orders')
        .update({ status: 'selesai', selesai_at: new Date().toISOString() })
        .eq('id', o.id);
      console.log(`Order ${o.id} otomatis ditandai selesai (2 jam tidak diproses).`);
    }
  }
}

// ============================
// HAPUS FOTO CHAT YANG SUDAH LEBIH DARI 24 JAM
// ============================
async function hapusFotoLama() {
  const sehariLalu = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: pesanFotoLama } = await supabase
    .from('messages')
    .select('id, foto_url')
    .eq('tipe_pesan', 'foto')
    .lt('created_at', sehariLalu)
    .not('foto_url', 'is', null);

  if (!pesanFotoLama || pesanFotoLama.length === 0) return;

  for (const p of pesanFotoLama) {
    const namaFile = p.foto_url.split('/').pop();
    const { error } = await supabase.storage.from('foto-chat').remove([namaFile]);
    if (!error) {
      await supabase.from('messages').update({ foto_url: null }).eq('id', p.id);
      console.log(`Foto ${namaFile} dihapus (sudah 24 jam).`);
    }
  }
}

setInterval(cekOrderKelamaan, 10 * 60 * 1000);
setInterval(hapusFotoLama, 60 * 60 * 1000);

startBot();

module.exports = { getSockAktif: () => sockAktif };