export function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {/* Overhead light — subtle warm glow from top center, suggests professional studio lighting */}
      <div
        className="absolute"
        style={{
          top: '-20%',
          left: '20%',
          right: '20%',
          height: '60%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.025) 0%, transparent 65%)',
          filter: 'blur(20px)',
        }}
      />
      {/* Subtle accent warmth — top left, very muted */}
      <div
        className="absolute animate-float"
        style={{
          top: '-10%',
          left: '-5%',
          width: 500,
          height: 500,
          background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.028) 0%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(60px)',
        }}
      />
      {/* Edge vignette — darkens corners for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />
      {/* Extremely subtle grid — just enough to show structure */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />
    </div>
  );
}
