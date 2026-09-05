const casinoConfig = window.BIG_SCORE_CONFIG;
let casinoGames = [];
let activeCategory = 'all';

async function casinoGet(path) {
  if (!casinoConfig?.SUPABASE_URL || !casinoConfig?.SUPABASE_PUBLISHABLE_KEY) return [];
  const response = await fetch(`${casinoConfig.SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: casinoConfig.SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${casinoConfig.SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json();
}

function gameArt(game) {
  const art = {
    slots: '777 ◆',
    blackjack: 'A♠ J♣',
    roulette: '◉ 17',
    poker: 'A♠ K♠ Q♠'
  };
  return art[game.slug] || '♛';
}

function renderCasino() {
  const host = document.querySelector('[data-casino-library]');
  if (!host) return;
  const q = (document.querySelector('[data-game-search]')?.value || '').trim().toLowerCase();
  const rows = casinoGames.filter(game => {
    const categoryOk = activeCategory === 'all' || game.category === activeCategory;
    const searchOk = !q || `${game.name} ${game.tagline || ''}`.toLowerCase().includes(q);
    return categoryOk && searchOk;
  });
  document.querySelector('[data-game-count]').textContent = String(rows.length);
  if (!rows.length) {
    host.innerHTML = '<div class="empty-state">No games match this filter.</div>';
    return;
  }
  host.innerHTML = rows.map(game => `
    <article class="library-card">
      <div class="library-art">${gameArt(game)}</div>
      <div class="library-copy">
        <h3>${game.name}</h3>
        <p>${game.tagline || 'The Big Score casino experience.'}</p>
        <button data-game="${game.slug}">PLAY ${game.name.toUpperCase()}</button>
      </div>
    </article>`).join('');
}

async function loadCasino() {
  try {
    casinoGames = await casinoGet('casino_games?select=slug,name,category,tagline,artwork_url,featured,enabled,sort_order&enabled=eq.true&order=sort_order.asc');
    renderCasino();
  } catch (error) {
    console.error(error);
    const host = document.querySelector('[data-casino-library]');
    if (host) host.innerHTML = '<div class="empty-state">Casino library is temporarily unavailable.</div>';
  }
}

document.querySelectorAll('[data-category]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-category]').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    activeCategory = btn.dataset.category;
    renderCasino();
  });
});

document.querySelector('[data-game-search]')?.addEventListener('input', renderCasino);

loadCasino();
