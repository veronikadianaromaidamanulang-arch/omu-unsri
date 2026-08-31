'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function LoginPage() {
  const [mode, setMode] = useState('login'); // 'login' atau 'daftar'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [noHp, setNoHp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: user, error: err } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password) // sementara, belum di-hash
      .maybeSingle();

    setLoading(false);

    if (!user) {
      setError('Username atau password salah.');
      return;
    }

    if (user.role === 'driver' && user.status_akun !== 'aktif') {
      router.push('/menunggu-verifikasi');
      return;
    }

    localStorage.setItem('user', JSON.stringify(user));

    if (user.role === 'admin') {
      router.push('/admin');
    } else {
      router.push('/driver');
    }
  }

  async function handleDaftar(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error: err } = await supabase.from('users').insert({
      nama,
      username,
      no_hp: noHp,
      password_hash: password, // sementara, belum di-hash
      role: 'driver',
      status_akun: 'pending',
    });

    setLoading(false);

    if (err) {
      setError('Gagal daftar: ' + err.message);
      return;
    }

    router.push('/menunggu-verifikasi');
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      fontFamily: 'Inter, Arial, sans-serif',
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '16px',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        width: '100%',
        maxWidth: '380px',
      }}>
        <h2 style={{ marginTop: 0, textAlign: 'center' }}>Omu Unsri</h2>

        <div style={{ display: 'flex', marginBottom: '20px', borderBottom: '1px solid #eee' }}>
          <button
            onClick={() => setMode('login')}
            style={{
              flex: 1, padding: '10px', border: 'none', background: 'none',
              fontWeight: mode === 'login' ? '700' : '400',
              borderBottom: mode === 'login' ? '2px solid #4361ee' : 'none',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
          <button
            onClick={() => setMode('daftar')}
            style={{
              flex: 1, padding: '10px', border: 'none', background: 'none',
              fontWeight: mode === 'daftar' ? '700' : '400',
              borderBottom: mode === 'daftar' ? '2px solid #4361ee' : 'none',
              cursor: 'pointer',
            }}
          >
            Daftar Driver
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleDaftar}>
          {mode === 'daftar' && (
            <>
              <input
                type="text" placeholder="Nama lengkap" value={nama}
                onChange={(e) => setNama(e.target.value)} required
                style={inputStyle}
              />
              <input
                type="text" placeholder="No. HP" value={noHp}
                onChange={(e) => setNoHp(e.target.value)} required
                style={inputStyle}
              />
            </>
          )}
          <input
            type="text" placeholder="Username" value={username}
            onChange={(e) => setUsername(e.target.value)} required
            style={inputStyle}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} required
            style={inputStyle}
          />

          {error && <p style={{ color: '#d63031', fontSize: '14px' }}>{error}</p>}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Memproses...' : mode === 'login' ? 'Masuk' : 'Daftar'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  border: '1.5px solid #e0e0e0', fontSize: '15px', marginBottom: '12px',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

const buttonStyle = {
  width: '100%', padding: '12px', border: 'none', borderRadius: '10px',
  background: '#4361ee', color: 'white', fontSize: '15px', fontWeight: '600',
  cursor: 'pointer',
};