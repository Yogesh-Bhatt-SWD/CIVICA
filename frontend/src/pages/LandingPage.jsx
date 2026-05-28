import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Logo from '../components/Logo';

const FEATURES = [
  {
    icon: '',
    title: 'Authority Validation',
    desc: 'Government-grade verification protocols ensure that uploaded photos genuinely show civic issues before submission.',
    color: '#00d4aa',
    tag: 'Computer Vision',
  },
  {
    icon: '',
    title: 'Gravity Scoring',
    desc: 'Issues are automatically ranked by severity, upvotes, and time elapsed — prioritizing urgent needs.',
    color: '#f59e0b',
    tag: 'Priority Algorithm',
  },
  {
    icon: '',
    title: 'Map-Based Economy',
    desc: 'Pin issues on a geospatial layer. Auto-detect duplicates and merge reports to ensure data integrity.',
    color: '#3b82f6',
    tag: 'GIS Integration',
  },
  {
    icon: '',
    title: 'Authority Transparency',
    desc: 'Complete accountability chain. Track exactly who is resolving your report and when.',
    color: '#8b5cf6',
    tag: 'Accountability',
  },
];

const STATS = [
  { label: 'Smart Cities', target: 52, suffix: '+' },
  { label: 'Issues Resolved', target: 8400, suffix: '+' },
  { label: 'Active Citizens', target: 24000, suffix: '+' },
  { label: 'Avg Speed', target: 48, suffix: 'h' },
];

function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
          start += step;
          if (start >= target) { setCount(target); clearInterval(timer); }
          else setCount(start);
        }, 16);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

