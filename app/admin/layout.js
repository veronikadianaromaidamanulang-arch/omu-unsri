'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminLayout({ children }) {
  const [admin, setAdmin] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('user');

    if (!stored) {
      router.push('/login');
      return;
    }

    try {
      const u = JSON.parse(stored);

      if (u.role !== 'admin') {
        router.push('/login');
        return;
      }

      setAdmin(u);
    } catch {
      localStorage.removeItem('user');
      router.push('/login');
    }
  }, [router]);

  function logout() {
    localStorage.removeItem('user');
    router.push('/login');
  }

  if (!admin) return null;

  const menu = [
    {
      href: '/admin/verifikasi',
      label: 'Verifikasi',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
    },
    {
      href: '/admin/order',
      label: 'Order',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="17" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      ),
    },
    {
      href: '/admin/driver',
      label: 'Driver',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6" />
        </svg>
      ),
    },
    {
      href: '/admin/statistik',
      label: 'Statistik',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 19V5" />
          <path d="M4 19h17" />
          <path d="M8 16v-5" />
          <path d="M12 16V7" />
          <path d="M16 16v-8" />
          <path d="M20 16V4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">O</div>

          <div>
            <div className="brand-name">Omu Unsri</div>
            <div className="brand-subtitle">Admin Dashboard</div>
          </div>
        </div>

        <div className="menu-label">MENU UTAMA</div>

        <nav className="sidebar-menu">
          {menu.map((item) => {
            const active = pathname === item.href;

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`menu-item ${active ? 'active' : ''}`}
              >
                <span className="menu-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="admin-profile">
            <div className="avatar">
              {(admin.nama || 'A').charAt(0).toUpperCase()}
            </div>

            <div className="admin-info">
              <strong>{admin.nama || 'Administrator'}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button className="logout-button" onClick={logout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M21 19V5a2 2 0 00-2-2h-6" />
            </svg>
            Keluar
          </button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div>
            <div className="page-title">Dashboard Admin</div>
            <div className="page-description">
              Kelola operasional Omu Unsri
            </div>
          </div>

          <div className="topbar-right">
            <div className="status">
              <span className="status-dot" />
              Sistem aktif
            </div>

            <div className="top-avatar">
              {(admin.nama || 'A').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="content">
          {children}
        </main>
      </section>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .admin-shell {
          min-height: 100vh;
          display: flex;
          background: #f7f8fa;
          color: #18181b;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .sidebar {
          position: fixed;
          inset: 0 auto 0 0;
          width: 250px;
          background: #ffffff;
          border-right: 1px solid #eceef0;
          display: flex;
          flex-direction: column;
          padding: 24px 16px 18px;
          z-index: 20;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 4px 9px 28px;
        }

        .brand-mark {
          width: 38px;
          height: 38px;
          border-radius: 11px;
          background: #00b14f;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          font-weight: 800;
        }

        .brand-name {
          font-size: 15px;
          font-weight: 750;
          letter-spacing: -0.2px;
        }

        .brand-subtitle {
          margin-top: 2px;
          font-size: 11px;
          color: #9a9ca1;
        }

        .menu-label {
          padding: 0 10px 9px;
          color: #a1a3a8;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .menu-item {
          width: 100%;
          height: 46px;
          padding: 0 12px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 0;
          border-radius: 11px;
          background: transparent;
          color: #71747a;
          font-size: 13px;
          font-weight: 550;
          text-align: left;
          cursor: pointer;
          transition: 0.15s ease;
        }

        .menu-item:hover {
          background: #f5f7f6;
          color: #242629;
        }

        .menu-item.active {
          background: #eaf8f0;
          color: #00a94f;
          font-weight: 700;
        }

        .menu-icon {
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .menu-icon :global(svg) {
          width: 19px;
          height: 19px;
        }

        .sidebar-bottom {
          margin-top: auto;
          border-top: 1px solid #f0f1f2;
          padding-top: 16px;
        }

        .admin-profile {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 7px 14px;
        }

        .avatar,
        .top-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          background: #e9f8ef;
          color: #00a94f;
          font-weight: 750;
        }

        .avatar {
          width: 34px;
          height: 34px;
          font-size: 13px;
        }

        .admin-info {
          min-width: 0;
          display: flex;
          flex-direction: column;
        }

        .admin-info strong {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
        }

        .admin-info span {
          margin-top: 2px;
          font-size: 10px;
          color: #999ca1;
        }

        .logout-button {
          width: 100%;
          height: 40px;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 10px;
          border: 0;
          background: transparent;
          color: #777a80;
          border-radius: 9px;
          cursor: pointer;
          font-size: 12px;
        }

        .logout-button:hover {
          background: #f5f5f5;
          color: #222;
        }

        .logout-button :global(svg) {
          width: 18px;
          height: 18px;
        }

        .main-area {
          width: calc(100% - 250px);
          margin-left: 250px;
          min-height: 100vh;
        }

        .topbar {
          height: 76px;
          padding: 0 34px;
          background: #ffffff;
          border-bottom: 1px solid #eceef0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .page-title {
          font-size: 17px;
          font-weight: 750;
          letter-spacing: -0.3px;
        }

        .page-description {
          margin-top: 3px;
          color: #9a9ca1;
          font-size: 11px;
        }

        .topbar-right {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 7px;
          color: #73767b;
          font-size: 11px;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #00b14f;
          box-shadow: 0 0 0 3px #e7f8ee;
        }

        .top-avatar {
          width: 35px;
          height: 35px;
          font-size: 12px;
        }

        .content {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 28px 34px 50px;
        }

        @media (max-width: 800px) {
          .sidebar {
            width: 72px;
            padding: 20px 10px;
          }

          .brand {
            justify-content: center;
            padding-left: 0;
            padding-right: 0;
          }

          .brand > div:last-child,
          .menu-label,
          .menu-item span:last-child,
          .admin-info,
          .logout-button {
            display: none;
          }

          .menu-item {
            justify-content: center;
            padding: 0;
          }

          .admin-profile {
            justify-content: center;
            padding-left: 0;
            padding-right: 0;
          }

          .main-area {
            width: calc(100% - 72px);
            margin-left: 72px;
          }

          .topbar {
            padding: 0 20px;
          }

          .content {
            padding: 22px 18px 40px;
          }

          .status {
            display: none;
          }
        }

        @media (max-width: 500px) {
          .sidebar {
            position: fixed;
            top: auto;
            right: 0;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 64px;
            padding: 5px 8px;
            border-right: 0;
            border-top: 1px solid #eceef0;
            flex-direction: row;
            align-items: center;
          }

          .brand,
          .sidebar-bottom {
            display: none;
          }

          .sidebar-menu {
            width: 100%;
            flex-direction: row;
            justify-content: space-around;
          }

          .menu-item {
            width: auto;
            height: 52px;
            flex: 1;
            justify-content: center;
          }

          .menu-item span:last-child {
            display: block;
            font-size: 9px;
          }

          .main-area {
            width: 100%;
            margin-left: 0;
            padding-bottom: 64px;
          }

          .topbar {
            height: 68px;
            padding: 0 16px;
          }

          .page-title {
            font-size: 15px;
          }

          .content {
            padding: 18px 14px 30px;
          }
        }
      `}</style>
    </div>
  );
}