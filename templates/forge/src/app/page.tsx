'use client';

import React from 'react';

/* ============================================================
   Forge — Apex Wellness Clinic Homepage
   ============================================================ */

const services = [
  { icon: '💆', title: 'Massage Therapy', desc: 'Deep tissue, Swedish, and sports massage from certified therapists.', duration: '60 min', price: '$85' },
  { icon: '🧘', title: 'Yoga & Meditation', desc: 'Private and group sessions for all levels, from beginners to advanced.', duration: '75 min', price: '$45' },
  { icon: '🥗', title: 'Nutrition Counseling', desc: 'Personalized meal plans and dietary guidance from registered dietitians.', duration: '45 min', price: '$120' },
  { icon: '🏥', title: 'Physical Therapy', desc: 'Evidence-based rehabilitation and pain management programs.', duration: '50 min', price: '$150' },
  { icon: '🧠', title: 'Mental Wellness', desc: 'Stress management, CBT, and mindfulness-based therapy sessions.', duration: '60 min', price: '$130' },
  { icon: '✨', title: 'Aesthetics', desc: 'Facial treatments, skin analysis, and rejuvenation therapies.', duration: '45 min', price: '$95' },
];

const testimonials = [
  { name: 'Maria G.', text: 'The massage therapy completely resolved my chronic back pain. The therapists here are truly world-class.', rating: 5 },
  { name: 'David L.', text: 'Apex changed my life. Their holistic approach to wellness addressed issues I didn\'t even know I had.', rating: 5 },
  { name: 'Priya S.', text: 'Beautiful space, incredibly professional staff. I recommend Apex to everyone I know.', rating: 5 },
];

const hours = [
  { day: 'Monday – Friday', time: '7:00 AM – 8:00 PM' },
  { day: 'Saturday', time: '8:00 AM – 6:00 PM' },
  { day: 'Sunday', time: '9:00 AM – 4:00 PM' },
];

const faqs = [
  { q: 'Do I need a referral?', a: 'No referral is needed for any of our services. You can book directly online or by calling us.' },
  { q: 'What insurance do you accept?', a: 'We accept most major insurance plans. Contact us with your provider details and we\'ll verify coverage before your visit.' },
  { q: 'Can I cancel or reschedule?', a: 'Yes — we ask for 24 hours notice for cancellations or rescheduling. You can manage bookings through your patient portal.' },
  { q: 'Is parking available?', a: 'Yes, we have free parking in our building\'s underground garage, plus street parking on Main St.' },
];

