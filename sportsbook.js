const sportsbookConfig = window.BIG_SCORE_CONFIG;
let sportsbookEvents = [];

async function sportsbookGet(path) {
  if (!sportsbookConfig?.SUPABASE_URL || !sportsbookConfig?.SUPABASE_PUBLISHABLE_KEY) return [];
  const response = await fetch(`${sportsbookConfig.SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: sportsbookConfig.SUPABASE_PUBLISHABLE_KEY }
  });
  if (!response.ok) throw new Error(`Supabase request failed: ${response.status}`);
  return response.json();
}

function signedOdds(value) {
  if (value == null) return '—';
  const n = Number(value);
  return n > 0 ? `+${n}` : String(n);
}

function when(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? 'Upcoming' : new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(d);
}

function icon(sport) {
  return ({ football: '🏈', basketball: '🏀', baseball: '⚾', soccer: '⚽', hockey: '🏒' })[sport] || '●';
}

function renderEvents(filter = 'all') {
  const host = document.querySelector('[data-event-list]');
  if (!host) return;
  const rows = filter === 'all' ? sportsbookEvents : sportsbookEvents.filter(e => e.sport === filter);
  document.querySelector('[data-event-count]').textContent = String(rows.length);

  if (!rows.length) {
    host.innerHTML = '<div class="empty-state">No featured events in this sport yet.</div>';
    return;
  }

  host.innerHTML = rows.map(event => {
    const selections = event.markets.flatMap(m => m.selections || []).slice(0, 4);
    return `<article class="event-card">
      <div class="event-head">
        <div><b>${icon(event.sport)} ${event.league}</b><small>${when(event.starts_at)}</small></div>
        <div class="event-status">${event.status.toUpperCase()}</div>
      </div>
      <div class="event-teams">
        <div class="teams">${event.away_team} @ ${event.home_team}<span>${event.markets.length ? event.markets[0].name : 'Featured matchup'}</span></div>
        <div class="market-row">
          ${selections.length ? selections.map(s => `<button class="odd-btn"><span>${s.label}${s.line == null ? '' : ` ${s.line}`}</span><strong>${signedOdds(s.american_odds)}</strong></button>`).join('') : '<button class="odd-btn"><span>Markets</span><strong>SOON</strong></button>'}
        </div>
      </div>
    </article>`;
  }).join('');
}

async function loadSportsbook() {
  try {
    const events = await sportsbookGet('sportsbook_events?select=id,sport,league,home_team,away_team,starts_at,status,sportsbook_markets(id,name,market_type,sportsbook_selections(label,american_odds,line,status))&featured=eq.true&order=starts_at.asc');
    sportsbookEvents = (events || []).map(e => ({
      ...e,
      markets: (e.sportsbook_markets || []).map(m => ({ ...m, selections: m.sportsbook_selections || [] }))
    }));
    renderEvents('all');
  } catch (error) {
    console.error(error);
    const host = document.querySelector('[data-event-list]');
    if (host) host.innerHTML = '<div class="empty-state">Sportsbook feed is temporarily unavailable.</div>';
  }
}

document.querySelectorAll('[data-sport]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-sport]').forEach(x => x.classList.remove('active'));
    btn.classList.add('active');
    renderEvents(btn.dataset.sport);
  });
});

loadSportsbook();
