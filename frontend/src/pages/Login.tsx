import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useLang } from '../shared/hooks/useLang'

export default function Login() {
  const { t } = useLang()
  const navigate = useNavigate()
  const [email, setEmail] = useState('astronauta@tepexa.space')
  const [password, setPassword] = useState('••••••••')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/role')
  }

  return (
    <div className="auth-split-container">
      {/* Lado izquierdo Hero Navy (como en la pág 1 del PDF) */}
      <div className="auth-sidebar-hero">
        <div>
          {/* Logo del proyecto */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <img src="/logo-tepexa.png" alt="TEPEXA Logo" style={{ height: 42, width: 'auto', objectFit: 'contain' }} />
            </div>
          </div>

          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.15,
            marginBottom: '1.25rem',
            letterSpacing: '-0.02em'
          }}>
            Explore the <br />
            Unknown
          </h2>

          <p style={{
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: '1.05rem',
            maxWidth: 380,
            lineHeight: 1.6
          }}>
            {t({ es: 'Datos reales de NASA para explorar Jezero y planificar una caminata en Marte.', en: 'Real NASA data to explore Jezero and plan a walk on Mars.' })}
          </p>
        </div>

        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1.5rem'
          }}>
            <span style={{
              width: 32,
              height: 2,
              backgroundColor: 'var(--color-primary)'
            }} />
            <span className="label-caps" style={{ color: 'rgba(255, 255, 255, 0.6)', letterSpacing: '0.12em' }}>
              NASA SPACE APPS CHALLENGE 2026
            </span>
          </div>
        </div>
      </div>

      {/* Lado derecho: Tarjeta flotante con fondo blanco */}
      <div className="auth-main-content">
        <div className="auth-card-box">
          {/* Header de la tarjeta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.75rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#F4F7FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src="/logo-tepexa.png" alt="Icon" style={{ width: 28, height: 'auto' }} />
            </div>
            <span className="pill" style={{ background: '#F4F7FE', color: '#1B254B', fontSize: 11 }}>
              V1.0
            </span>
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: 6 }}>
            Bienvenido de nuevo
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: '2rem' }}>
            Accede a tu espacio seguro de TEPEXA
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">CORREO ELECTRÓNICO</label>
              <div className="input-wrapper">
                <span className="input-icon"><Mail size={16} /></span>
                <input
                  type="email"
                  className="input-field"
                  placeholder="ejemplo@tepexa.space"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="form-label" style={{ marginBottom: 0 }}>CONTRASEÑA</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--color-accent-gold)', fontWeight: 600 }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="input-wrapper">
                <span className="input-icon"><Lock size={16} /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 14,
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.25rem 0 1.75rem' }}>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--color-primary)' }}
              />
              <label htmlFor="remember" style={{ fontSize: 13, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                Mantener sesión iniciada
              </label>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}>
              Iniciar sesión
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              ¿Todavía no tienes una cuenta?{' '}
            </span>
            <Link to="/register-step-1" style={{ fontSize: 13, color: 'var(--color-accent-gold)', fontWeight: 700 }}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