export default function Home() {
  const toggleTheme = () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('forge-theme', next);
  };

  return (
    <>
      {/* Nav */}
      <nav className="nav" role="navigation" aria-label="Main navigation">
        <div className="container nav__inner">
          <a href="/" className="nav__logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="8" fill="#22c55e"/><path d="M8 14l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Apex Wellness
          </a>
          <div className="nav__links">
            <a href="#services" className="nav__link">Services</a>
            <a href="#about" className="nav__link">About</a>
            <a href="#testimonials" className="nav__link">Reviews</a>
            <a href="#faq" className="nav__link">FAQ</a>
          </div>
          <div className="nav__actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">🌙</button>
            <a href="#booking" className="btn btn--primary btn--sm">Book Now</a>
          </div>
        </div>
      </nav>

      <main id="main">
        {/* Hero */}
        <section className="hero section" style={{ textAlign: 'center', paddingTop: 'clamp(5rem,4rem + 5vw,8rem)', paddingBottom: 'clamp(3rem,2rem + 4vw,5rem)' }}>
          <div className="container">
            <div className="badge" style={{ marginBottom: '1.5rem' }}>✦ Now Accepting New Patients</div>
            <h1 style={{ fontSize: 'clamp(2.5rem,2rem + 3vw,4rem)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '1.25rem', lineHeight: 1.1 }}>
              Your journey to<br/><span style={{ color: 'var(--accent)' }}>total wellness</span> starts here
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '32rem', marginInline: 'auto', marginBottom: '2rem', lineHeight: 1.7 }}>
              Apex Wellness Clinic offers premium health and wellness services — from massage therapy to mental wellness — in a calming, modern environment.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#booking" className="btn btn--primary btn--lg">Book an Appointment</a>
              <a href="#services" className="btn btn--secondary btn--lg">View Services</a>
            </div>
          </div>
        </section>

        {/* Services */}
        <section className="section" id="services" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container">
            <h2 style={{ fontSize: 'clamp(1.5rem,1.2rem + 1.5vw,2rem)', marginBottom: '0.5rem' }}>Our Services</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '32rem' }}>Comprehensive wellness services tailored to your needs.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '1.25rem' }}>
              {services.map(s => (
                <div key={s.title} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{s.icon}</span>
                  <h3 style={{ fontSize: '1.0625rem', marginBottom: '0.375rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem', flex: 1 }}>{s.desc}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{s.duration}</span>
                    <span style={{ fontWeight: 700, fontSize: '1rem' }}>{s.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About / Hours */}
        <section className="section" id="about">
          <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: 'clamp(1.5rem,1.2rem + 1.5vw,2rem)', marginBottom: '1rem' }}>About Apex Wellness</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1rem' }}>
                Founded in 2018, Apex Wellness Clinic has grown from a single massage therapy practice into a full-service wellness center. Our team of licensed professionals combines evidence-based practices with holistic approaches to deliver results that last.
              </p>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: '1.5rem' }}>
                We believe wellness is not a destination but a journey — and we&apos;re here to guide you every step of the way.
              </p>
              <div style={{ display: 'flex', gap: '2rem' }}>
                <div><strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>8+</strong><br/><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Years of service</span></div>
                <div><strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>5,000+</strong><br/><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Happy clients</span></div>
                <div><strong style={{ fontSize: '1.5rem', fontWeight: 800 }}>12</strong><br/><span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>Licensed therapists</span></div>
              </div>
            </div>
            <div className="card">
              <h3 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Business Hours</h3>
              {hours.map(h => (
                <div key={h.day} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.9375rem' }}>
                  <span>{h.day}</span><span style={{ fontWeight: 600 }}>{h.time}</span>
                </div>
              ))}
              <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--accent-light)', borderRadius: 'var(--radius-lg)' }}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--accent)', fontWeight: 600 }}>📍 123 Main Street, Suite 200, Wellness City, WC 10001</p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="section" id="testimonials" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container" style={{ maxWidth: '60rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,1.2rem + 1.5vw,2rem)', marginBottom: '2rem' }}>What Our Clients Say</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(18rem, 1fr))', gap: '1.25rem', textAlign: 'left' }}>
              {testimonials.map(t => (
                <div key={t.name} className="card">
                  <div style={{ color: '#f59e0b', marginBottom: '0.75rem' }}>{'★'.repeat(t.rating)}</div>
                  <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '1rem', fontStyle: 'italic' }}>&ldquo;{t.text}&rdquo;</p>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Widget */}
        <section className="section" id="booking">
          <div className="container" style={{ maxWidth: '40rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,1.2rem + 1.5vw,2rem)', marginBottom: '0.5rem' }}>Book Your Appointment</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Select a service, choose a date and time, and we&apos;ll confirm your booking.</p>
            <BookingWidget />
          </div>
        </section>

        {/* FAQ */}
        <section className="section" id="faq" style={{ background: 'var(--bg-secondary)' }}>
          <div className="container" style={{ maxWidth: '40rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,1.2rem + 1.5vw,2rem)', marginBottom: '2rem', textAlign: 'center' }}>Frequently Asked Questions</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {faqs.map((f, i) => (
                <details key={i} className="card" open={i === 0} style={{ padding: '1.25rem' }}>
                  <summary style={{ fontWeight: 600, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9375rem' }}>
                    {f.q}
                    <span style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>▾</span>
                  </summary>
                  <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="section" id="contact">
          <div className="container" style={{ maxWidth: '40rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem,1.2rem + 1.5vw,2rem)', marginBottom: '2rem', textAlign: 'center' }}>Get in Touch</h2>
            <div className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div><label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Name *</label><input className="input" placeholder="Jane Smith" /></div>
                <div><label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Email *</label><input className="input" type="email" placeholder="jane@email.com" /></div>
              </div>
              <div style={{ marginBottom: '1rem' }}><label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Message</label><textarea className="input" rows={4} placeholder="How can we help?" /></div>
              <button className="btn btn--primary" style={{ width: '100%' }} onClick={(e) => { (e.target as HTMLButtonElement).textContent = '✓ Message Sent'; setTimeout(() => { if (e.target) (e.target as HTMLButtonElement).textContent = 'Send Message'; }, 2000); }}>Send Message</button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '3rem 0 1.5rem', background: 'var(--bg-secondary)' }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>Apex Wellness</div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Premium health and wellness services in Wellness City.</p>
          </div>
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Services</h4>
            {['Massage Therapy', 'Yoga & Meditation', 'Nutrition', 'Physical Therapy'].map(s => <a key={s} href="#services" style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.25rem 0' }}>{s}</a>)}
          </div>
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Clinic</h4>
            {['About Us', 'Our Team', 'Careers', 'Contact'].map(s => <a key={s} href="#" style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.25rem 0' }}>{s}</a>)}
          </div>
          <div>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Legal</h4>
            {['Privacy Policy', 'Terms of Service', 'HIPAA Notice'].map(s => <a key={s} href="#" style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-secondary)', padding: '0.25rem 0' }}>{s}</a>)}
          </div>
        </div>
        <div className="container" style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          © 2026 Apex Wellness Clinic. All rights reserved.
        </div>
      </footer>
    </>
  );
}

/* Booking Widget — client component with mock state */
function BookingWidget() {
  const [step, setStep] = React.useState(1);
  const [service, setService] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [booked, setBooked] = React.useState(false);

  const serviceOptions = ['Massage Therapy — $85', 'Yoga & Meditation — $45', 'Nutrition Counseling — $120', 'Physical Therapy — $150', 'Mental Wellness — $130', 'Aesthetics — $95'];
  const timeSlots = ['9:00 AM', '10:30 AM', '12:00 PM', '1:30 PM', '3:00 PM', '4:30 PM'];

  const handleBook = () => {
    setBooked(true);
  };

  if (booked) {
    return (
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', color: '#22c55e', fontSize: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>✓</div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Booking Confirmed!</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>Your {service} appointment is booked for {date} at {time}. We&apos;ll send a confirmation email shortly.</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '2rem', textAlign: 'left' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
        {[1,2,3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= s ? 'var(--accent)' : 'var(--bg-tertiary)', color: step >= s ? '#fff' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>{s}</div>
            {s < 3 && <div style={{ width: 24, height: 2, background: step > s ? 'var(--accent)' : 'var(--border)', borderRadius: 1 }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', textAlign: 'center' }}>Choose a Service</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {serviceOptions.map(s => (
              <button key={s} onClick={() => { setService(s); setStep(2); }} style={{ padding: '0.875rem 1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', textAlign: 'left', fontSize: '0.9375rem', transition: 'all 0.15s', background: service === s ? 'var(--accent-light)' : 'var(--bg)' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', textAlign: 'center' }}>Select Date & Time</h3>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.375rem' }}>Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.5rem' }}>Available Times</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {timeSlots.map(t => (
                <button key={t} onClick={() => { setTime(t); setStep(3); }} style={{ padding: '0.625rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.8125rem', fontWeight: 500, transition: 'all 0.15s', background: time === t ? 'var(--accent-light)' : 'var(--bg)' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', textAlign: 'center' }}>Confirm Your Booking</h3>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Service</span><span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{service}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Date</span><span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{date}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Time</span><span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{time}</span></div>
          </div>
          <button className="btn btn--primary" style={{ width: '100%' }} onClick={handleBook}>Confirm Booking</button>
          <button className="btn btn--ghost" style={{ width: '100%', marginTop: '0.5rem', color: 'var(--text-secondary)' }} onClick={() => setStep(1)}>Start Over</button>
        </div>
      )}
    </div>
  );
}
