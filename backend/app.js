// Authentication functions
function getAuthToken() {
  const tokenData = localStorage.getItem('authToken');
  if (tokenData) {
    try {
      const parsed = JSON.parse(tokenData);
      // The token might be stored as a simple string or as part of a user object
      // First, check if it's a simple token string
      if (typeof parsed === 'string') {
        return parsed;
      }
      // If it's an object (like the user object returned from login),
      // look for the access_token property which is the JWT token needed for authorization
      return parsed.access_token || parsed.token || parsed.id_token || parsed.refresh_token || parsed.id;
    } catch (e) {
      // If parsing fails, return the raw value
      return tokenData;
    }
  }
  return null;
}

function isLoggedIn() {
  const token = getAuthToken();
  // A user is considered logged in if there's a token or user object stored
  return !!token;
}

// Session timeout management
function decodeJWT(token) {
  try {
    // Check if token looks like a JWT (has two dots forming three parts)
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      console.warn('Token is not in JWT format');
      return null;
    }

    // Split the JWT token to get the payload
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('JWT does not have 3 parts');
      return null;
    }

    // Decode the payload (second part)
    // The payload is base64url encoded, so we need to convert it to base64 first
    let payload = parts[1];
    // Add padding if needed
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4) {
      payload += '=';
    }

    const decodedPayload = atob(payload);
    const payloadObj = JSON.parse(decodedPayload);
    return payloadObj;
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
}

function getSessionExpirationTime() {
  const token = getAuthToken();
  if (!token) return null;

  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) {
    // If we can't decode the expiration from the JWT, return null
    // This means we can't determine the exact expiration time
    return null;
  }

  // Convert expiration timestamp to milliseconds
  return decoded.exp * 1000;
}

function getRemainingSessionTime() {
  const expirationTime = getSessionExpirationTime();

  if (!expirationTime) {
    // If we can't get the expiration time from the JWT, we'll implement a fallback
    // by storing the login time and assuming a standard session duration
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) {
      // If we don't have a login time recorded, we can't calculate remaining time
      return null;
    }

    // Assume a 1-hour session duration (3600000 ms) as default
    const sessionDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const loginTimestamp = parseInt(loginTime);
    const expirationTimeFromLogin = loginTimestamp + sessionDuration;
    const currentTime = Date.now();
    const remainingTime = expirationTimeFromLogin - currentTime;

    return Math.max(0, remainingTime);
  }

  const currentTime = Date.now();
  const remainingTime = expirationTime - currentTime;

  return Math.max(0, remainingTime);
}

function formatTime(milliseconds) {
  if (milliseconds <= 0) return 'Expired';

  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

let sessionTimeoutInterval = null;

function startSessionTimeoutChecker() {
  // Clear any existing interval
  if (sessionTimeoutInterval) {
    clearInterval(sessionTimeoutInterval);
  }

  // Update the session timer immediately
  updateSessionTimerDisplay();

  // Set up interval to update the timer every second
  sessionTimeoutInterval = setInterval(() => {
    updateSessionTimerDisplay();
  }, 1000);
}

function updateSessionTimerDisplay() {
  const remainingTime = getRemainingSessionTime();
  const sessionTimerElement = document.getElementById('sessionTimer');

  if (sessionTimerElement) {
    if (remainingTime === null) {
      sessionTimerElement.textContent = '';
      sessionTimerElement.style.display = 'none';
    } else if (remainingTime <= 0) {
      sessionTimerElement.innerHTML = `🔒 <strong>Session Expired</strong> - Logging out...`;
      // Adjust color based on theme
      const isLightTheme = document.body.classList.contains('light');
      sessionTimerElement.style.color = isLightTheme ? '#000000' : '#ff4444'; // Black in light mode, red in dark mode
      sessionTimerElement.style.fontWeight = 'bold';
      sessionTimerElement.style.display = 'inline-block';
      // Automatically log out when session expires
      setTimeout(() => {
        logout();
      }, 2000); // Wait 2 seconds before logging out to show the message
    } else {
      // Format the time with more visual appeal
      const formattedTime = formatTime(remainingTime);
      sessionTimerElement.innerHTML = `⏱️ <strong>Expires in:</strong> ${formattedTime}`;
      // Adjust color based on theme
      const isLightTheme = document.body.classList.contains('light');
      sessionTimerElement.style.color = isLightTheme ? '#000000' : '#ffffff'; // Black in light mode, white in dark mode
      sessionTimerElement.style.display = 'inline-block';

      // Change appearance when session is about to expire (less than 10 minutes)
      if (remainingTime < 10 * 60 * 1000) {
        // Adjust warning color based on theme
        sessionTimerElement.style.color = isLightTheme ? '#cc7700' : '#ff9900'; // Darker orange in light mode
        sessionTimerElement.style.fontWeight = 'bold';

        // Add pulsing animation when critically low (less than 5 minutes)
        if (remainingTime < 5 * 60 * 1000) {
          sessionTimerElement.style.animation = 'pulse 1s infinite';
          sessionTimerElement.style.color = isLightTheme ? '#cc0000' : '#ff5555'; // Darker red in light mode
        } else {
          sessionTimerElement.style.animation = 'none';
        }
      } else {
        sessionTimerElement.style.animation = 'none';
      }
    }
  }
}

function stopSessionTimeoutChecker() {
  if (sessionTimeoutInterval) {
    clearInterval(sessionTimeoutInterval);
    sessionTimeoutInterval = null;
  }

  const sessionTimerElement = document.getElementById('sessionTimer');
  if (sessionTimerElement) {
    sessionTimerElement.style.display = 'none';
  }
}

// Check if this is the main page and enforce authentication
function enforceAuthOnMainPage() {
  // Check if we're on the main index page (not login or register)
  if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
    if (!isLoggedIn()) {
      // Redirect to login page if not authenticated on main page
      window.location.href = 'login.html';
    }
  }
}

