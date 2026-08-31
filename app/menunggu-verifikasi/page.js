'use client';

import { useRouter } from 'next/navigation';

export default function MenungguVerifikasi() {
  const nomorAdminWA = '6285179821611';
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        fontFamily: 'Inter, Arial, sans-serif',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          width: '100%',
          maxWidth: '380px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          ⏳
        </div>

        <h2 style={{ marginTop: 0 }}>
          Menunggu Verifikasi
        </h2>

        <p
          style={{
            color: '#666',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
        >
          Akun kamu sedang diperiksa oleh admin. Kamu akan bisa login setelah
          akun disetujui.
        </p>

        {/* HUBUNGI ADMIN */}
        <a
          href={`https://wa.me/${nomorAdminWA}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            marginTop: '20px',
            padding: '12px 24px',
            background: '#25D366',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            fontWeight: '600',
          }}
        >
          Hubungi Admin
        </a>

        {/* KEMBALI KE LOGIN */}
        <button
          onClick={() => router.push('/login')}
          style={{
            width: '100%',
            marginTop: '10px',
            padding: '12px 24px',
            background: 'white',
            color: '#555',
            border: '1px solid #ddd',
            borderRadius: '10px',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          Kembali ke Login
        </button>
      </div>
    </div>
  );
}