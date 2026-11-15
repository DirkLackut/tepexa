import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  Map,
  Compass,
  Route,
  Globe,
  FileText,
  BarChart2,
  User,
  LogOut,
  Sparkles
} from 'lucide-react'

export default function Sidebar() {
  return (
    <aside className="dash-sidebar" aria-label="Navegación principal">
      {/* Brand Header con logo TEPEXA */}
      <div style={{
        padding: '1.5rem 1.25rem 1.25rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: 10,
          padding: '4px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <img src="/logo-tepexa.png" alt="TEPEXA" style={{ height: 32, width: 'auto' }} />
        </div>
        <div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '0.04em', color: '#FFFFFF', lineHeight: 1.1 }}>
            TEPEXA
          </div>
          <div className="label-caps" style={{ fontSize: 9, color: 'var(--color-accent-gold)', letterSpacing: '0.12em' }}>
            UNIDAD DE CONTROL Y RESCATE
          </div>
        </div>
      </div>

      {/* Menú de Navegación */}
      <nav style={{ padding: '1rem 0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="label-caps" style={{ padding: '8px 12px 4px', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
          OPERACIONES
        </div>

        <NavLink
          to="/app"
          end
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <AlertTriangle size={16} />
          <span>Incidentes Activos</span>
        </NavLink>

        <NavLink
          to="/app/radar"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <Map size={16} />
          <span>Vista de Mapa / Radar</span>
        </NavLink>

        <NavLink
          to="/app/explore"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <Compass size={16} />
          <span>Cráter Jezero (2D)</span>
        </NavLink>

        <div className="label-caps" style={{ padding: '16px 12px 4px', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
          PLANIFICACIÓN & EVA
        </div>

        <NavLink
          to="/app/plan"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <Route size={16} />
          <span>Planificar Rutas EVA</span>
        </NavLink>

        <NavLink
          to="/app/simulate"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <Globe size={16} />
          <span>Simulador 3D</span>
        </NavLink>

        <NavLink
          to="/app/results"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <FileText size={16} />
          <span>Informe de Misión</span>
        </NavLink>

        <div className="label-caps" style={{ padding: '16px 12px 4px', fontSize: 10, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em' }}>
          CENTRO DE MANDO
        </div>

        <NavLink
          to="/app/global"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <BarChart2 size={16} />
          <span>Situación Global</span>
        </NavLink>

        <NavLink
          to="/app/profile"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <User size={16} />
          <span>Perfil & Wearable</span>
        </NavLink>

        <NavLink
          to="/app/medusae"
          style={({ isActive }) => ({
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.7)',
            background: isActive ? 'var(--color-primary)' : 'transparent',
            textDecoration: 'none',
            transition: 'all 0.2s ease'
          })}
        >
          <Sparkles size={16} />
          <span>Misión Medusae Fossae</span>
        </NavLink>
      </nav>

      {/* Bloque inferior: Red de comunicación y Usuario (idéntico al PDF pág 13 y 14) */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>
        {/* Red de comunicación */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          borderRadius: 10,
          padding: '10px 12px',
          border: '1px solid rgba(255, 255, 255, 0.06)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span className="label-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
              SEÑAL LORAWAN
            </span>
            <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: 12 }}>
              <span style={{ width: 2, height: 4, background: 'var(--color-accent-gold)', borderRadius: 1 }} />
              <span style={{ width: 2, height: 8, background: 'var(--color-accent-gold)', borderRadius: 1 }} />
              <span style={{ width: 2, height: 12, background: 'var(--color-accent-gold)', borderRadius: 1 }} />
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>
            Sincronizado: hace 2m
          </div>
        </div>

        {/* Usuario logueado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden'
            }}>
              <img src="/logo-tepexa.png" alt="Admin" style={{ width: 24, height: 'auto' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>Admin Central</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>Base Jezero</div>
            </div>
          </div>
          <NavLink to="/login" title="Cerrar sesión" style={{ color: 'rgba(255,255,255,0.5)' }}>
            <LogOut size={16} />
          </NavLink>
        </div>
      </div>
    </aside>
  )
}