function StatCard({ label, target, suffix }) {
  const { count, ref } = useCountUp(target);
  return (
    <div ref={ref} className="glass-card" style={{ padding: '24px', textAlign: 'center', minWidth: 160 }}>
      <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)', letterSpacing: '-0.04em' }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const heroRef = useRef(null);
  const glowRef = useRef(null);

  const dashLink = user
    ? user.role === 'admin' ? '/admin' : user.role === 'authority' ? '/authority' : '/dashboard'
    : '/register';

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (glowRef.current && heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        glowRef.current.style.left = `${x}px`;
        glowRef.current.style.top = `${y}px`;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      <Navbar />

      {/* ── Hero section ── */}
      <section ref={heroRef} style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 24px 80px',
        position: 'relative',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        <div ref={glowRef} className="hero-glow" style={{ top: '50%', left: '50%' }} />
        
        {/* Animated Badge */}
        <div className="glass-card" style={{
          padding: '6px 16px', borderRadius: 999,
          fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)',
          letterSpacing: '0.06em', marginBottom: 32,
          animation: 'fadeInUp 0.6s ease',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: '1px solid rgba(0, 212, 170, 0.2)'
        }}>
          <span className="ai-pulse" style={{ width: 6, height: 6, background: 'var(--accent)', borderRadius: '50%' }} />
          THE FUTURE OF URBAN GOVERNANCE
        </div>

        <div style={{ position: 'relative', maxWidth: 1000 }}>
          <h1 style={{ 
            fontSize: 'clamp(3rem, 8vw, 5rem)', 
            fontWeight: 900, 
            letterSpacing: '-0.04em',
            margin: '0 0 24px',
            lineHeight: 0.95
          }}>
            Building <span className="gradient-text">Trust</span> Through <br />
            Architectural <span className="gradient-text">Accountability</span>
          </h1>
        </div>

        <p style={{
          maxWidth: 600, fontSize: '1.2rem', lineHeight: 1.6,
          color: 'var(--text-secondary)', margin: '0 auto 48px',
          animation: 'fadeInUp 0.7s ease 0.2s both',
        }}>
          Civica utilizes computer vision to validate urban issues in real-time. 
          A decentralized reporting network that holds authorities responsible.
        </p>

        {(!user || user.role === 'citizen') && (
          <div className="flex flex-col items-center gap-6 animate-stagger" style={{ animationDelay: '0.4s' }}>
            <Link 
              to={user ? '/dashboard' : '/register'} 
              className="btn btn-primary btn-lg shimmer"
              style={{ fontSize: '1.4rem', padding: '18px 48px', borderRadius: 14 }}
            >
              Report an Issue
            </Link>
            <p style={{ 
              maxWidth: 500, fontSize: '1rem', fontWeight: 500, 
              color: 'var(--text-secondary)', margin: '0 auto',
              opacity: 0.8
            }}>
              Report civic issues like potholes, garbage, and infrastructure damage in your area.
            </p>
          </div>
        )}

        {/* Scroll Indicator */}
        <div style={{ position: 'absolute', bottom: 40, animation: 'float 3s ease-in-out infinite' }}>
          <div style={{ width: 1, height: 60, background: 'linear-gradient(to bottom, var(--accent), transparent)' }} />
        </div>
      </section>

      {/* ── High-Trust Stats ── */}
      <section style={{ padding: '0 24px 80px' }}>
        <div className="grid-4" style={{ maxWidth: 1100, margin: '0 auto', gap: 20 }}>
          {STATS.map((s) => <StatCard key={s.label} {...s} />)}
        </div>
      </section>

      {/* ── Features Display ── */}
      <section style={{ padding: '100px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <div className="accent-line" style={{ margin: '0 auto 24px' }} />
          <h2 style={{ fontSize: '3rem', fontWeight: 800 }}>Engineered for <span className="gradient-text">Scalability</span></h2>
          <p style={{ maxWidth: 600, margin: '16px auto 0', fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
            Our infrastructure combines localized AI with robust geospatial mapping to eliminate spam and prioritize real human needs.
          </p>
        </div>

        <div className="grid-2" style={{ gap: 24 }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass-card" style={{ 
              padding: 40, 
              position: 'relative', 
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: -20, right: -20,
                fontSize: '8rem', opacity: 0.03, pointerEvents: 'none'
              }}>{f.icon}</div>
              
              <div className="flex items-center gap-4 mb-6">
                <div style={{
                  width: 50, height: 50,
                  background: f.color + '15',
                  border: `1px solid ${f.color}30`,
                  borderRadius: 12,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem',
                }}>
                  {f.icon}
                </div>
                <div>
                   <div style={{ fontSize: '0.65rem', fontWeight: 800, color: f.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{f.tag}</div>
                   <h3 style={{ fontSize: '1.5rem', margin: 0 }}>{f.title}</h3>
                </div>
              </div>
              
              <p style={{ fontSize: '1rem', lineHeight: 1.8, margin: 0, color: 'var(--text-secondary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Process Workflow ── */}
      <section style={{ padding: '100px 24px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid var(--border)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 60 }}>The <span className="gradient-text">Lifecycle</span> of a Report</h2>
          
          <div className="flex justify-between items-start gap-8" style={{ flexWrap: 'wrap' }}>
            {[
              { n: '01', title: 'Capture', desc: 'Secure image upload' },
              { n: '02', title: 'Verify', desc: 'Secure Validation' },
              { n: '03', title: 'Scoring', desc: 'Gravity-based ranking' },
              { n: '04', title: 'Resolve', desc: 'Authority intervention' }
            ].map((step, i) => (
              <div key={step.n} style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                <div style={{ 
                  fontSize: '3rem', 
                  fontWeight: 900, 
                  color: 'transparent', 
                  WebkitTextStroke: '1px rgba(255,255,255,0.1)',
                  marginBottom: 12
                }}>{step.n}</div>
                <h4 style={{ fontSize: '1.2rem', marginBottom: 8 }}>{step.title}</h4>
                <p style={{ fontSize: '0.875rem' }}>{step.desc}</p>
                {i < 3 && <div style={{ display: 'none' }} className="md:block" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final Call to Action ── */}
      <section style={{
        margin: '100px 24px',
        maxWidth: 1100,
        margin: '100px auto',
        borderRadius: 30,
        padding: '100px 40px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(0,212,170,0.1) 0%, rgba(59,130,246,0.1) 100%)',
        border: '1px solid rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -100, right: -100,
          width: 300, height: 300,
          background: 'radial-gradient(circle, rgba(0,212,170,0.1) 0%, transparent 70%)',
          borderRadius: '50%',
        }} />
        
        <h2 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: 20 }}>Reclaiming Our <span className="gradient-text">Cities</span></h2>
        <p style={{ marginBottom: 48, fontSize: '1.2rem', maxWidth: 600, margin: '0 auto 48px' }}>
          Join the network of thousands ensuring their infrastructure serves the people.
        </p>
        
        {(!user || user.role === 'citizen') && (
          <div className="flex justify-center gap-4">
             <Link 
               to={user ? '/dashboard' : '/register'} 
               className="btn btn-primary btn-lg shimmer"
               style={{ fontSize: '1.4rem', padding: '16px 40px', borderRadius: 12 }}
             >
               Report an Issue
             </Link>
          </div>
        )}
      </section>

      <footer style={{ 
        padding: '60px 24px 30px', 
        textAlign: 'center', 
        borderTop: '1px solid var(--border)', 
        color: 'var(--text-muted)', 
        fontSize: '0.85rem' 
      }}>
        <Logo size={120} className="logo-outer" style={{ opacity: 0.5, marginBottom: 20 }} />
        <div style={{ letterSpacing: '0.2em', fontWeight: 700, marginBottom: 12 }}>CIVICA</div>
        © 2026 Architectural Civic Governance Interface. All rights reserved.
      </footer>
    </div>
  );
}
