import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => {
      navigate('/login')
    }, 2500)
  }

  return (
    <div className="auth-split-container">
      {/* Lado izquierdo Hero Navy (Página 6 del PDF) */}
      <div className="auth-sidebar-hero">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: 12,
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
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
            Recupera el acceso a <br />
            tu espacio seguro
          </h2>

          <p style={{
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: '1.05rem',
            maxWidth: 380,
            lineHeight: 1.6
          }}>
            Te ayudamos a recuperar el acceso a tu cuenta de TEPEXA.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: 'var(--color-accent-gold)' }}>🛡️</span>
            <span className="label-caps" style={{ color: 'var(--color-accent-gold)', letterSpacing: '0.12em' }}>
              PROTOCOLO DE RECUPERACIÓN
            </span>
          </div>
        </div>
      </div>

      {/* Lado derecho: Tarjeta flotante con fondo blanco */}
      <div className="auth-main-content">
        <div className="auth-card-box">
          <div style={{ marginBottom: '1.5rem' }}>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              <ArrowLeft size={13} /> VOLVER AL INICIO DE SESIÓN
            </Link>
          </div>

          <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: 6 }}>
            ¿Olvidaste tu contraseña?
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: '2rem' }}>
            Introduce tu correo electrónico y te enviaremos instrucciones para restablecerla.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
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

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12, marginBottom: '1.5rem' }}>
              {sent ? 'Instrucciones enviadas ✓' : 'Solicitar recuperación'}
            </button>
          </form>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            fontSize: 12,
            color: 'var(--color-text-muted)'
          }}>
            <ShieldCheck size={14} />
            <span>Encriptación de extremo a extremo</span>
          </div>
        </div>
      </div>
    </div>
  )
}

