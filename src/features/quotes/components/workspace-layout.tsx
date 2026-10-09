"use client";

import { useState, type ReactNode } from "react";
import { CircleHelp, FileText, Menu, MoreHorizontal, Settings2, UsersRound, X, ArrowRight } from "lucide-react";
import type { Screen } from "./workspace-types";

interface WorkspaceLayoutProps {
  userName: string;
  companyName: string;
  quoteCount: number;
  screen: Screen;
  notice: string;
  onNavigate: (screen: Screen) => void;
  onHelp: () => void;
  onDismissNotice: () => void;
  children: ReactNode;
}

const navigation = [
  { id: "quotes" as const, label: "Cotizaciones", icon: FileText },
  { id: "customers" as const, label: "Clientes", icon: UsersRound },
  { id: "settings" as const, label: "Configuración", icon: Settings2 },
];

const screenTitles: Record<Screen, string> = {
  quotes: "Cotizaciones",
  editor: "Nueva cotización",
  detail: "Detalle de cotización",
  customers: "Clientes",
  settings: "Configuración",
};

export function WorkspaceLayout({
  userName,
  companyName,
  quoteCount,
  screen,
  notice,
  onNavigate,
  onHelp,
  onDismissNotice,
  children,
}: WorkspaceLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connectionNoticeVisible, setConnectionNoticeVisible] = useState(true);

  function navigate(nextScreen: Screen) {
    onNavigate(nextScreen);
    setMobileMenuOpen(false);
  }

  return (
    <div className="app-frame">
      <aside className={`sidebar ${mobileMenuOpen ? "sidebar-open" : ""}`}>
        <button className="app-brand" onClick={() => navigate("quotes")} aria-label="Ir a cotizaciones">
          <span className="brand-symbol">T</span>
          <span>
            <strong>{companyName || "Configura tu empresa"}</strong>
            <small>COTIZADOR</small>
          </span>
        </button>
        <div className="sidebar-label">ESPACIO DE TRABAJO</div>
        <nav aria-label="Navegación principal" className="main-navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              className={`nav-link ${screen === id || (id === "quotes" && ["editor", "detail"].includes(screen)) ? "nav-link-active" : ""}`}
              key={id}
              onClick={() => navigate(id)}
            >
              <Icon size={18} strokeWidth={1.8} />
              {label}
              {id === "quotes" && <span className="nav-count">{quoteCount}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon"><CircleHelp size={17} /></span>
            <strong>?Necesitas ayuda?</strong>
            <span>Guía rápida para crear tu primera cotización.</span>
            <button onClick={onHelp}>Ver guía <ArrowRight size={14} /></button>
          </div>
          <button className="profile-button" onClick={() => navigate("settings")}>
            <span className="avatar">C</span>
            <span className="profile-copy"><strong>{userName}</strong><small>Usuario</small></span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      {mobileMenuOpen && <button className="mobile-scrim" aria-label="Cerrar menú" onClick={() => setMobileMenuOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" aria-label="Abrir menú" onClick={() => setMobileMenuOpen(true)}><Menu size={19} /></button>
          <div className="breadcrumbs"><span>Inicio</span><span className="breadcrumb-separator">/</span><strong>{screenTitles[screen]}</strong></div>
          <div className="topbar-right">
            <span className="environment-pill"><span /> MODO DE PRUEBA</span>
            <button className="avatar topbar-avatar" aria-label={`Perfil de ${userName}`}>{userName.slice(0, 2).toUpperCase()}</button>
          </div>
        </header>
        <main className="workspace-content">
          {connectionNoticeVisible && (
            <div className="prototype-alert">
              <span><CircleHelp size={16} /></span>
              <p><strong>Datos conectados.</strong> Los borradores, clientes y configuración de empresa se guardan en PostgreSQL.</p>
              <button aria-label="Cerrar aviso" onClick={() => setConnectionNoticeVisible(false)}><X size={16} /></button>
            </div>
          )}
          {notice && <div className="inline-notice" role="status"><span>{notice}</span><button aria-label="Cerrar mensaje" onClick={onDismissNotice}><X size={15} /></button></div>}
          {children}
        </main>
      </div>
    </div>
  );
}
