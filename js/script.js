// Navigation toggle
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.querySelector('.main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', mainNav.classList.contains('open'));
  });

  // Close menu when clicking a link
  mainNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.site-header')) {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Filter functionality for galleries/listings
document.querySelectorAll('[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const value = btn.dataset.filter;
    document.querySelectorAll('[data-category]').forEach(card => {
      card.style.display = (value === 'all' || card.dataset.category === value) ? '' : 'none';
    });
  });
});

// Search functionality
const search = document.querySelector('[data-search]');
if (search) {
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    document.querySelectorAll('[data-search-item]').forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });
}

// Demo form submission (for testing locally before backend is ready)
const form = document.querySelector('[data-demo-form]');
if (form) {
  form.addEventListener('submit', e => {
    e.preventDefault();
    const id = 'WRS-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    try {
      localStorage.setItem('wrs_demo_submission', JSON.stringify({
        id,
        created: new Date().toISOString()
      }));
    } catch (err) {
      console.warn('localStorage not available');
    }
    const toast = document.querySelector('.toast');
    if (toast) {
      toast.textContent = `Demo submission saved. Reference ID: ${id}`;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 4500);
    }
  });
}

// External form link handling - show loading state
document.querySelectorAll('a[href^="https://forms.gle"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    const originalText = link.textContent;
    link.textContent = 'Opening form...';
    link.style.pointerEvents = 'none';
    setTimeout(() => {
      window.open(href, '_blank', 'noopener,noreferrer');
      link.textContent = originalText;
      link.style.pointerEvents = 'auto';
    }, 300);
  });
});

// Load registration config from backend API (when available)
async function loadRegistrationConfig() {
  try {
    const res = await fetch('/api/forms', { credentials: 'include' });
    if (res.ok) {
      const config = await res.json();
      // Update form URLs from backend if available
      const symposiumLink = document.getElementById('symposium-link');
      const challengeLink = document.getElementById('challenge-link');
      if (symposiumLink && config.symposium?.url) {
        symposiumLink.href = config.symposium.url;
      }
      if (challengeLink && config.challenge?.url) {
        challengeLink.href = config.challenge.url;
      }
    }
  } catch (e) {
    // Backend not running - keep default URLs
    console.log('Registration config not available - using default URLs');
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  loadRegistrationConfig();
});

// Load teams from API or show empty state
async function loadTeams() {
  const loading = document.getElementById('teams-loading');
  const empty = document.getElementById('teams-empty');
  const grid = document.getElementById('teams-grid');
  const error = document.getElementById('teams-error');

  if (!loading) return; // Not on teams page

  try {
    const res = await fetch('/api/teams', { credentials: 'include' });
    if (!res.ok) throw new Error('API unavailable');

    const data = await res.json();
    loading.style.display = 'none';

    if (!data.teams || data.teams.length === 0) {
      empty.style.display = 'block';
      return;
    }

    // Render teams
    grid.innerHTML = data.teams.map(t => `
      <article class="team-card">
        <div class="team-avatar">${(t.teamName || 'T').substring(0, 2).toUpperCase()}</div>
        <small>${t.category || 'Participant'} · ${t.status || 'Registered'}</small>
        <h3>${t.teamName || 'Unnamed Team'}</h3>
        <p><strong>Institution:</strong> ${t.institution || 'Not specified'}</p>
        <p><strong>Project:</strong> ${t.projectTitle || 'Pending'}</p>
        <div class="tag-row">
          ${(t.areas || []).slice(0, 3).map(a => `<span class="tag">${a}</span>`).join('')}
        </div>
      </article>
    `).join('');
    grid.style.display = 'grid';
  } catch (e) {
    loading.style.display = 'none';
    error.style.display = 'block';
  }
}

// Run on teams page if element exists
if (document.getElementById('teams-loading')) {
  document.addEventListener('DOMContentLoaded', loadTeams);
}

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
    }
  });
});
