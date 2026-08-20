<svelte:head>
  <title>About — Studio</title>
  <meta name="description" content="Learn about Studio — our team, values, and approach to creative work." />
</svelte:head>

<section class="about section">
  <div class="container" style="max-width: 48rem;">
    <h1 class="about__title">About Studio</h1>
    <p class="about__lead">We're a small, focused team of designers, developers, and strategists who believe great work comes from deep collaboration and relentless attention to detail.</p>

    <div class="about__values">
      {#each [
        { icon: '🎯', title: 'Purpose-Driven', desc: 'Every project starts with understanding why. We dig deep to find the story that connects your brand to your audience.' },
        { icon: '🔬', title: 'Obsessive Craft', desc: 'We sweat the details that most people never notice — because those details are what separate good from extraordinary.' },
        { icon: '🤝', title: 'True Partners', desc: 'We don\'t just take briefs. We embed with your team, challenge assumptions, and care about outcomes as much as you do.' },
      ] as v}
        <div class="about__value">
          <span class="about__icon">{v.icon}</span>
          <h3>{v.title}</h3>
          <p>{v.desc}</p>
        </div>
      {/each}
    </div>

    <div class="about__team">
      <h2>Our Team</h2>
      <div class="about__team-grid">
        {#each [
          { name: 'Alex Rivera', role: 'Creative Director', emoji: 'A', color: '#e11d48' },
          { name: 'Jordan Kim', role: 'Lead Designer', emoji: 'J', color: '#6366f1' },
          { name: 'Sam Chen', role: 'Senior Developer', emoji: 'S', color: '#22c55e' },
          { name: 'Morgan Ellis', role: 'Brand Strategist', emoji: 'M', color: '#f59e0b' },
        ] as member}
          <div class="team-card">
            <div class="team-card__avatar" style="background: {member.color}">{member.emoji}</div>
            <div class="team-card__name">{member.name}</div>
            <div class="team-card__role">{member.role}</div>
          </div>
        {/each}
      </div>
    </div>

    <div class="about__stats">
      <div class="about__stat"><strong>12+</strong><span>Years in business</span></div>
      <div class="about__stat"><strong>200+</strong><span>Projects delivered</span></div>
      <div class="about__stat"><strong>50+</strong><span>Happy clients</span></div>
      <div class="about__stat"><strong>15</strong><span>Awards won</span></div>
    </div>
  </div>
</section>

<style>
  .about__title { font-size: clamp(2rem, 1.5rem + 2.5vw, 3rem); margin-bottom: 1.5rem; }
  .about__lead { font-size: 1.125rem; color: var(--text-secondary); line-height: 1.8; margin-bottom: 3rem; }
  .about__values { display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1.5rem; margin-bottom: 3rem; }
  .about__value { padding: 1.5rem; border-radius: var(--radius-xl); border: 1px solid var(--border); background: var(--bg); }
  .about__icon { font-size: 2rem; display: block; margin-bottom: 0.75rem; }
  .about__value h3 { font-size: 1rem; margin-bottom: 0.5rem; }
  .about__value p { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.7; }
  .about__team { margin-bottom: 3rem; }
  .about__team h2 { font-size: 1.5rem; margin-bottom: 1.5rem; }
  .about__team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr)); gap: 1.5rem; }
  .team-card { text-align: center; padding: 1.5rem; border-radius: var(--radius-xl); border: 1px solid var(--border); background: var(--bg); }
  .team-card__avatar { width: 64px; height: 64px; border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.5rem; font-weight: 700; margin: 0 auto 0.75rem; }
  .team-card__name { font-weight: 600; font-size: 0.9375rem; }
  .team-card__role { font-size: 0.8125rem; color: var(--text-muted); margin-top: 0.25rem; }
  .about__stats { display: flex; justify-content: center; gap: 3rem; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-xl); text-align: center; flex-wrap: wrap; }
  .about__stat strong { display: block; font-size: 1.75rem; font-weight: 800; }
  .about__stat span { font-size: 0.8125rem; color: var(--text-secondary); }
</style>
