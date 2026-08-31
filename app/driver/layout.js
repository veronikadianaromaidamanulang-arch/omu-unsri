'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DriverLayout({ children }) {
  const [driver, setDriver] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const stored = localStorage.getItem('user');

    if (!stored) {
      router.replace('/login');
      return;
    }

    try {
      const u = JSON.parse(stored);

      if (u.role !== 'driver') {
        router.replace('/login');
        return;
      }

      setDriver(u);
    } catch {
      localStorage.removeItem('user');
      router.replace('/login');
    }
  }, [router]);

  function logout() {
    localStorage.removeItem('user');
    router.replace('/login');
  }

  if (!driver) return null;

  const menus = [
    {
      href: '/driver/aktif',
      label: 'Aktif',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M5 4h14v16H5z" />
          <path d="M8 8h8M8 12h8M8 16h5" />
        </svg>
      ),
    },
    {
      href: '/driver/saya',
      label: 'Orderan',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M6 3h12v18H6z" />
          <path d="M9 7h6M9 11h6M9 15h4" />
        </svg>
      ),
    },
    {
      href: '/driver/statistik',
      label: 'Statistik',
      icon: (
        <svg viewBox="0 0 24 24">
          <path d="M4 20V10M10 20V5M16 20v-8M22 20H2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="driver-app">

      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="header-inner">

          <div className="brand">
            <div className="brand-logo">O</div>

            <div>
              <div className="brand-title">Omu Unsri</div>
              <div className="brand-subtitle">Driver</div>
            </div>
          </div>

          <button className="profile-button" onClick={logout}>
            <div className="profile-avatar">
              {driver.nama?.charAt(0)?.toUpperCase() || 'D'}
            </div>
          </button>

        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="content">

        <section className="welcome">
          <p>Selamat datang kembali</p>
          <h1>{driver.nama}</h1>
        </section>

        {/* STATUS */}
        <section className="status-card">

          <div className="status-left">
            <div className="status-indicator">
              <span />
            </div>

            <div>
              <div className="status-label">STATUS DRIVER</div>
              <div className="status-title">Siap menerima order</div>
            </div>
          </div>

          <div className="status-arrow">
            ›
          </div>

        </section>

        {/* PAGE CONTENT */}
        <div className="page-content">
          {children}
        </div>

      </main>

      {/* ================= BOTTOM NAV ================= */}
      <nav className="bottom-nav">
        <div className="bottom-nav-inner">

          {menus.map((menu) => {
            const active = pathname === menu.href;

            return (
              <button
                key={menu.href}
                onClick={() => router.push(menu.href)}
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  {menu.icon}
                </span>

                <span className="nav-label">
                  {menu.label}
                </span>
              </button>
            );
          })}

        </div>
      </nav>

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .driver-app {
          min-height: 100vh;
          background: #f7f8f9;
          color: #17191c;
          font-family:
            Inter,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          padding-bottom: 88px;
        }

        /* HEADER */

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,.96);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid #eceeef;
        }

        .header-inner {
          height: 68px;
          max-width: 640px;
          margin: auto;
          padding: 0 18px;

          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .brand-logo {
          width: 36px;
          height: 36px;

          border-radius: 10px;
          background: #00b14f;
          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 18px;
          font-weight: 800;
        }

        .brand-title {
          font-size: 15px;
          line-height: 18px;
          font-weight: 750;
          letter-spacing: -.2px;
        }

        .brand-subtitle {
          color: #92969b;
          font-size: 11px;
          margin-top: 1px;
        }

        .profile-button {
          border: 0;
          background: transparent;
          padding: 0;
          cursor: pointer;
        }

        .profile-avatar {
          width: 36px;
          height: 36px;

          border-radius: 50%;
          background: #e9f8ef;
          color: #00a94f;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 13px;
          font-weight: 750;
        }

        /* CONTENT */

        .content {
          max-width: 640px;
          margin: auto;
          padding: 22px 16px 30px;
        }

        .welcome {
          margin-bottom: 20px;
        }

        .welcome p {
          margin: 0 0 4px;
          color: #8b9095;
          font-size: 12px;
        }

        .welcome h1 {
          margin: 0;
          font-size: 24px;
          line-height: 30px;
          letter-spacing: -.6px;
          font-weight: 800;
        }

        /* STATUS CARD */

        .status-card {
          min-height: 88px;
          padding: 18px;

          background: white;
          border: 1px solid #ebedef;
          border-radius: 18px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          box-shadow:
            0 2px 8px rgba(0,0,0,.025);

          margin-bottom: 22px;
        }

        .status-left {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .status-indicator {
          width: 42px;
          height: 42px;

          border-radius: 13px;
          background: #eaf9f0;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-indicator span {
          width: 10px;
          height: 10px;
          background: #00b14f;
          border-radius: 50%;

          box-shadow: 0 0 0 5px rgba(0,177,79,.10);
        }

        .status-label {
          font-size: 9px;
          font-weight: 750;
          letter-spacing: .08em;
          color: #9a9ea3;
          margin-bottom: 3px;
        }

        .status-title {
          font-size: 14px;
          font-weight: 700;
          color: #202326;
        }

        .status-arrow {
          width: 28px;
          height: 28px;

          border-radius: 50%;
          background: #f5f6f7;

          display: flex;
          align-items: center;
          justify-content: center;

          color: #9a9da1;
          font-size: 20px;
        }

        /* PAGE */

        .page-content {
          width: 100%;
        }

        /* BOTTOM NAV */

        .bottom-nav {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 0;

          height: 76px;

          background: rgba(255,255,255,.97);
          backdrop-filter: blur(14px);

          border-top: 1px solid #e9ebed;

          z-index: 100;
        }

        .bottom-nav-inner {
          height: 100%;
          max-width: 640px;
          margin: auto;

          display: flex;
          align-items: stretch;
        }

        .nav-item {
          flex: 1;

          border: 0;
          background: transparent;

          color: #9b9fa4;

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 5px;

          cursor: pointer;
        }

        .nav-icon {
          width: 21px;
          height: 21px;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-icon :global(svg) {
          width: 20px;
          height: 20px;

          fill: none;
          stroke: currentColor;
          stroke-width: 1.7;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .nav-label {
          font-size: 10px;
          font-weight: 550;
        }

        .nav-item.active {
          color: #00b14f;
        }

        .nav-item.active .nav-label {
          font-weight: 750;
        }

        /* DESKTOP */

        @media (min-width: 768px) {

          .driver-app {
            padding-bottom: 30px;
          }

          .header-inner,
          .content {
            max-width: 760px;
          }

          .bottom-nav {
            position: fixed;
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            width: 430px;

            bottom: 18px;

            height: 64px;

            border: 1px solid #e7e9eb;
            border-radius: 18px;

            box-shadow:
              0 8px 30px rgba(0,0,0,.08);
          }

          .bottom-nav-inner {
            width: 100%;
          }
        }

      `}</style>

    </div>
  );
}