'use client'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#090910',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative purple glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 700,
        background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        borderRadius: '50%',
      }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 480 }}>
        {/* Logo / Branding */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img
            src="/logo.png"
            alt="Anoni Logo"
            style={{
              width: 80,
              height: 80,
              objectFit: 'contain',
              margin: '0 auto 16px',
              borderRadius: 18,
              boxShadow: '0 0 30px rgba(124,58,237,0.5)',
            }}
          />
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: '-0.5px', margin: 0 }}>
            Anon<span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>i</span>
          </h1>
          <p style={{ color: '#6b6b8a', fontSize: 13, marginTop: 6, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            Be You. Anonymously.
          </p>
        </div>

        {children}

        <p style={{ textAlign: 'center', color: '#3d3d5c', fontSize: 11, marginTop: 24 }}>
          By continuing, you agree to Anoni&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