// Enforce authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  enforceAuthOnMainPage();

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  updateAuthUI();
});

function getUserInfo() {
  const tokenData = localStorage.getItem('authToken');
  if (tokenData) {
    try {
      const parsed = JSON.parse(tokenData);
      return parsed.user || parsed;
    } catch (e) {
      console.error('Error parsing user info:', e);
      return null;
    }
  }
  return null;
}

function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('loginTime'); // Also remove login time when logging out
  localStorage.removeItem('tt_active'); // Clear running task state when logging out
  // Stop session timeout checker when logging out
  stopSessionTimeoutChecker();
  // Reset running state variables
  runningTaskId = null;
  runningStart = null;
  if (runningInterval) {
    clearInterval(runningInterval);
    runningInterval = null;
  }
  updateAuthUI();
  // Reload the page to reset the app state
  window.location.reload();
}

function updateAuthUI() {
  const authControls = document.getElementById('authControls');
  const userMenu = document.getElementById('userMenu');
  const userName = document.getElementById('userName');

  if (isLoggedIn()) {
    // Check if session has expired based on our fallback mechanism
    const remainingTime = getRemainingSessionTime();
    if (remainingTime !== null && remainingTime <= 0) {
      // Session has expired, log out the user
      logout();
      return;
    }

    // Show user menu
    authControls.style.display = 'none';
    userMenu.style.display = 'flex';

    const userInfo = getUserInfo();
    if (userInfo && userInfo.nama_lengkap) {
      userName.textContent = userInfo.nama_lengkap;
    } else if (userInfo && userInfo.username) {
      userName.textContent = userInfo.username;
    } else if (userInfo && userInfo.email) {
      userName.textContent = userInfo.email;
    }

    // Start session timeout checker when user is logged in
    startSessionTimeoutChecker();
  } else {
    // Show auth controls
    authControls.style.display = 'flex';
    userMenu.style.display = 'none';

    // Stop session timeout checker when user is logged out
    stopSessionTimeoutChecker();
  }
}

// Add logout button event listener when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logout);
  }

  updateAuthUI();

  // Initialize session timeout checker if user is already logged in
  if (isLoggedIn()) {
    startSessionTimeoutChecker();
  }
});

// Small frontend module to manage tasks and sessions
// Configure the backend API URL - defaults to current domain but can be overridden
// For GitHub Pages or external deployments, you can set window.BACKEND_API_URL before loading app.js
const BACKEND_API_URL = (window.BACKEND_API_URL || '').replace(/\/$/, '') || ''; // Remove trailing slash if present, default to empty string (same origin)

