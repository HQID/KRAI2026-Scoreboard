/**
 * KRAI SCOREBOARD JS
 * Developed for Kontes Robot ABU Indonesia (KRAI)
 * Manages scoreboard state, countdown timer, keyboard shortcuts, synthesized sound signals, and event logs.
 */

// --- STATE MANAGEMENT ---
const state = {
  // Team Red Data
  red: {
    name: "TIM MERAH",
    score: 0,
    penalties: 0,
    tasks: {
      red_task1: false,
      red_task2: false,
      red_task3: false,
      red_task4: false
    }
  },
  // Team Blue Data
  blue: {
    name: "TIM BIRU",
    score: 0,
    penalties: 0,
    tasks: {
      blue_task1: false,
      blue_task2: false,
      blue_task3: false,
      blue_task4: false
    }
  },
  // Timer State
  timer: {
    duration: 180, // Total match duration in seconds (default 3 mins = 180s)
    timeLeft: 180,
    isRunning: false,
    intervalId: null
  },
  // Settings & Configuration
  settings: {
    soundEnabled: true,
    victoryLabel: "HIROTO",
    autoScore: true // Calculate scores automatically based on tasks checked
  },
  // Match Info
  match: {
    stage: "PENYISIHAN",
    number: "MATCH 01"
  },
  victoryAchieved: null // 'red', 'blue', or null
};

// --- AUDIO SYNTHESIS ENGINE (WEB AUDIO API) ---
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

/**
 * Synthesizes a high-quality sound signal.
 * @param {string} type - 'start' (whistle), 'beep' (second countdown), 'warning' (penalty), 'end' (buzzer), 'victory' (success melody)
 */
function playSound(type) {
  if (!state.settings.soundEnabled) return;
  initAudio();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  switch (type) {
    case 'beep': {
      // Short standard beep for countdown seconds
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now); // A5 note
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
      break;
    }
    case 'warning': {
      // Harsh warning double beep
      [0, 0.15].forEach(delay => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now + delay);
        gain.gain.setValueAtTime(0.1, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      });
      break;
    }
    case 'start': {
      // Simulated whistle (high pitch sine with frequency sweep and vibrato)
      const duration = 0.8;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2000, now);
      osc.frequency.exponentialRampToValueAtTime(2200, now + 0.1);
      osc.frequency.exponentialRampToValueAtTime(1800, now + duration);

      // Low frequency oscillator for vibrato
      const lfo = audioCtx.createOscillator();
      const lfoGain = audioCtx.createGain();
      lfo.frequency.value = 35; // Fast vibrato
      lfoGain.gain.value = 50;  // Pitch variation range
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      lfo.start(now);
      osc.start(now);
      lfo.stop(now + duration);
      osc.stop(now + duration);
      break;
    }
    case 'end': {
      // Low heavy buzzer
      const duration = 1.8;
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(80, now);
      osc2.type = 'square';
      osc2.frequency.setValueAtTime(81.5, now); // Slightly detuned

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.linearRampToValueAtTime(0.25, now + duration - 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
      break;
    }
    case 'victory': {
      // Energetic game victory theme
      const notes = [
        { f: 523.25, d: 0.15 }, // C5
        { f: 659.25, d: 0.15 }, // E5
        { f: 783.99, d: 0.15 }, // G5
        { f: 1046.50, d: 0.4 }  // C6
      ];
      let currentDelay = 0;
      notes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.f, now + currentDelay);
        gain.gain.setValueAtTime(0.12, now + currentDelay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + currentDelay + note.d);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now + currentDelay);
        osc.stop(now + currentDelay + note.d);
        currentDelay += note.d * 0.8;
      });
      break;
    }
  }
}

