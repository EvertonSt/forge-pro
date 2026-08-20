<script>
  let formState = $state('idle');
  let formData = $state({ name: '', email: '', company: '', budget: '', message: '' });
  let errors = $state({});

  function validate() {
    const e = {};
    if (!formData.name.trim()) e.name = 'Required';
    if (!formData.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) e.email = 'Invalid email';
    if (!formData.message.trim()) e.message = 'Required';
    errors = e;
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev) {
    ev.preventDefault();
    if (!validate()) return;
    formState = 'submitting';
    setTimeout(() => { 
      formState = 'success'; 
      window.showToast?.('Message sent! We\'ll get back to you soon.', 'success', 4000);
    }, 1500);
  }
</script>

<svelte:head>
  <title>Contact — Studio</title>
  <meta name="description" content="Get in touch with Studio. We'd love to hear about your project." />
</svelte:head>

<section class="contact section">
  <div class="container" style="max-width: 40rem;">
    <h1 class="contact__title">Let's Work Together</h1>
    <p class="contact__lead">Tell us about your project and we'll get back to you within 24 hours.</p>

    {#if formState === 'success'}
      <div class="contact__success">
        <div class="contact__success-icon">✓</div>
        <h2>Thank you!</h2>
        <p>We've received your message and will be in touch soon.</p>
      </div>
    {:else}
      <form class="contact__form" onsubmit={handleSubmit}>
        <div class="contact__row">
          <div class="contact__field">
            <label for="name">Name *</label>
            <input id="name" class="input" type="text" bind:value={formData.name} placeholder="Jane Smith" />
            {#if errors.name}<span class="contact__error">{errors.name}</span>{/if}
          </div>
          <div class="contact__field">
            <label for="email">Email *</label>
            <input id="email" class="input" type="email" bind:value={formData.email} placeholder="jane@company.com" />
            {#if errors.email}<span class="contact__error">{errors.email}</span>{/if}
          </div>
        </div>
        <div class="contact__row">
          <div class="contact__field">
            <label for="company">Company</label>
            <input id="company" class="input" type="text" bind:value={formData.company} placeholder="Acme Inc." />
          </div>
          <div class="contact__field">
            <label for="budget">Budget Range</label>
            <select id="budget" class="input" bind:value={formData.budget}>
              <option value="">Select...</option>
              <option value="10-25k">$10k–$25k</option>
              <option value="25-50k">$25k–$50k</option>
              <option value="50-100k">$50k–$100k</option>
              <option value="100k+">$100k+</option>
            </select>
          </div>
        </div>
        <div class="contact__field">
          <label for="message">Project Details *</label>
          <textarea id="message" class="input" rows="5" bind:value={formData.message} placeholder="Tell us about your project, goals, and timeline..."></textarea>
          {#if errors.message}<span class="contact__error">{errors.message}</span>{/if}
        </div>
        <button type="submit" class="btn btn--primary btn--lg" style="width: 100%;" disabled={formState === 'submitting'}>
          {formState === 'submitting' ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    {/if}

    <div class="contact__info">
      <div class="contact__info-item">
        <strong>Email</strong>
        <span>hello@studio.agency</span>
      </div>
      <div class="contact__info-item">
        <strong>Location</strong>
        <span>New York, NY</span>
      </div>
      <div class="contact__info-item">
        <strong>Availability</strong>
        <span>Open for Q2 2026 projects</span>
      </div>
    </div>
  </div>
</section>

<style>
  .contact__title { font-size: clamp(2rem, 1.5rem + 2.5vw, 3rem); margin-bottom: 1rem; }
  .contact__lead { font-size: 1.125rem; color: var(--text-secondary); margin-bottom: 2rem; }
  .contact__form { display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 3rem; }
  .contact__row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  .contact__field { display: flex; flex-direction: column; gap: 0.375rem; }
  .contact__field label { font-size: 0.8125rem; font-weight: 600; }
  .contact__error { font-size: 0.75rem; color: var(--danger); }
  .contact__success { text-align: center; padding: 3rem 0; }
  .contact__success-icon { width: 64px; height: 64px; border-radius: 50%; background: var(--accent-light); color: var(--accent); font-size: 2rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; }
  .contact__success h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
  .contact__success p { color: var(--text-secondary); }
  .contact__info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-xl); }
  .contact__info-item strong { display: block; font-size: 0.8125rem; margin-bottom: 0.25rem; }
  .contact__info-item span { font-size: 0.875rem; color: var(--text-secondary); }
  @media (max-width: 640px) {
    .contact__row { grid-template-columns: 1fr; }
    .contact__info { grid-template-columns: 1fr; }
  }
</style>