async function api(path, opts = {}){
  // Add authorization header if user is logged in
  const token = getAuthToken();
  if (token) {
    opts.headers = {
      ...opts.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json' // Ensure Content-Type is set for all requests
    };
  } else {
    // Ensure Content-Type is set even without auth
    opts.headers = {
      ...opts.headers,
      'Content-Type': 'application/json'
    };
  }

  try {
    const res = await fetch(BACKEND_API_URL + path, {
      ...opts,
      credentials: 'same-origin' // Include credentials for same-origin requests
    });

    if (!res.ok) {
      // Attempt to get error message from response body
      let errorMessage = await res.text();
      try {
        // If the response is JSON, parse it to get a more meaningful error message
        const errorJson = JSON.parse(errorMessage);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
      } catch (e) {
        // If response is not JSON, use the plain text error
      }
      throw new Error(errorMessage);
    }
    return res.json();
  } catch (error) {
    // Log the error for debugging but re-throw it
    console.error(`API call failed: ${path}`, error);
    throw error;
  }
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

    // Check if elements exist before trying to update them
    const statTotalToday = document.getElementById('statTotalToday');
    const statTotalDuration = document.getElementById('statTotalDuration');
    const statTotalWeek = document.getElementById('statTotalWeek');
    const statTaskRunning = document.getElementById('statTaskRunning');

    // Update Total Task Today to show the time worked today (the main focus)
    if (statTotalToday) statTotalToday.textContent = stats.today?.duration_readable || '0h 0m 0s';
    // Update the duration field to show total accumulated time across all tasks
    if (statTotalDuration) statTotalDuration.textContent = `Total keseluruhan: ${stats.today?.total_accumulated_readable || '0h 0m 0s'}`;
    if (statTotalWeek) statTotalWeek.textContent = stats.week?.count || 0;

    // Task Running now comes from the API stats (global count for user)
    if (statTaskRunning) statTaskRunning.textContent = stats.running?.count || 0;
  } catch(e) {
    console.error('Failed to load stats', e);
    // Set default values when API fails to ensure consistent UI
    const statTotalToday = document.getElementById('statTotalToday');
    const statTotalDuration = document.getElementById('statTotalDuration');
    const statTotalWeek = document.getElementById('statTotalWeek');
    const statTaskRunning = document.getElementById('statTaskRunning');

    if (statTotalToday) statTotalToday.textContent = '0h 0m 0s';
    if (statTotalDuration) statTotalDuration.textContent = 'Total keseluruhan: 0h 0m 0s';
    if (statTotalWeek) statTotalWeek.textContent = '0';
    if (statTaskRunning) statTaskRunning.textContent = '0';
  }
}

