<svelte:head>
  <title>Services — Studio</title>
  <meta name="description" content="Studio services — brand identity, web design, product design, and motion design." />
</svelte:head>

<section class="services section">
  <div class="container" style="max-width: 48rem;">
    <h1 class="services__title">Our Services</h1>
    <p class="services__lead">We offer a focused set of services, each backed by deep expertise and a proven process refined over hundreds of projects.</p>

    <div class="services__list">
      {#each [
        { icon: '🎨', title: 'Brand Identity', desc: 'From naming to full visual systems — we create brands that stand out and endure.', deliverables: ['Logo & wordmark', 'Color palette', 'Typography system', 'Brand guidelines', 'Stationery design'] },
        { icon: '💻', title: 'Web Design & Development', desc: 'High-performance, beautifully designed websites that convert.', deliverables: ['Custom web design', 'Responsive development', 'CMS integration', 'SEO optimization', 'Analytics setup'] },
        { icon: '📱', title: 'Product Design', desc: 'User-centered design for web and mobile apps, from concept to launch.', deliverables: ['User research', 'Wireframing & prototyping', 'UI design', 'Design system', 'Developer handoff'] },
        { icon: '✨', title: 'Motion Design', desc: 'Animated experiences that bring your brand and product to life.', deliverables: ['Logo animation', 'UI micro-interactions', 'Explainer videos', 'Social media content', 'Lottie files'] },
      ] as service}
        <div class="service-card">
          <span class="service-card__icon">{service.icon}</span>
          <h2 class="service-card__title">{service.title}</h2>
          <p class="service-card__desc">{service.desc}</p>
          <h3 class="service-card__label">Deliverables</h3>
          <ul class="service-card__deliverables">
            {#each service.deliverables as d}
              <li>✓ {d}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>

    <div class="services__cta" style="text-align: center; margin-top: 3rem;">
      <p style="color: var(--text-secondary); margin-bottom: 1rem;">Ready to discuss your project?</p>
      <a href="/contact" class="btn btn--primary btn--lg">Get in Touch →</a>
    </div>
  </div>
</section>

<style>
  .services__title { font-size: clamp(2rem, 1.5rem + 2.5vw, 3rem); margin-bottom: 1.5rem; }
  .services__lead { font-size: 1.125rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 3rem; }
  .services__list { display: flex; flex-direction: column; gap: 2rem; }
  .service-card { padding: 2rem; border-radius: var(--radius-xl); border: 1px solid var(--border); background: var(--bg); }
  .service-card__icon { font-size: 2rem; display: block; margin-bottom: 1rem; }
  .service-card__title { font-size: 1.375rem; margin-bottom: 0.5rem; }
  .service-card__desc { font-size: 0.9375rem; color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.25rem; }
  .service-card__label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem; }
  .service-card__deliverables { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 0.375rem; }
  .service-card__deliverables li { font-size: 0.8125rem; color: var(--text-secondary); }
</style>
