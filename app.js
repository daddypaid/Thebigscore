const menuButton = document.querySelector('.menu-button');
const sidebar = document.querySelector('.sidebar');

if (menuButton && sidebar) {
  menuButton.addEventListener('click', () => sidebar.classList.toggle('open'));
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 700 && sidebar) sidebar.classList.remove('open');
  });
});

document.querySelectorAll('button').forEach(btn => {
  if (btn.classList.contains('menu-button')) return;
  btn.addEventListener('click', () => {
    btn.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(.97)' }, { transform: 'scale(1)' }],
      { duration: 160 }
    );
  });
});

const cfg = window.BIG_SCORE_CONFIG;

async function supabaseGet(path) {
  if (!cfg?.SUPABASE_URL || !cfg?.SUPABASE_PUBLISHABLE_KEY) return null;
  const response = await fetch(`${cfg.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: cfg.SUPABASE_PUBLISHABLE_KEY }
  });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json();
}

function formatStart(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Upcoming';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(date);
}

function sportIcon(sport) {
  const icons = { football: '🏈', basketball: '🏀', baseball: '⚾', soccer: '⚽', hockey: '🏒' };
  return icons[String(sport).toLowerCase()] || '●';
}

async function hydrateHomeSportsbook() {
  const board = document.querySelector('[data-live-lines]');
  if (!board) return;
  try {
    const events = await supabaseGet('sportsbook_events?select=id,sport,league,home_team,away_team,starts_at,status&featured=eq.true&order=starts_at.asc&limit=4');
    if (!events?.length) return;
    board.innerHTML = events.map(event => `
      <div class="matchup">
        <div>
          <b>${sportIcon(event.sport)} ${event.away_team} @ ${event.home_team}</b>
          <small>${event.league} · ${formatStart(event.starts_at)}</small>
        </div>
        <div class="line"><span>${event.status === 'live' ? 'LIVE' : 'GAME'}</span><strong>VIEW</strong></div>
      </div>`).join('');
  } catch (error) {
    console.warn('Using sportsbook fallback content.', error);
  }
}

async function hydrateCasinoCards() {
  const grid = document.querySelector('[data-casino-grid]');
  if (!grid) return;
  try {
    const games = await supabaseGet('casino_games?select=slug,name,category,tagline&featured=eq.true&enabled=eq.true&order=sort_order.asc&limit=8');
    if (!games?.length) return;
    const art = {
      slots: '<div class="reels">777</div><div class="diamond">◆</div>',
      blackjack: '<div class="cards-art">A♠ &nbsp; J♣</div>',
      roulette: '<div class="roulette-wheel large"></div>',
      poker: '<div class="cards-art poker-hand">A♠ K♠ Q♠ J♥ 10♠</div>'
    };
    grid.innerHTML = games.map(game => `
      <article class="game-card ${game.slug}">
        <div class="game-art">${art[game.slug] || '<div class="reels">★</div>'}</div>
        <div class="game-info">
          <h3>${game.name.toUpperCase()}</h3>
          <p>${(game.tagline || 'THE BIG SCORE EXPERIENCE.').toUpperCase()}</p>
          <button data-game="${game.slug}">PLAY ${game.name.toUpperCase()} <span>›</span></button>
        </div>
      </article>`).join('');
  } catch (error) {
    console.warn('Using casino fallback content.', error);
  }
}

hydrateHomeSportsbook();
hydrateCasinoCards();