async function loadTasks(){
  try {
    const tasks = await api('/api/tasks');
    const activeContainer = document.getElementById('activeTasks');
    const completedContainer = document.getElementById('completedTasks');

    if (!activeContainer || !completedContainer) {
      console.error('Task containers not found');
      return;
    }

    activeContainer.innerHTML = '';
    completedContainer.innerHTML = '';

    // Sort tasks to put running task at the top
    const running = loadRunningFromStorage();
    const sortedTasks = [...tasks].sort((a, b) => {
      // If a task is running, put it at the top
      if (running && String(a.id) === String(running.taskId)) return -1;
      if (running && String(b.id) === String(running.taskId)) return 1;
      // Otherwise maintain original order
      return 0;
    });

    sortedTasks.forEach(t => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.id = t.id;
      card.dataset.status = t.status;

      // Add status indicator class
      if (t.status === 'completed') {
        card.classList.add('completed');
      }

      // Sanitize title and description to prevent XSS
      const sanitizedTitle = t.title ? t.title.toString().replace(/[<>&]/g, (match) => {
        return match === '<' ? '&lt;' : match === '>' ? '&gt;' : '&amp;';
      }) : '';

      const sanitizedDescription = t.description ? t.description.toString().replace(/[<>&]/g, (match) => {
        return match === '<' ? '&lt;' : match === '>' ? '&gt;' : '&amp;';
      }) : '';

      card.innerHTML = `
        <div class="card-left">
          <div class="title">${sanitizedTitle}</div>
          <div class="meta">${t.total_duration_readable || '0h 0m 0s'} • ${t.sessions_count || 0} session(s)</div>
          <div class="dates">
            <small>Created: ${fmtDate(t.created_at)}</small>
            ${t.completed_at ? `<small class="completed-date">Completed: ${fmtDate(t.completed_at)}</small>` : ''}
          </div>
        </div>
        <div class="actions">
          <div class="controls">
            <div class="timer pill" data-timer-id="${t.id}">00:00:00</div>
            <button class="startBtn" data-id="${t.id}" ${t.status === 'completed' ? 'style="display:none"' : ''}>Start</button>
            <button class="stopBtn" data-id="${t.id}" style="display:none">Stop</button>
          </div>
          <div style="display:flex;gap:8px;margin-left:8px">
            <button class="statusBtn" data-id="${t.id}" data-status="${t.status === 'completed' ? 'active' : 'completed'}" ${(t.sessions_count === 0 && t.status !== 'completed') ? 'style="display:none"' : ''}>
              ${t.status === 'completed' ? 'Not Done' : 'Finish'}
            </button>
            <button data-id="${t.id}" class="view">View</button>
            <button data-id="${t.id}" class="edit">Edit</button>
            <button data-id="${t.id}" class="del">Delete</button>
          </div>
        </div>
      `;

      // attach handlers for view/edit/delete
      const viewBtn = card.querySelector('.view');
      const editBtn = card.querySelector('.edit');
      const delBtn = card.querySelector('.del');
      const startBtn = card.querySelector('.startBtn');
      const stopBtn = card.querySelector('.stopBtn');
      const statusBtn = card.querySelector('.statusBtn');

      if (viewBtn) viewBtn.addEventListener('click', ()=> openDetail(t.id));
      if (editBtn) editBtn.addEventListener('click', ()=> editTaskPrompt(t.id));
      if (delBtn) delBtn.addEventListener('click', ()=> deleteTaskConfirm(t.id));

      // start/stop handlers
      if (startBtn) startBtn.addEventListener('click', ()=> startTimerFor(t.id));
      if (stopBtn) stopBtn.addEventListener('click', ()=> stopTimerFor(t.id));

      // status toggle handler
      if (statusBtn) statusBtn.addEventListener('click', ()=> toggleTaskStatus(t.id, t.status));

      // Add to appropriate container based on status
      if (t.status === 'completed') {
        completedContainer.appendChild(card);
      } else {
        activeContainer.appendChild(card);
      }
    });

    // Refresh UI according to running state
    refreshRunningUI();
    loadStats();
  } catch (error) {
    console.error('Failed to load tasks', error);
    // Show error message to user
    const activeContainer = document.getElementById('activeTasks');
    const completedContainer = document.getElementById('completedTasks');

    if (activeContainer) {
      activeContainer.innerHTML = '<div class="error-message">Failed to load active tasks. Please refresh the page.</div>';
    }
    if (completedContainer) {
      completedContainer.innerHTML = '<div class="error-message">Failed to load completed tasks. Please refresh the page.</div>';
    }
  }
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
  info.innerHTML = `
    <div class="pill">Total: ${secondsToHuman(total)}</div>
    <div class="pill">Range: ${fmtDate(detail.sessions[0]?.start_time)} → ${fmtDate(detail.sessions[detail.sessions.length-1]?.end_time)}</div>
    <div class="pill">Created: ${fmtDate(detail.task.created_at)}</div>
    ${detail.task.completed_at ? `<div class="pill completed-info">Completed: ${fmtDate(detail.task.completed_at)}</div>` : ''}
  `;
  dlg.appendChild(info);

  const sessionsWrap = document.createElement('div');
  sessionsWrap.className = 'sessions';
  detail.sessions.forEach(s => {
    const row = document.createElement('div');
    row.className = 'session-row';
    // Initialize keterangan from session data if it exists
    const keterangan = s.keterangan || '';
    row.innerHTML = `
      <div>
        <div><strong>${fmtDate(s.start_time)}</strong> → <strong>${fmtDate(s.end_time)}</strong></div>
        <small>${secondsToHuman(s.duration)}</small>
        ${keterangan ? `<small class="keterangan-text" style="color:silver;">Keterangan: ${keterangan}</small>` : ''}
      </div>
      <div style="display:flex;gap:8px">
        <button class="addKeterangan" data-task="${detail.task.id}" data-id="${s.id}">+ Keterangan</button>
        <button class="editSession" data-task="${detail.task.id}" data-id="${s.id}">Edit</button>
        <button class="delSession" data-id="${s.id}">Delete</button>
      </div>
    `;
    row.querySelector('.editSession').addEventListener('click', (e)=> openEditSession(detail.task.id, s));
    row.querySelector('.delSession').addEventListener('click', ()=> deleteSessionConfirm(detail.task.id, s.id));

    // Add event listener for the keterangan button
    row.querySelector('.addKeterangan').addEventListener('click', (e) => {
      openKeteranganDialog(detail.task.id, s.id, row);
    });

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

// Function to open keterangan dialog without closing the main detail dialog
function openKeteranganDialog(taskId, sessionId, sessionRow) {
  const dlg = document.getElementById('keteranganDlg');
  const form = document.getElementById('keteranganForm');

  // Clear previous values
  document.getElementById('keteranganInput').value = '';

  // Store references for later use
  form.dataset.taskId = taskId;
  form.dataset.sessionId = sessionId;
  form.dataset.sessionRow = sessionRow;

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
  api(`/api/tasks/${id}`, { method: 'DELETE' }).then(()=> {
    loadTasks();
    loadHistoryTasks(); // Reload history tasks after task is deleted
  }).catch(err=>alert(err));
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
    const status = c.dataset.status;
    const startBtn = c.querySelector('.startBtn');
    const stopBtn = c.querySelector('.stopBtn');
    const timerEl = c.querySelector(`.timer[data-timer-id="${id}"]`);

    if (runningTaskId && String(runningTaskId) === id){
      c.classList.add('running');
      // Hide Start button and show Stop button when task is running
      if (startBtn) startBtn.style.display = 'none';
      if (stopBtn) stopBtn.style.display = '';
      if (timerEl && runningStart){
        timerEl.textContent = formatElapsed(new Date() - runningStart);
      }
    } else {
      c.classList.remove('running');
      // Show Start button and hide Stop button when task is not running
      // But hide Start button if task is completed or another task is running
      if (startBtn) {
        startBtn.style.display = (status === 'completed' || (runningTaskId && runningTaskId !== id)) ? 'none' : '';
      }
      if (stopBtn) stopBtn.style.display = 'none';
      const total = c.querySelector('.meta')?.textContent || '';
      // leave timer at 00:00:00 for non-running cards
      if (timerEl) timerEl.textContent = '00:00:00';
    }
  });

  // The running stat element is updated in loadStats() from the API
  // refreshRunningUI() focuses on the UI elements for the running task card itself
}

