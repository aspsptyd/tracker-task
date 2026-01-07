// Small frontend module to manage tasks and sessions
async function api(path, opts = {}){
  const res = await fetch(path, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function fmtDate(d){
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleString();
}

function toLocalInputValue(iso){
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const pad = (n)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function secondsToHuman(sec){
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  return `${h}h ${m}m ${s}s`;
}

async function loadStats(){
  try {
    const stats = await api('/api/stats');
    document.getElementById('statTotalToday').textContent = stats.today.count;
    document.getElementById('statTotalDuration').textContent = stats.today.duration_readable;
    document.getElementById('statTotalWeek').textContent = stats.week.count;
    
    // Task Running is handled by client state
    const running = loadRunningFromStorage();
    document.getElementById('statTaskRunning').textContent = running ? '1' : '0';
  } catch(e) {
    console.error('Failed to load stats', e);
  }
}

async function loadTasks(){
  const tasks = await api('/api/tasks');
  const container = document.getElementById('tasks');
  container.innerHTML = '';

  tasks.forEach(t => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = t.id;
    card.innerHTML = `
      <div class="card-left">
        <div class="title">${t.title}</div>
        <div class="meta">${t.total_duration_readable} • ${t.sessions_count} session(s)</div>
      </div>
      <div class="actions">
        <div class="controls">
          <div class="timer pill" data-timer-id="${t.id}">00:00:00</div>
          <button class="startBtn" data-id="${t.id}">Start</button>
          <button class="stopBtn" data-id="${t.id}" style="display:none">Stop</button>
        </div>
        <div style="display:flex;gap:8px;margin-left:8px">
          <button data-id="${t.id}" class="view">View</button>
          <button data-id="${t.id}" class="edit">Edit</button>
          <button data-id="${t.id}" class="del">Delete</button>
        </div>
      </div>
    `;

    // attach handlers for view/edit/delete
    card.querySelector('.view').addEventListener('click', ()=> openDetail(t.id));
    card.querySelector('.edit').addEventListener('click', ()=> editTaskPrompt(t.id));
    card.querySelector('.del').addEventListener('click', ()=> deleteTaskConfirm(t.id));

    // start/stop handlers
    card.querySelector('.startBtn').addEventListener('click', ()=> startTimerFor(t.id));
    card.querySelector('.stopBtn').addEventListener('click', ()=> stopTimerFor(t.id));

    container.appendChild(card);
  });

  // Refresh UI according to running state
  refreshRunningUI();
  loadStats();
}

async function openDetail(taskId){
  const detail = await api(`/api/tasks/${taskId}`);
  const dlg = document.getElementById('detailDlg');
  dlg.innerHTML = '';
  const header = document.createElement('div');
  header.innerHTML = `<h3>${detail.task.title}</h3><p class="meta">${detail.task.description || ''}</p>`;
  dlg.appendChild(header);

  const info = document.createElement('div');
  const total = detail.sessions.reduce((a,b)=>a+b.duration,0);
  info.innerHTML = `<div class="pill">Total: ${secondsToHuman(total)}</div><div class="pill">Range: ${fmtDate(detail.sessions[0]?.start_time)} → ${fmtDate(detail.sessions[detail.sessions.length-1]?.end_time)}</div>`;
  dlg.appendChild(info);

  const sessionsWrap = document.createElement('div');
  sessionsWrap.className = 'sessions';
  detail.sessions.forEach(s => {
    const row = document.createElement('div');
    row.className = 'session-row';
    row.innerHTML = `
      <div>
        <div><strong>${fmtDate(s.start_time)}</strong> → <strong>${fmtDate(s.end_time)}</strong></div>
        <small>${secondsToHuman(s.duration)}</small>
      </div>
      <div style="display:flex;gap:8px">
        <button class="editSession" data-task="${detail.task.id}" data-id="${s.id}">Edit</button>
        <button class="delSession" data-id="${s.id}">Delete</button>
      </div>
    `;
    row.querySelector('.editSession').addEventListener('click', (e)=> openEditSession(detail.task.id, s));
    row.querySelector('.delSession').addEventListener('click', ()=> deleteSessionConfirm(detail.task.id, s.id));
    sessionsWrap.appendChild(row);
  });
  dlg.appendChild(sessionsWrap);

  const closeBtn = document.createElement('div');
  closeBtn.style.marginTop='12px';
  closeBtn.innerHTML = `<button id="closeDlg">Close</button>`;
  dlg.appendChild(closeBtn);
  dlg.querySelector('#closeDlg').addEventListener('click', ()=> dlg.close());

  dlg.showModal();
}

function editTaskPrompt(id){
  // Open modal form populated with task data
  api(`/api/tasks/${id}`).then(data=>{
    const dlg = document.getElementById('taskEditDlg');
    document.getElementById('editTaskTitle').value = data.task.title || '';
    document.getElementById('editTaskDesc').value = data.task.description || '';
    const form = document.getElementById('taskEditForm');
    form.dataset.id = id;
    dlg.showModal();
  }).catch(err=>alert(err));
}

function deleteTaskConfirm(id){
  if (!confirm('Delete task and its sessions?')) return;
  api(`/api/tasks/${id}`, { method: 'DELETE' }).then(()=> loadTasks()).catch(err=>alert(err));
}

function deleteSessionConfirm(taskId, sessionId){
  if (!confirm('Delete session?')) return;
  api(`/api/tasks/${taskId}/sessions/${sessionId}`, { method: 'DELETE' }).then(()=> openDetail(taskId)).catch(err=>alert(err));
}

function openEditSession(taskId, session){
  // Open session edit modal populated with session data
  const dlg = document.getElementById('sessionEditDlg');
  document.getElementById('editSessionTaskId').value = taskId;
  document.getElementById('editSessionId').value = session.id;
  document.getElementById('editSessionStart').value = toLocalInputValue(session.start_time);
  document.getElementById('editSessionEnd').value = toLocalInputValue(session.end_time);
  dlg.showModal();
}

// Per-card live timer state and helpers
let runningTaskId = null;
let runningStart = null;
let runningInterval = null;

function formatElapsed(ms){
  const total = Math.floor(ms/1000);
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  const pad = n=>String(n).padStart(2,'0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function loadRunningFromStorage(){
  try{
    const raw = localStorage.getItem('tt_active');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.taskId && obj.start) return { taskId: obj.taskId, start: new Date(obj.start) };
  }catch(e){console.warn('invalid tt_active',e)}
  return null;
}

function saveRunningToStorage(){
  if (runningTaskId && runningStart) localStorage.setItem('tt_active', JSON.stringify({ taskId: runningTaskId, start: runningStart.toISOString() }));
  else localStorage.removeItem('tt_active');
}

function startIntervalFor(taskId){
  if (runningInterval) clearInterval(runningInterval);
  runningInterval = setInterval(()=>{
    if (!runningStart || !runningTaskId) return;
    const now = new Date();
    const diff = now - runningStart;
    const el = document.querySelector(`.timer[data-timer-id="${runningTaskId}"]`);
    if (el) el.textContent = formatElapsed(diff);
  }, 500);
}

function refreshRunningUI(){
  // show/hide start/stop buttons and highlight running card
  const cards = document.querySelectorAll('.card');
  cards.forEach(c=>{
    const id = String(c.dataset.id);
    const startBtn = c.querySelector('.startBtn');
    const stopBtn = c.querySelector('.stopBtn');
    const timerEl = c.querySelector(`.timer[data-timer-id="${id}"]`);
    if (runningTaskId && String(runningTaskId) === id){
      c.classList.add('running');
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = '';
      if (timerEl && runningStart){
        timerEl.textContent = formatElapsed(new Date() - runningStart);
      }
    } else {
      c.classList.remove('running');
      if (startBtn) startBtn.style.display = runningTaskId ? 'none' : '';
      if (stopBtn) stopBtn.style.display = 'none';
      const total = c.querySelector('.meta')?.textContent || '';
      // leave timer at 00:00:00 for non-running cards
      if (timerEl) timerEl.textContent = '00:00:00';
    }
  });
  
  // Update running stat
  const runningStat = document.getElementById('statTaskRunning');
  if (runningStat) runningStat.textContent = runningTaskId ? '1' : '0';
}

async function startTimerFor(taskId){
  // if another running, prevent
  if (runningTaskId && String(runningTaskId) !== String(taskId)){
    return alert('Stop the currently running task first');
  }
  runningTaskId = String(taskId);
  runningStart = new Date();
  saveRunningToStorage();
  startIntervalFor(runningTaskId);
  refreshRunningUI();
}

async function stopTimerFor(taskId){
  if (!runningTaskId || String(runningTaskId) !== String(taskId)) return;
  const startIso = runningStart.toISOString();
  const endIso = new Date().toISOString();
  try{
    await api(`/api/tasks/${taskId}/sessions`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ start_time: startIso, end_time: endIso }) });
    clearInterval(runningInterval); runningInterval = null;
    const elapsed = new Date(endIso) - runningStart;
    runningTaskId = null; runningStart = null; saveRunningToStorage();
    refreshRunningUI();
    loadTasks();
    alert('Session saved: ' + formatElapsed(elapsed));
  }catch(err){
    alert('Failed to save session: ' + err);
  }
}