// --- DOM ELEMENTS ---
const elements = {
  // Red Team elements
  redScore: document.getElementById('redScore'),
  redTeamName: document.getElementById('redTeamName'),
  redPenalties: document.getElementById('redPenalties'),
  victoryRedBtn: document.getElementById('victoryRedBtn'),
  panelRed: document.getElementById('panelRed'),
  // Blue Team elements
  blueScore: document.getElementById('blueScore'),
  blueTeamName: document.getElementById('blueTeamName'),
  bluePenalties: document.getElementById('bluePenalties'),
  victoryBlueBtn: document.getElementById('victoryBlueBtn'),
  panelBlue: document.getElementById('panelBlue'),
  // Timer elements
  timerDisplay: document.getElementById('timerDisplay'),
  timerStatus: document.getElementById('timerStatus'),
  timerProgress: document.getElementById('timerProgress'),
  playPauseBtn: document.getElementById('playPauseBtn'),
  resetBtn: document.getElementById('resetBtn'),
  // Time adjustments
  adjustSub10: document.getElementById('adjustSub10'),
  adjustSub1: document.getElementById('adjustSub1'),
  adjustAdd1: document.getElementById('adjustAdd1'),
  adjustAdd10: document.getElementById('adjustAdd10'),
  // Announcements & utilities
  announcementBox: document.getElementById('announcementBox'),
  announcementText: document.getElementById('announcementText'),
  soundToggleBtn: document.getElementById('soundToggleBtn'),
  logList: document.getElementById('logList'),
  clearLogBtn: document.getElementById('clearLogBtn'),
  matchStageLabel: document.getElementById('matchStageLabel'),
  matchNumberLabel: document.getElementById('matchNumberLabel'),
  // Modals
  editMatchModal: document.getElementById('editMatchModal'),
  keyboardHelpModal: document.getElementById('keyboardHelpModal'),
  settingsModal: document.getElementById('settingsModal'),
  editMatchBtn: document.getElementById('editMatchBtn'),
  keyboardHelpBtn: document.getElementById('keyboardHelpBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  // Modal Inputs & Buttons
  matchStageInput: document.getElementById('matchStageInput'),
  matchNumberInput: document.getElementById('matchNumberInput'),
  saveMatchDetailsBtn: document.getElementById('saveMatchDetailsBtn'),
  durationInput: document.getElementById('durationInput'),
  victoryConditionInput: document.getElementById('victoryConditionInput'),
  autoScoreFromTasks: document.getElementById('autoScoreFromTasks'),
  saveSettingsBtn: document.getElementById('saveSettingsBtn')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadFromLocalStorage();
  setupEventListeners();
  updateUI();
  addLog("Papan skor siap. Selamat datang di Kontes Robot ABU Indonesia!", "system");
});

// --- LOCAL STORAGE HANDLING ---
function saveToLocalStorage() {
  localStorage.setItem('krai_scoreboard_state', JSON.stringify({
    red: state.red,
    blue: state.blue,
    timer: {
      duration: state.timer.duration,
      timeLeft: state.timer.timeLeft
    },
    settings: state.settings,
    match: state.match,
    victoryAchieved: state.victoryAchieved
  }));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('krai_scoreboard_state');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      state.red = { ...state.red, ...data.red };
      state.blue = { ...state.blue, ...data.blue };
      state.timer.duration = data.timer.duration;
      state.timer.timeLeft = data.timer.timeLeft;
      state.settings = { ...state.settings, ...data.settings };
      state.match = { ...state.match, ...data.match };
      state.victoryAchieved = data.victoryAchieved;
    } catch (e) {
      console.error("Error loading local storage data", e);
    }
  }
}