async function toggleTaskStatus(taskId, currentStatus) {
  try {
    const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
    // Get the task details to preserve title and description
    const taskCard = document.querySelector(`.card[data-id="${taskId}"]`);
    const title = taskCard.querySelector('.title').textContent;

    // For description, we need to get it from the task data, not from the UI
    // So we'll fetch the task details first
    const taskData = await api(`/api/tasks/${taskId}`);
    await api(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        title: title,
        description: taskData.task.description,
        status: newStatus
      })
    });
    loadTasks(); // Reload tasks to reflect the status change
    loadHistoryTasks(); // Reload history tasks to reflect the status change
  } catch (error) {
    console.error('Error updating task status:', error);
    alert('Failed to update task status');
  }
}

async function startTimerFor(taskId){
  // if another task is running, ask user if they want to stop it and start the new one
  if (runningTaskId && String(runningTaskId) !== String(taskId)){
    const shouldStopCurrent = confirm('You have another task running. Do you want to stop it and start this task instead?');
    if (!shouldStopCurrent) {
      return; // User chose not to stop the current task
    }

    // Stop the currently running task first
    try {
      await api(`/api/tasks/${runningTaskId}/stop`, { method: 'POST' });
      clearInterval(runningInterval);
      runningInterval = null;
      runningTaskId = null;
      runningStart = null;
      saveRunningToStorage();
    } catch (error) {
      console.error('Error stopping current task:', error);
      alert('Failed to stop current task: ' + error.message);
      return;
    }
  }

  try {
    // Call the API to start the running task in the database
    await api(`/api/tasks/${taskId}/start`, { method: 'POST' });

    runningTaskId = String(taskId);
    runningStart = new Date();
    saveRunningToStorage();
    startIntervalFor(runningTaskId);
    refreshRunningUI();

    // Move the running task to the top immediately after starting
    moveTaskToTop(taskId);
  } catch (error) {
    console.error('Error starting task:', error);
    alert('Failed to start task: ' + error.message);
  }
}

