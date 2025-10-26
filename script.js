// script.js - All-in-One interactions, mascot, animations, PWA-ready localStorage app

// --- DOM refs
const incomeInput = document.getElementById("income");
const spentInput = document.getElementById("spent");
const saveBtn = document.getElementById("saveEntry");
const entriesTableBody = document.querySelector("#entriesTable tbody");
const clearBtn = document.getElementById("clearAll");
const exportCsvBtn = document.getElementById("exportCsv");
const summaryDiv = document.getElementById("summary");
const ctx = document.getElementById("progressChart")?.getContext("2d");
const quoteText = document.getElementById("quoteText");
const quoteAuthor = document.getElementById("quoteAuthor");
const themeBtn = document.getElementById("themeBtn");
const mascotEl = document.getElementById("mascot");
const encourageModal = document.getElementById("encourageModal");
const closeModal = document.getElementById("closeModal");
const modalOk = document.getElementById("modalOk");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");

let entries = JSON.parse(localStorage.getItem("entries")) || [];
let chart = null;

// --- Quotes
const quotes = [
  "Discipline is the bridge between goals and accomplishment.",
  "Motivation is what gets you started. Habit is what keeps you going.",
  "Learn how to be happy with what you have while you pursue all that you want.",
  "Don’t wish it were easier, wish you were better.",
  "If you don’t design your own life plan, chances are you’ll fall into someone else’s plan.",
  "Success is nothing more than a few simple disciplines, practiced every day.",
  "Either you run the day, or the day runs you.",
  "Happiness is not something you postpone for the future; it is something you design for the present.",
  "You cannot change your destination overnight, but you can change your direction overnight.",
  "Formal education will make you a living; self-education will make you a fortune."
];

function getQuoteOfTheDay(){
  const today = new Date().toISOString().split("T")[0];
  const saved = JSON.parse(localStorage.getItem("quoteOfTheDay"));
  if(saved && saved.date === today) return saved.text;
  const q = quotes[Math.floor(Math.random()*quotes.length)];
  localStorage.setItem("quoteOfTheDay", JSON.stringify({ date: today, text: q }));
  return q;
}
function showDailyQuote(){
  quoteText.textContent = `"${getQuoteOfTheDay()}"`;
  quoteAuthor.textContent = "— Jim Rohn";
}

// --- Theme
function loadTheme(){
  const t = localStorage.getItem("theme");
  if(t === "dark"){ document.body.classList.add("dark"); themeBtn.textContent = "☀️ Light Mode"; }
  else themeBtn.textContent = "🌙 Dark Mode";
}
function toggleTheme(){
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// --- Chart update
function updateChart(){
  if(!ctx) return;
  const labels = entries.map(e => e.date);
  const spentData = entries.map(e => e.spent);
  const allowedData = entries.map(e => +(e.income * 0.7).toFixed(2));
  const barColors = entries.map(e => e.spent <= e.income * 0.7 ? '#2ecc71' : '#ff6b6b');

  if(chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Spent', data: spentData, backgroundColor: barColors, borderRadius:6 },
        { label: 'Allowed (70%)', data: allowedData, type:'line', borderColor:'#6c8cff', backgroundColor:'#6c8cff33', tension:0.3, pointRadius:3, borderWidth:2 }
      ]
    },
    options: {
      responsive:true,
      maintainAspectRatio:false,
      plugins:{ legend:{ position:'bottom', labels:{ color:'#cfe8ff' } } },
      scales:{ y:{ beginAtZero:true, title:{ display:true, text:'Amount', color:'#9fb8db' }, ticks:{ color:'#cfe8ff' } }, x:{ ticks:{ color:'#cfe8ff' } } }
    }
  });
}