// resume running if present
const resumed = loadRunningFromStorage();
if (resumed){ runningTaskId = String(resumed.taskId); runningStart = resumed.start; startIntervalFor(runningTaskId); }

document.getElementById('taskForm').addEventListener('submit', async (e) =>{
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  if (!title) return alert('Title required');
  await api('/api/tasks', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({title, description}) });
  e.target.reset();
  loadTasks();
});

// NOTE: manual session form removed; live timer handles creating sessions now.

document.getElementById('refresh').addEventListener('click', async (e)=>{
  const btn = e.currentTarget;
  btn.classList.add('loading');
  const start = Date.now();
  try{
    await loadTasks();
  }catch(err){
    console.error(err);
  }
  const elapsed = Date.now() - start;
  const minMs = 600;
  const remaining = Math.max(0, minMs - elapsed);
  setTimeout(()=> btn.classList.remove('loading'), remaining);
});

loadTasks().catch(err => console.error(err));

// Theme handling: toggle and persist preference
function applyTheme(theme){
  if (theme === 'light') document.body.classList.add('light');
  else document.body.classList.remove('light');
}

function initTheme(){
  const saved = localStorage.getItem('tt_theme') || 'dark';
  applyTheme(saved);
  const btn = document.getElementById('themeToggle');
  const sunIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>';
  const moonIcon = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';

  function setBtnFor(theme){
    if (theme === 'light'){
      btn.innerHTML = sunIcon + ' Light';
      btn.setAttribute('aria-label','Switch to dark theme');
    } else {
      btn.innerHTML = moonIcon + ' Dark';
      btn.setAttribute('aria-label','Switch to light theme');
    }
  }

  setBtnFor(saved);
  btn.addEventListener('click', ()=>{
    const cur = document.body.classList.contains('light') ? 'light' : 'dark';
    const next = cur === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('tt_theme', next);
    setBtnFor(next);
  });
}

initTheme();

// Task edit form submit
document.getElementById('taskEditForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const id = e.target.dataset.id;
  const title = document.getElementById('editTaskTitle').value.trim();
  const description = document.getElementById('editTaskDesc').value.trim();
  if (!title) return alert('Title required');
  await api(`/api/tasks/${id}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title, description }) });
  document.getElementById('taskEditDlg').close();
  loadTasks();
});
document.getElementById('cancelEditTask').addEventListener('click', ()=> document.getElementById('taskEditDlg').close());

// Session edit form submit
document.getElementById('sessionEditForm').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const taskId = document.getElementById('editSessionTaskId').value;
  const sessionId = document.getElementById('editSessionId').value;
  const start = document.getElementById('editSessionStart').value;
  const end = document.getElementById('editSessionEnd').value;
  if (!start || !end) return alert('Start and end required');
  const startIso = new Date(start).toISOString();
  const endIso = new Date(end).toISOString();
  await api(`/api/tasks/${taskId}/sessions/${sessionId}`, { method: 'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ start_time: startIso, end_time: endIso }) });
  document.getElementById('sessionEditDlg').close();
  openDetail(taskId);
});
document.getElementById('cancelEditSession').addEventListener('click', ()=> document.getElementById('sessionEditDlg').close());