function moveTaskToTop(taskId) {
  const taskCard = document.querySelector(`.card[data-id="${taskId}"]`);
  if (!taskCard) return;

  const parentContainer = taskCard.parentElement;
  if (!parentContainer) return;

  // Remove the card from its current position and re-add it at the beginning
  parentContainer.removeChild(taskCard);
  parentContainer.insertBefore(taskCard, parentContainer.firstChild);
}

async function stopTimerFor(taskId){
  if (!runningTaskId || String(runningTaskId) !== String(taskId)) return;
  const startIso = runningStart.toISOString();
  const endIso = new Date().toISOString();
  try{
    // First, stop the running task in the database
    await api(`/api/tasks/${taskId}/stop`, { method: 'POST' });

    // Then save the session
    await api(`/api/tasks/${taskId}/sessions`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ start_time: startIso, end_time: endIso }) });
    clearInterval(runningInterval); runningInterval = null;
    const elapsed = new Date(endIso) - runningStart;
    runningTaskId = null; runningStart = null; saveRunningToStorage();
    refreshRunningUI();
    loadTasks();
    loadHistoryTasks(); // Reload history tasks after session is saved
    alert('Session saved: ' + formatElapsed(elapsed));
  }catch(err){
    alert('Failed to save session: ' + err);
  }
}

// Function to restore running state from API
async function restoreRunningState() {
  try {
    // First, try to get running tasks from the API
    const runningTasks = await api('/api/running-tasks');

    if (runningTasks && runningTasks.length > 0) {
      // If there's a running task in the database, use it
      const runningTask = runningTasks[0]; // User can only have one running task
      runningTaskId = String(runningTask.task_id);
      runningStart = new Date(runningTask.start_time);
      startIntervalFor(runningTaskId);

      // Also save to localStorage for consistency
      localStorage.setItem('tt_active', JSON.stringify({
        taskId: runningTask.task_id,
        start: runningTask.start_time
      }));
    } else {
      // If no running task in DB, try to restore from localStorage
      const resumed = loadRunningFromStorage();
      if (resumed) {
        runningTaskId = String(resumed.taskId);
        runningStart = resumed.start;
        startIntervalFor(runningTaskId);
      }
    }

    // Refresh UI after restoring state
    refreshRunningUI();
  } catch (error) {
    console.error('Error restoring running state from API:', error);
    // Fallback to localStorage if API fails
    const resumed = loadRunningFromStorage();
    if (resumed) {
      runningTaskId = String(resumed.taskId);
      runningStart = resumed.start;
      startIntervalFor(runningTaskId);
    }

    // Refresh UI after restoring state (even if there was an error)
    refreshRunningUI();
  }
}

// Restore running state when page loads
restoreRunningState();

document.getElementById('taskForm').addEventListener('submit', async (e) =>{
  e.preventDefault();
  const title = document.getElementById('title').value.trim();
  const description = document.getElementById('description').value.trim();
  if (!title) return alert('Title required');
  await api('/api/tasks', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({title, description}) });
  e.target.reset();
  loadTasks();
  loadHistoryTasks(); // Reload history tasks after task is created
});

// Cancel button functionality
document.getElementById('cancelBtn').addEventListener('click', (e) => {
  document.getElementById('title').value = '';
  document.getElementById('description').value = '';
  document.getElementById('title').focus(); // Focus back to title input
});

// NOTE: manual session form removed; live timer handles creating sessions now.

document.getElementById('refresh').addEventListener('click', async (e)=>{
  const btn = e.currentTarget;
  btn.classList.add('loading');
  const start = Date.now();
  try{
    await loadTasks();
    await loadHistoryTasks();
  }catch(err){
    console.error(err);
  }
  const elapsed = Date.now() - start;
  const minMs = 600;
  const remaining = Math.max(0, minMs - elapsed);
  setTimeout(()=> btn.classList.remove('loading'), remaining);
});

