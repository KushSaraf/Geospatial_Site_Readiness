/* LocateIQ v3 — Theme */
const Theme = (() => {
  let cur = 'dark';
  function apply(t) {
    cur = t;
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('liq-theme', t);
    const tog = document.getElementById('themeToggle');
    if (tog) {
      tog.classList.toggle('dark', t === 'dark');
      tog.querySelector('.th-thumb').textContent = t === 'dark' ? '🌙' : '☀️';
    }
    if (window.MapMod?.map) {
      MapMod.map.setOptions({ styles: t === 'dark' ? MAP_DARK : MAP_LIGHT });
    }
  }
  function toggle() { apply(cur === 'dark' ? 'light' : 'dark'); }
  function init()   { apply(localStorage.getItem('liq-theme') || 'dark'); }
  function get()    { return cur; }
  return { init, toggle, apply, get };
})();