// --- LOGGING ENGINE ---
function formatTimeLeft(seconds) {
  const mins = Math.floor(Math.abs(seconds) / 60);
  const secs = Math.abs(seconds) % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function addLog(text, type = 'system') {
  const timestamp = formatTimeLeft(state.timer.timeLeft);
  const logItem = document.createElement('div');
  logItem.className = `log-item ${type}`;
  
  logItem.innerHTML = `
    <span class="log-time">${timestamp}</span>
    <span class="log-desc">${text}</span>
  `;
  
  elements.logList.insertBefore(logItem, elements.logList.firstChild);
  
  // Prune log if too long (keep last 50)
  while (elements.logList.children.length > 50) {
    elements.logList.removeChild(elements.logList.lastChild);
  }
}

// --- UI UPDATING ENGINE ---
function updateUI() {
  // Update Team Names
  elements.redTeamName.value = state.red.name;
  elements.blueTeamName.value = state.blue.name;

  // Update Scores (Zero-padded to 3 digits)
  elements.redScore.textContent = state.red.score.toString().padStart(3, '0');
  elements.blueScore.textContent = state.blue.score.toString().padStart(3, '0');

  // Update Penalties
  updatePenaltyDots('red', state.red.penalties);
  updatePenaltyDots('blue', state.blue.penalties);

  // Update Timer display
  elements.timerDisplay.textContent = formatTimeLeft(state.timer.timeLeft);

  // Update Timer Progress Bar
  const percentage = (state.timer.timeLeft / state.timer.duration) * 100;
  elements.timerProgress.style.width = `${Math.max(0, Math.min(100, percentage))}%`;

  // Update Timer status class
  const timerCard = document.querySelector('.timer-card');
  timerCard.classList.remove('running', 'finished');
  if (state.timer.isRunning) {
    timerCard.classList.add('running');
    elements.timerStatus.textContent = "RUNNING";
    elements.playPauseBtn.innerHTML = '<i class="fa-solid fa-pause"></i> PAUSE';
  } else {
    elements.timerStatus.textContent = state.timer.timeLeft === 0 ? "FINISHED" : "PAUSED";
    elements.playPauseBtn.innerHTML = '<i class="fa-solid fa-play"></i> START';
    if (state.timer.timeLeft === 0) {
      timerCard.classList.add('finished');
      elements.timerStatus.textContent = "FINISHED";
    }
  }

  // Update Victory Buttons text
  elements.victoryRedBtn.innerHTML = `<i class="fa-solid fa-trophy"></i> ${state.settings.victoryLabel} / VICTORY!`;
  elements.victoryBlueBtn.innerHTML = `<i class="fa-solid fa-trophy"></i> ${state.settings.victoryLabel} / VICTORY!`;

  // Update Match detail labels
  elements.matchStageLabel.textContent = state.match.stage;
  elements.matchNumberLabel.textContent = state.match.number;

  // Update Sound button icon
  elements.soundToggleBtn.innerHTML = state.settings.soundEnabled 
    ? '<i class="fa-solid fa-volume-high"></i>' 
    : '<i class="fa-solid fa-volume-xmark"></i>';
  elements.soundToggleBtn.style.color = state.settings.soundEnabled ? '' : 'var(--red-neon)';

  // Update Checklist states
  Object.keys(state.red.tasks).forEach(id => {
    const chk = document.getElementById(id);
    if (chk) chk.checked = state.red.tasks[id];
  });
  Object.keys(state.blue.tasks).forEach(id => {
    const chk = document.getElementById(id);
    if (chk) chk.checked = state.blue.tasks[id];
  });

  // Update announcement banner & borders
  updateAnnouncementBanner();
}

function updatePenaltyDots(team, count) {
  const container = document.getElementById(`${team}Penalties`);
  if (!container) return;
  const dots = container.querySelectorAll('.penalty-dot');
  dots.forEach(dot => {
    const idx = parseInt(dot.getAttribute('data-index'));
    if (idx <= count) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

function updateAnnouncementBanner() {
  const box = elements.announcementBox;
  const txt = elements.announcementText;
  
  box.className = "match-announcement";
  
  if (state.victoryAchieved) {
    const teamName = state.victoryAchieved === 'red' ? state.red.name : state.blue.name;
    box.classList.add('victory-active');
    txt.innerHTML = `<i class="fa-solid fa-crown"></i> ${state.settings.victoryLabel}! Kemenangan Mutlak diraih oleh <strong>${teamName}</strong>!`;
    
    // Highlight winning panel
    if (state.victoryAchieved === 'red') {
      elements.panelRed.style.boxShadow = `0 0 40px var(--red-neon)`;
      elements.panelBlue.style.boxShadow = '';
    } else {
      elements.panelBlue.style.boxShadow = `0 0 40px var(--blue-neon)`;
      elements.panelRed.style.boxShadow = '';
    }
  } else {
    // Normal match alerts based on timer
    elements.panelRed.style.boxShadow = '';
    elements.panelBlue.style.boxShadow = '';
    
    if (state.timer.isRunning) {
      if (state.timer.timeLeft <= 10) {
        box.classList.add('red-active');
        txt.innerHTML = `<i class="fa-solid fa-clock"></i> Pertandingan akan berakhir dalam ${state.timer.timeLeft} detik!`;
      } else if (state.timer.timeLeft <= 60) {
        box.classList.add('red-active');
        txt.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> 1 MENIT TERAKHIR!`;
      } else {
        txt.innerHTML = `<i class="fa-solid fa-circle-play"></i> Pertandingan sedang berlangsung...`;
      }
    } else {
      if (state.timer.timeLeft === 0) {
        box.classList.add('red-active');
        txt.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> Waktu Habis! Pertandingan Selesai.`;
      } else if (state.timer.timeLeft === state.timer.duration) {
        txt.innerHTML = `<i class="fa-solid fa-hourglass-start"></i> Siap memulai pertandingan.`;
      } else {
        txt.innerHTML = `<i class="fa-solid fa-circle-pause"></i> Pertandingan ditangguhkan (PAUSED).`;
      }
    }
  }
}

// --- SCORE ACTIONS ---
function changeScore(team, val) {
  if (state.victoryAchieved) return;
  const oldValue = state[team].score;
  state[team].score = Math.max(0, state[team].score + val);
  
  if (oldValue !== state[team].score) {
    const diffSign = val > 0 ? `+${val}` : val;
    addLog(`Skor ${state[team].name} disesuaikan: ${diffSign} poin (Sekarang: ${state[team].score})`, team);
    saveToLocalStorage();
    updateUI();
  }
}

function recalculateTeamScore(team) {
  if (!state.settings.autoScore) return;
  
  let score = 0;
  const checkboxes = document.querySelectorAll(`.task-checkbox[data-team="${team}"]`);
  checkboxes.forEach(chk => {
    if (chk.checked) {
      score += parseInt(chk.getAttribute('data-points')) || 0;
    }
  });

  const oldValue = state[team].score;
  state[team].score = score;
  
  if (oldValue !== state[team].score) {
    addLog(`Skor ${state[team].name} dikalkulasi ulang berdasarkan checklist tugas (Sekarang: ${state[team].score})`, team);
    saveToLocalStorage();
    updateUI();
  }
}

// --- PENALTY ACTIONS ---
function changePenalty(team, val) {
  if (state.victoryAchieved) return;
  const oldPenalties = state[team].penalties;
  state[team].penalties = Math.max(0, Math.min(3, state[team].penalties + val));

  if (oldPenalties !== state[team].penalties) {
    const action = val > 0 ? "bertambah" : "berkurang";
    addLog(`Pelanggaran ${state[team].name} ${action} menjadi ${state[team].penalties}/3`, team);
    
    if (val > 0) {
      playSound('warning');
    }
    
    // Optional: automatically deduct points for penalties (e.g. KRAI warning might deduct points or give free points to opponent)
    // Here we just update state and log
    saveToLocalStorage();
    updateUI();
  }
}

// --- VICTORY TRIGGER ---
function triggerVictory(team) {
  if (state.victoryAchieved) return;
  
  // Pause timer first
  pauseTimer();
  
  state.victoryAchieved = team;
  playSound('victory');
  
  const winnerName = state[team].name;
  addLog(`Kemenangan Mutlak (${state.settings.victoryLabel}) dicapai oleh ${winnerName}!`, 'system');
  
  saveToLocalStorage();
  updateUI();
}

// --- TIMER ACTIONS ---
function startTimer() {
  if (state.timer.isRunning || state.timer.timeLeft <= 0 || state.victoryAchieved) return;

  initAudio();
  state.timer.isRunning = true;
  playSound('start');
  addLog("Pertandingan dimulai!", "system");

  state.timer.intervalId = setInterval(() => {
    state.timer.timeLeft--;
    
    // Countdown sounds in last 10 seconds
    if (state.timer.timeLeft > 0 && state.timer.timeLeft <= 10) {
      playSound('beep');
    }

    if (state.timer.timeLeft <= 0) {
      finishTimer();
    } else {
      saveToLocalStorage();
      updateUI();
    }
  }, 1000);

  updateUI();
}

function pauseTimer() {
  if (!state.timer.isRunning) return;
  
  state.timer.isRunning = false;
  clearInterval(state.timer.intervalId);
  state.timer.intervalId = null;
  
  addLog("Pertandingan ditangguhkan (PAUSED).", "system");
  saveToLocalStorage();
  updateUI();
}

function resetTimerAndMatch() {
  pauseTimer();
  
  state.timer.timeLeft = state.timer.duration;
  state.victoryAchieved = null;
  
  // Reset scores and penalties
  state.red.score = 0;
  state.red.penalties = 0;
  state.blue.score = 0;
  state.blue.penalties = 0;
  
  // Reset checkboxes
  Object.keys(state.red.tasks).forEach(k => state.red.tasks[k] = false);
  Object.keys(state.blue.tasks).forEach(k => state.blue.tasks[k] = false);
  
  addLog("Papan skor dan timer di-reset ke kondisi awal.", "system");
  
  saveToLocalStorage();
  updateUI();
}

function finishTimer() {
  state.timer.timeLeft = 0;
  state.timer.isRunning = false;
  clearInterval(state.timer.intervalId);
  state.timer.intervalId = null;
  
  playSound('end');
  addLog("WAKTU PERTANDINGAN HABIS!", "system");
  
  saveToLocalStorage();
  updateUI();
}

function adjustTime(seconds) {
  if (state.victoryAchieved) return;
  const oldTime = state.timer.timeLeft;
  state.timer.timeLeft = Math.max(0, Math.min(state.timer.duration, state.timer.timeLeft + seconds));
  
  if (oldTime !== state.timer.timeLeft) {
    const diff = seconds > 0 ? `+${seconds}s` : `${seconds}s`;
    addLog(`Waktu disesuaikan ${diff} (Sisa waktu: ${formatTimeLeft(state.timer.timeLeft)})`, "system");
    saveToLocalStorage();
    updateUI();
  }
}

// --- EVENT LISTENERS setup ---
function setupEventListeners() {
  
  // Team name inline edit change events
  elements.redTeamName.addEventListener('change', (e) => {
    const old = state.red.name;
    state.red.name = e.target.value.trim() || "TIM MERAH";
    addLog(`Nama Tim Merah diubah dari "${old}" menjadi "${state.red.name}"`, 'red');
    saveToLocalStorage();
    updateUI();
  });

  elements.blueTeamName.addEventListener('change', (e) => {
    const old = state.blue.name;
    state.blue.name = e.target.value.trim() || "TIM BIRU";
    addLog(`Nama Tim Biru diubah dari "${old}" menjadi "${state.blue.name}"`, 'blue');
    saveToLocalStorage();
    updateUI();
  });

  // Score buttons click events
  document.querySelectorAll('.btn-score').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const team = btn.getAttribute('data-team');
      const val = parseInt(btn.getAttribute('data-value'));
      changeScore(team, val);
    });
  });

  // Tasks checkboxes check events
  document.querySelectorAll('.task-checkbox').forEach(chk => {
    chk.addEventListener('change', (e) => {
      const team = chk.getAttribute('data-team');
      const id = chk.id;
      const points = parseInt(chk.getAttribute('data-points'));
      const isChecked = chk.checked;
      
      state[team].tasks[id] = isChecked;
      
      addLog(`Tugas "${chk.nextElementSibling.nextElementSibling.textContent}" ${isChecked ? 'DISAPU' : 'DI-RESET'} oleh ${state[team].name}`, team);

      if (state.settings.autoScore) {
        recalculateTeamScore(team);
      } else {
        saveToLocalStorage();
        updateUI();
      }
    });
  });

  // Penalties click events
  document.querySelectorAll('.btn-add-penalty').forEach(btn => {
    btn.addEventListener('click', () => {
      const team = btn.getAttribute('data-team');
      changePenalty(team, 1);
    });
  });

  document.querySelectorAll('.btn-remove-penalty').forEach(btn => {
    btn.addEventListener('click', () => {
      const team = btn.getAttribute('data-team');
      changePenalty(team, -1);
    });
  });

  // Victory button events
  elements.victoryRedBtn.addEventListener('click', () => triggerVictory('red'));
  elements.victoryBlueBtn.addEventListener('click', () => triggerVictory('blue'));

  // Timer play-pause and reset
  elements.playPauseBtn.addEventListener('click', () => {
    if (state.timer.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  });

  elements.resetBtn.addEventListener('click', () => {
    if (confirm("Reset ulang seluruh skor dan timer pertandingan?")) {
      resetTimerAndMatch();
    }
  });

  // Adjust time click events
  elements.adjustSub10.addEventListener('click', () => adjustTime(-10));
  elements.adjustSub1.addEventListener('click', () => adjustTime(-1));
  elements.adjustAdd1.addEventListener('click', () => adjustTime(1));
  elements.adjustAdd10.addEventListener('click', () => adjustTime(10));

  // Sound toggle button click
  elements.soundToggleBtn.addEventListener('click', () => {
    state.settings.soundEnabled = !state.settings.soundEnabled;
    addLog(`Efek suara ${state.settings.soundEnabled ? 'DIAKTIFKAN' : 'DIBISUKAN'}.`, 'system');
    if (state.settings.soundEnabled) {
      playSound('beep');
    }
    saveToLocalStorage();
    updateUI();
  });

  // Clean log button click
  elements.clearLogBtn.addEventListener('click', () => {
    elements.logList.innerHTML = '';
    addLog("Riwayat log dibersihkan.", "system");
  });

  // Modals trigger buttons
  elements.editMatchBtn.addEventListener('click', () => openModal(elements.editMatchModal));
  elements.keyboardHelpBtn.addEventListener('click', () => openModal(elements.keyboardHelpModal));
  elements.settingsBtn.addEventListener('click', () => openModal(elements.settingsModal));

  // Modals close logic
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', closeModalAll);
  });

  // Close modals when clicking outside contents
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModalAll();
      }
    });
  });

  // Modal Submissions
  elements.saveMatchDetailsBtn.addEventListener('click', () => {
    const oldStage = state.match.stage;
    const oldNum = state.match.number;
    state.match.stage = elements.matchStageInput.value.trim().toUpperCase() || "PENYISIHAN";
    state.match.number = elements.matchNumberInput.value.trim().toUpperCase() || "MATCH 01";
    
    addLog(`Detail Pertandingan diubah: ${state.match.stage} - ${state.match.number}`, 'system');
    closeModalAll();
    saveToLocalStorage();
    updateUI();
  });

  elements.saveSettingsBtn.addEventListener('click', () => {
    const durationVal = parseInt(elements.durationInput.value);
    const victoryLabelVal = elements.victoryConditionInput.value.trim().toUpperCase() || "HIROTO";
    const autoScoreVal = elements.autoScoreFromTasks.checked;

    const oldDuration = state.timer.duration;
    let timeDiff = durationVal - oldDuration;
    state.timer.duration = durationVal;
    
    // Adjust time left if match hasn't started or reset
    if (state.timer.timeLeft === oldDuration) {
      state.timer.timeLeft = durationVal;
    } else {
      state.timer.timeLeft = Math.max(0, state.timer.timeLeft + timeDiff);
    }
    
    state.settings.victoryLabel = victoryLabelVal;
    state.settings.autoScore = autoScoreVal;

    addLog(`Pengaturan disimpan. Durasi Match: ${durationVal}s. Kondisi Menang: ${victoryLabelVal}. Auto-Score: ${autoScoreVal ? 'YA' : 'TIDAK'}`, 'system');
    
    // Recalculate scores if autoscore got enabled
    if (autoScoreVal) {
      recalculateTeamScore('red');
      recalculateTeamScore('blue');
    }
    
    closeModalAll();
    saveToLocalStorage();
    updateUI();
  });

  // KEYBOARD KEYDOWN LISTENERS
  document.addEventListener('keydown', (e) => {
    // Exclude shortcuts when focus is in input fields to allow typing names/details
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    const key = e.key.toLowerCase();

    switch (key) {
      case ' ':
        e.preventDefault();
        if (state.timer.isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
        break;
      case 'r':
        if (confirm("Reset ulang seluruh skor dan timer pertandingan?")) {
          resetTimerAndMatch();
        }
        break;
      // RED TEAM SHORTCUTS
      case 'q':
        changeScore('red', 1);
        break;
      case 'a':
        changeScore('red', -1);
        break;
      case 'w':
        changeScore('red', 5);
        break;
      case 's':
        changePenalty('red', 1);
        break;
      // BLUE TEAM SHORTCUTS
      case 'p':
        changeScore('blue', 1);
        break;
      case 'l':
        changeScore('blue', -1);
        break;
      case 'o':
        changeScore('blue', 5);
        break;
      case 'k':
        changePenalty('blue', 1);
        break;
    }
  });
}

// --- MODAL UTILITIES ---
function openModal(modal) {
  // Pre-fill inputs with current state when opening
  if (modal === elements.editMatchModal) {
    elements.matchStageInput.value = state.match.stage;
    elements.matchNumberInput.value = state.match.number;
  } else if (modal === elements.settingsModal) {
    elements.durationInput.value = state.timer.duration;
    elements.victoryConditionInput.value = state.settings.victoryLabel;
    elements.autoScoreFromTasks.checked = state.settings.autoScore;
  }
  
  modal.classList.add('active');
}

function closeModalAll() {
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.classList.remove('active');
  });
}