// --- Render entries
function renderEntries(){
  entriesTableBody.innerHTML = "";
  let goodCount = 0;
  entries.forEach(entry => {
    const allowed = entry.income * 0.7;
    const within = entry.spent <= allowed;
    if(within) goodCount++;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${entry.date}</td>
      <td>$${entry.income.toFixed(2)}</td>
      <td>$${entry.spent.toFixed(2)}</td>
      <td>$${allowed.toFixed(2)}</td>
      <td class="${within ? 'good' : 'bad'}">${within ? 'Within Limit' : 'Over Limit'}</td>
    `;
    entriesTableBody.appendChild(tr);
  });

  const rate = entries.length ? ((goodCount / entries.length) * 100).toFixed(1) : 0;
  summaryDiv.innerHTML = `<h3>Your Discipline Score: ${rate}% 💪</h3><p class="muted">${rate >=70 ? "Great — keep it up!" : "Focus — small wins add up."}</p>`;

  updateChart();
  if(window.gsap) gsap.from(summaryDiv, { y: 6, opacity: 0, duration: 0.6, ease: "power2.out" });
}

// --- Save entry
function saveEntry(){
  const income = parseFloat(incomeInput.value);
  const spent = parseFloat(spentInput.value);
  if(isNaN(income) || isNaN(spent) || income <= 0 || spent < 0){
    alert("Please enter valid income and spent amounts.");
    return;
  }

  const entry = { date: new Date().toLocaleDateString(), income, spent };
  entries.push(entry);
  localStorage.setItem("entries", JSON.stringify(entries));

  // GSAP micro interaction
  if(window.gsap) gsap.fromTo(saveBtn, { scale: 0.96 }, { scale: 1, duration: 0.26, ease: "elastic.out(1,0.6)" });

  // Mascot reaction & confetti if within 70%
  const within = spent <= income * 0.7;
  mascotReact(within);

  if(within && window.confetti){
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.25 } });
  }

  incomeInput.value = "";
  spentInput.value = "";
  renderEntries();
}

// --- Clear all
function clearAll(){
  if(confirm("Clear all saved entries? This cannot be undone.")){
    localStorage.removeItem("entries");
    entries = [];
    renderEntries();
  }
}

// --- Export CSV
function exportCSV(){
  if(!entries.length){ alert("No entries to export."); return; }
  const rows = [["Date","Income","Spent","Allowed70","Status"]];
  entries.forEach(e => {
    const allowed = (e.income * 0.7).toFixed(2);
    const status = e.spent <= e.income * 0.7 ? "Within Limit" : "Over Limit";
    rows.push([e.date, e.income.toFixed(2), e.spent.toFixed(2), allowed, status]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `7030-entries-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Mascot reactions
function mascotReact(within){
  // scale + rotate + show modal if within
  if(window.gsap){
    const svg = mascotEl.querySelector("svg");
    gsap.fromTo(svg, { rotation: 0, scale: 0.95 }, { rotation: within ? 360 : 8, scale: 1, duration: 0.8, ease: "back.out(1.2)" });
  }
  // show encouragement modal when within
  if(within){
    showModal("Nice job! 🎉", "You kept your spending within 70% — that builds real discipline.");
  } else {
    // small nudge tooltip via badge
    const badge = mascotEl.querySelector(".mascot-badge");
    if(badge){
      const old = badge.textContent;
      badge.textContent = "Try again";
      setTimeout(()=> badge.textContent = old, 1600);
    }
  }
}

// --- Modal
function showModal(title, body){
  modalTitle.textContent = title;
  modalBody.textContent = body;
  encourageModal.setAttribute("aria-hidden", "false");
  if(window.gsap) gsap.from(".modal-content", { y: 20, opacity: 0, duration: 0.45, ease: "power3.out" });
}
function hideModal(){ encourageModal.setAttribute("aria-hidden", "true"); }

// --- Orb parallax
(function orbParallax(){
  const orbs = document.querySelectorAll('.orb');
  document.addEventListener('mousemove', (e) => {
    const w = window.innerWidth, h = window.innerHeight;
    const nx = (e.clientX / w - 0.5) * 2; // -1..1
    const ny = (e.clientY / h - 0.5) * 2;
    orbs.forEach((o, i) => {
      const depth = (i+1) * 6;
      const tx = nx * depth;
      const ty = ny * depth;
      o.style.transform = `translate(${tx}px, ${ty}px)`;
    });
  });
})();

// --- Mascot click handlers
mascotEl.addEventListener('click', () => {
  // play a little waggle
  if(window.gsap){
    const svg = mascotEl.querySelector("svg");
    gsap.fromTo(svg, { x: -2 }, { x: 2, duration: 0.08, yoyo: true, repeat: 4, ease: "sine.inOut" });
    // show random quote on click
    const q = quotes[Math.floor(Math.random()*quotes.length)];
    showModal("Motivation", q);
  }
});
mascotEl.addEventListener('keypress', (e) => { if(e.key === 'Enter' || e.key === ' ') mascotEl.click(); });

// modal buttons
closeModal?.addEventListener('click', hideModal);
modalOk?.addEventListener('click', hideModal);

// --- Init / events
saveBtn.addEventListener('click', saveEntry);
clearBtn.addEventListener('click', clearAll);
exportCsvBtn.addEventListener('click', exportCSV);
themeBtn.addEventListener('click', toggleTheme);

// keyboard accessibility: Enter on save fields
[ incomeInput, spentInput ].forEach(el => {
  el.addEventListener('keydown', (e) => { if(e.key === 'Enter') saveEntry(); });
});

// load
loadTheme();
showDailyQuote();
renderEntries();

// GSAP entry animation
if(window.gsap){
  gsap.from(".glass", { y: 12, opacity: 0, duration: 0.8, stagger: 0.06, ease: "power3.out" });
  gsap.from(".logo", { scale: 0.9, opacity: 0, duration: 0.6, ease: "back.out(1.2)" });
}

// Responsive canvas height
function resizeChartCanvas(){
  const canvasParent = document.querySelector('.hero-right');
  if(canvasParent && ctx && chart){
    const h = Math.max(220, canvasParent.clientHeight - 30);
    ctx.canvas.style.height = h + 'px';
    chart.resize();
  }
}
window.addEventListener('resize', () => { if(chart) chart.resize(); });

// Accessibility: announce PWA install prompt suggestion (small hint)
if ('serviceWorker' in navigator) {
  // Slight timeout so user isn't bombarded immediately
  setTimeout(()=> {
    const hint = document.createElement('div');
    hint.style.position = 'fixed'; hint.style.left='12px'; hint.style.bottom='12px'; hint.style.zIndex=60;
    hint.style.padding='8px 12px'; hint.style.borderRadius='12px'; hint.style.background='linear-gradient(90deg,var(--accent1),var(--accent2))';
    hint.style.color='#04121a'; hint.style.fontWeight='800'; hint.style.boxShadow='0 8px 30px rgba(2,6,23,0.3)';
    hint.textContent = 'Tip: Add to Home Screen for quick access';
    document.body.appendChild(hint);
    setTimeout(()=> hint.remove(), 5000);
  }, 2200);
}