// Load history tasks
async function loadHistoryTasks() {
  try {
    const historyData = await api('/api/history');
    const historyContainer = document.getElementById('historyTasks');

    if (!historyContainer) {
      console.error('History container not found');
      return;
    }

    historyContainer.innerHTML = '';

    if (!historyData || historyData.length === 0) {
      historyContainer.innerHTML = '<p>No task history available.</p>';
      return;
    }

    historyData.forEach(group => {
      const dateGroup = document.createElement('div');
      dateGroup.className = 'history-date-group';

      const dateLabel = document.createElement('div');
      dateLabel.className = `date-label ${group.dateLabel === 'Hari Ini' ? 'hari-ini' : ''}`;
      // Sanitize the date label to prevent XSS
      dateLabel.textContent = group.dateLabel ? group.dateLabel.toString().replace(/[<>&]/g, (match) => {
        return match === '<' ? '&lt;' : match === '>' ? '&gt;' : '&amp;';
      }) : '';

      const progress = document.createElement('div');
      progress.className = 'progress';
      // Sanitize the progress text to prevent XSS
      progress.textContent = group.progress ? group.progress.toString().replace(/[<>&]/g, (match) => {
        return match === '<' ? '&lt;' : match === '>' ? '&gt;' : '&amp;';
      }) : '';

      dateGroup.appendChild(dateLabel);
      dateGroup.appendChild(progress);

      historyContainer.appendChild(dateGroup);

      // Add tasks for this date
      group.tasks.forEach(task => {
        const taskItem = document.createElement('div');
        taskItem.className = 'task-item';

        const taskTitle = document.createElement('div');
        taskTitle.className = 'task-title';
        // Sanitize the task title to prevent XSS
        taskTitle.textContent = task.title ? task.title.toString().replace(/[<>&]/g, (match) => {
          return match === '<' ? '&lt;' : match === '>' ? '&gt;' : '&amp;';
        }) : '';

        taskItem.appendChild(taskTitle);
        historyContainer.appendChild(taskItem);
      });
    });
  } catch (error) {
    console.error('Failed to load history tasks:', error);
    const historyContainer = document.getElementById('historyTasks');
    if (historyContainer) {
      historyContainer.innerHTML = '<p>Failed to load task history. Please refresh the page.</p>';
    }
  }
}

loadTasks().catch(err => console.error(err));
loadHistoryTasks().catch(err => console.error(err));

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
  loadHistoryTasks(); // Reload history tasks after task is edited
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
  loadHistoryTasks(); // Reload history tasks after session is edited
});
document.getElementById('cancelEditSession').addEventListener('click', ()=> document.getElementById('sessionEditDlg').close());

// Keterangan form event listeners
document.getElementById('keteranganForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const taskId = form.dataset.taskId;
  const sessionId = form.dataset.sessionId;
  const keterangan = document.getElementById('keteranganInput').value.trim();

  try {
    // Get the task details to get the current session data
    const taskDetails = await api(`/api/tasks/${taskId}`);
    const currentSession = taskDetails.sessions.find(s => s.id == sessionId);

    if (!currentSession) {
      throw new Error('Session not found');
    }

    // Call the API to update the session keterangan while preserving time fields
    await api(`/api/tasks/${taskId}/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start_time: currentSession.start_time,
        end_time: currentSession.end_time,
        keterangan
      })
    });

    // Update the UI to show the keterangan
    const detailDlg = document.getElementById('detailDlg');
    const sessionRows = detailDlg.querySelectorAll('.session-row');

    sessionRows.forEach(row => {
      const editBtn = row.querySelector('.editSession');
      if (editBtn && editBtn.dataset.id === sessionId) {
        // Update the session row to show the keterangan
        const keteranganDiv = row.querySelector('div:first-child');
        const existingKet = row.querySelector('.keterangan-text');
        if (existingKet) {
          existingKet.remove();
        }

        if (keterangan) {
          const keteranganElement = document.createElement('small');
          keteranganElement.className = 'keterangan-text';
          keteranganElement.style.color = 'silver';
          keteranganElement.textContent = `Keterangan: ${keterangan}`;
          keteranganDiv.appendChild(keteranganElement);
        }
      }
    });

    // Close the keterangan dialog
    document.getElementById('keteranganDlg').close();
  } catch (error) {
    console.error('Error saving keterangan:', error);
    alert('Failed to save keterangan: ' + error.message);
  }
});

document.getElementById('cancelKeterangan').addEventListener('click', () => {
  document.getElementById('keteranganDlg').close();
});

// Initialize authentication UI when the page loads
document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
});
