import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Check, ArrowLeft, ArrowRight } from 'lucide-react'

export default function RegisterStep1() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [apellidos, setApellidos] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const has8Chars = password.length >= 8
  const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/role') // los pasos 2–4 del proyecto anterior (rescate, datos médicos) se quitaron
  }

  return (
    <div className="auth-split-container">
      {/* Lado izquierdo Hero Navy (Página 2 del PDF) */}
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
            Únete a la <br />
            tripulación de TEPEXA
          </h2>

          <p style={{
            color: 'rgba(255, 255, 255, 0.75)',
            fontSize: '1.05rem',
            maxWidth: 380,
            lineHeight: 1.6
          }}>
            Crea tu cuenta y elige si exploras como estudiante o planificas como astronauta.
          </p>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className="stepper-bars">
              <div className="step-bar active" />
              <div className="step-bar" />
            </div>
            <span className="label-caps" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              PASO 1 DE 2
            </span>
          </div>
        </div>
      </div>

      {/* Lado derecho: Tarjeta flotante blanca */}
      <div className="auth-main-content">
        <div className="auth-card-box">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#F4F7FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <img src="/logo-tepexa.png" alt="Icon" style={{ width: 24, height: 'auto' }} />
            </div>
            <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
              <ArrowLeft size={13} /> VOLVER AL INICIO
            </Link>
          </div>

          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-navy)', marginBottom: 4 }}>
            Crear cuenta
          </h3>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 13, marginBottom: '1.75rem' }}>
            Comienza tu registro de seguridad en TEPEXA
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">NOMBRE</label>
                <input
                  type="text"
                  className="input-field no-icon"
                  placeholder="Tu nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">APELLIDOS</label>
                <input
                  type="text"
                  className="input-field no-icon"
                  placeholder="Tus apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">CORREO ELECTRÓNICO</label>
              <input
                type="email"
                className="input-field no-icon"
                placeholder="ejemplo@tepexa.space"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">CONTRASEÑA</label>
              <input
                type="password"
                className="input-field no-icon"
                placeholder="Crea una contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Requisitos de seguridad (idéntico al PDF pág 2) */}
            <div style={{
              background: '#F4F7FE',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: '1.25rem'
            }}>
              <span className="label-caps" style={{ fontSize: 10, display: 'block', marginBottom: 8, color: 'var(--color-text-muted)' }}>
                REQUISITOS DE SEGURIDAD:
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: has8Chars ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: has8Chars ? 'var(--color-success)' : '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Check size={10} />
                  </div>
                  <span>Mínimo 8 caracteres</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasUpperLower ? 'var(--color-success)' : 'var(--color-text-muted)' }}>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: hasUpperLower ? 'var(--color-success)' : '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Check size={10} />
                  </div>
                  <span>Incluye mayúsculas y minúsculas</span>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">CONFIRMAR CONTRASEÑA</label>
              <input
                type="password"
                className="input-field no-icon"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15, borderRadius: 12 }}>
              Siguiente paso <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              ¿Ya tienes una cuenta?{' '}
            </span>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--color-navy)', fontWeight: 700 }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

