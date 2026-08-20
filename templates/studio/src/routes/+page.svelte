<script>
  const projects = [
    { title: 'Luminary Rebrand', category: 'Branding', year: '2026', emoji: '🎨', color: '#e11d48' },
    { title: 'Nova Fintech App', category: 'Product Design', year: '2025', emoji: '📱', color: '#6366f1' },
    { title: 'Verdant E-commerce', category: 'Web Development', year: '2025', emoji: '🌿', color: '#22c55e' },
    { title: 'Pulse Analytics', category: 'Dashboard Design', year: '2026', emoji: '📊', color: '#f59e0b' },
    { title: 'Wavelength Music', category: 'Mobile App', year: '2025', emoji: '🎵', color: '#8b5cf6' },
    { title: 'Atlas Architecture', category: 'Brand Identity', year: '2026', emoji: '🏛️', color: '#3b82f6' },
  ];

  const services = [
    { title: 'Brand Identity', desc: 'Logos, visual systems, and brand guidelines that tell your story.', icon: '🎨' },
    { title: 'Web Design', desc: 'Beautiful, responsive websites that convert visitors into customers.', icon: '💻' },
    { title: 'Product Design', desc: 'User-centered interfaces for web and mobile applications.', icon: '📱' },
    { title: 'Motion Design', desc: 'Animated experiences that bring your brand to life.', icon: '✨' },
  ];

  let visible = $state(false);
</script>

<svelte:head>
  <title>Studio — Creative Agency</title>
  <meta name="description" content="Studio — A creative agency crafting digital experiences that move people." />
  <meta property="og:title" content="Studio — Creative Agency" />
  <meta property="og:description" content="A creative agency crafting digital experiences that move people." />
</svelte:head>

<!-- Hero -->
<section class="hero section">
  <div class="container">
    <div class="hero__content">
      <span class="hero__tag">✦ Creative Agency</span>
      <h1 class="hero__title">We craft digital experiences that <em>move</em> people</h1>
      <p class="hero__subtitle">Studio is a design-led creative agency specializing in brand identity, web design, and product experiences for forward-thinking companies.</p>
      <div class="hero__actions">
        <a href="/contact" class="btn btn--primary btn--lg">Start a Project</a>
        <a href="#work" class="btn btn--secondary btn--lg">View Our Work</a>
      </div>
    </div>
  </div>
</section>

<!-- Work -->
<section class="work section" id="work">
  <div class="container">
    <h2 class="section__title">Selected Work</h2>
    <div class="work__grid">
      {#each projects as project, i}
        <article class="work__card" style="animation-delay: {i * 0.1}s">
          <div class="work__card-img" style="background: {project.color}15">
            <span class="work__card-emoji">{project.emoji}</span>
          </div>
          <div class="work__card-info">
            <span class="work__card-category">{project.category}</span>
            <h3 class="work__card-title">{project.title}</h3>
            <span class="work__card-year">{project.year}</span>
          </div>
        </article>
      {/each}
    </div>
  </div>
</section>

<!-- Services -->
<section class="services section">
  <div class="container">
    <h2 class="section__title">What We Do</h2>
    <div class="services__grid">
      {#each services as service}
        <div class="services__card">
          <span class="services__icon">{service.icon}</span>
          <h3 class="services__title">{service.title}</h3>
          <p class="services__desc">{service.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta section">
  <div class="container cta__inner">
    <h2 class="cta__title">Let's create something extraordinary</h2>
    <p class="cta__subtitle">Ready to elevate your brand? We'd love to hear about your project.</p>
    <a href="/contact" class="btn btn--primary btn--lg">Get in Touch →</a>
  </div>
</section>

<style>
  .section__title { font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2rem); margin-bottom: 2rem; }

  /* Hero */
  .hero { padding-top: clamp(5rem, 4rem + 5vw, 9rem); padding-bottom: clamp(3rem, 2rem + 4vw, 5rem); text-align: center; }
  .hero__tag { display: inline-block; font-size: 0.8125rem; font-weight: 600; color: var(--accent); background: var(--accent-light); padding: 4px 14px; border-radius: 999px; margin-bottom: 1.5rem; }
  .hero__title { font-size: clamp(2.5rem, 2rem + 3vw, 4rem); font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1.25rem; line-height: 1.1; }
  .hero__title em { font-style: italic; color: var(--accent); }
  .hero__subtitle { font-size: 1.125rem; color: var(--text-secondary); max-width: 36rem; margin-inline: auto; margin-bottom: 2rem; line-height: 1.7; }
  .hero__actions { display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; }

  /* Work */
  .work__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr)); gap: 1.5rem; }
  .work__card { border-radius: var(--radius-xl); overflow: hidden; border: 1px solid var(--border); background: var(--bg); transition: all 0.3s var(--ease); cursor: pointer; }
  .work__card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
  .work__card-img { aspect-ratio: 16/10; display: flex; align-items: center; justify-content: center; }
  .work__card-emoji { font-size: 3rem; }
  .work__card-info { padding: 1.25rem; }
  .work__card-category { font-size: 0.6875rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent); }
  .work__card-title { font-size: 1.125rem; font-weight: 700; margin: 0.375rem 0; }
  .work__card-year { font-size: 0.8125rem; color: var(--text-muted); }

  /* Services */
  .services { background: var(--bg-secondary); }
  .services__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr)); gap: 1.5rem; }
  .services__card { padding: 2rem; border-radius: var(--radius-xl); border: 1px solid var(--border); background: var(--bg); transition: all 0.3s var(--ease); }
  .services__card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .services__icon { font-size: 2rem; display: block; margin-bottom: 1rem; }
  .services__title { font-size: 1.125rem; margin-bottom: 0.5rem; }
  .services__desc { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.7; }

  /* CTA */
  .cta { background: var(--stone-900); color: #fff; text-align: center; }
  [data-theme="dark"] .cta { background: var(--stone-800); }
  .cta__title { font-size: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem); margin-bottom: 1rem; }
  .cta__subtitle { font-size: 1.0625rem; opacity: 0.8; margin-bottom: 2rem; max-width: 30rem; margin-inline: auto; }
</style>
