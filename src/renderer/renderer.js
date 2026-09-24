const views = {
  welcome: document.querySelector('#welcome-view'),
  recording: document.querySelector('#recording-view'),
  editor: document.querySelector('#editor-view')
};
const startButton = document.querySelector('#start-button');
const stopButton = document.querySelector('#stop-button');
const liveVideo = document.querySelector('#live-video');
const playbackVideo = document.querySelector('#playback-video');
const timer = document.querySelector('#timer');
const videoWindow = document.querySelector('#video-window');
const exportStatus = document.querySelector('#export-status');
const exportProgress = document.querySelector('#export-progress');
const hotkeyButton = document.querySelector('#hotkey-button');
const hotkeyStatus = document.querySelector('#hotkey-status');
const sourceList = document.querySelector('#source-list');
const selectedSourceLabel = document.querySelector('#selected-source-label');
const audioList = document.querySelector('#audio-list');
const languageSelect = document.querySelector('#language-select');
const outputFolder = document.querySelector('#output-folder');

const translations = {
  en: {
    language: 'Language', privacy: 'Everything stays on this computer', eyebrow: 'SCREEN RECORDING, AUTOMATICALLY POLISHED',
    hero1: 'Record normally.', hero2: 'Look professionally edited.', intro: 'Record one app in high quality, choose exactly which app audio to include, and export locally without uploading anything.',
    chooseWindow: 'Choose a window to record', chooseWindowHelp: 'Only this window will appear in the video', refresh: 'Refresh', findingWindows: 'Finding open windows…',
    chooseAudio: 'Choose app audio', chooseAudioHelp: 'Select any number of apps, or none for a silent recording', findingApps: 'Finding apps…', audioSupport: 'Only checked apps will be included. Other system sounds are excluded.',
    startRecording: 'Start recording', selectWindowFirst: 'Select a window above first', recordingHotkey: 'Recording hotkey', hotkeyHelp: 'Works while ClickFilm is in the background', hotkeyPrompt: 'Click, then press your shortcut',
    step1: 'Record your screen', step1Help: 'Use your app naturally.', step2: 'Keep every detail', step2Help: 'High-resolution, high-bitrate capture.', step3: 'Export and share', step3Help: 'Ready-to-post MP4.',
    recording: 'Recording', recordNaturally: 'High-quality recording in progress', stopRecording: 'Stop recording', recordingHint: 'Your recording is stored locally and remains private.',
    project: 'PROJECT', untitled: 'Untitled recording', newRecording: 'New recording', exportMp4: 'Export MP4', format: 'Format', background: 'Background', none: 'None', noneHelp: "Choose None to preserve the recording's native resolution and aspect ratio.",
    durationStat: 'duration', qualityLabel: 'High', qualityStat: 'recording quality',
    saveFolder: 'Default save folder', changeFolder: 'Change folder',
    pressShortcut: 'Press shortcut…', shortcutInstructions: 'Use Ctrl, Alt, Shift, or the Windows key plus another key.', shortcutInvalid: 'That shortcut needs a modifier and a letter, number, or function key.', shortcutReady: 'Shortcut ready.', shortcutUsed: 'Windows is already using that shortcut. The previous shortcut is still active.',
    noWindows: 'No recordable windows found. Open the app you want to record, then press Refresh.', noApps: 'No apps with open windows found. Open an app, play audio, then press Refresh.', findingError: 'Could not load the list.', startNewFirst: 'Start a new project before recording again.',
    exportRendering: 'Rendering locally with FFmpeg…', exportHelp: 'This runs as fast as your computer allows—no real-time playback required.', exportComplete: 'Export complete', exportFailed: 'Export failed', recordingFailed: 'Could not start recording. Refresh the window list and try again.'
  },
  'zh-CN': {
    language: '语言', privacy: '所有内容仅保存在此电脑上', eyebrow: '屏幕录制，自动美化', hero1: '正常录制。', hero2: '呈现专业剪辑效果。', intro: '以高质量录制一个应用窗口，精确选择要收录的应用声音，并在本地导出，无需上传任何内容。',
    chooseWindow: '选择要录制的窗口', chooseWindowHelp: '视频中只会显示此窗口', refresh: '刷新', findingWindows: '正在查找已打开的窗口…', chooseAudio: '选择应用音频', chooseAudioHelp: '可选择多个应用，或不选择以录制静音视频', findingApps: '正在查找应用…', audioSupport: '只会收录已勾选应用的声音，其他系统声音将被排除。',
    startRecording: '开始录制', selectWindowFirst: '请先在上方选择一个窗口', recordingHotkey: '录制快捷键', hotkeyHelp: 'ClickFilm 在后台时仍可使用', hotkeyPrompt: '点击后按下新的快捷键', step1: '录制屏幕', step1Help: '正常使用你的应用。', step2: '保留每个细节', step2Help: '高分辨率、高码率录制。', step3: '导出并分享', step3Help: '生成可直接发布的 MP4。',
    recording: '正在录制', recordNaturally: '正在进行高质量录制', stopRecording: '停止录制', recordingHint: '录像仅保存在本地并保持私密。', project: '项目', untitled: '未命名录像', newRecording: '新建录像', exportMp4: '导出 MP4', format: '画面比例', background: '背景', none: '无', noneHelp: '选择“无”可保留录像的原始分辨率和宽高比。',
    durationStat: '时长', qualityLabel: '高', qualityStat: '录制质量',
    saveFolder: '默认保存文件夹', changeFolder: '更改文件夹',
    pressShortcut: '请按快捷键…', shortcutInstructions: '请使用 Ctrl、Alt、Shift 或 Windows 键搭配另一个按键。', shortcutInvalid: '快捷键必须包含修饰键以及字母、数字或功能键。', shortcutReady: '快捷键已启用。', shortcutUsed: '该快捷键已被 Windows 占用，之前的快捷键仍然有效。', noWindows: '未找到可录制的窗口。请打开目标应用后点击“刷新”。', noApps: '未找到带有窗口的应用。请打开应用并播放声音后点击“刷新”。', findingError: '无法加载列表。', startNewFirst: '请先新建项目再开始录制。',
    exportRendering: '正在使用 FFmpeg 本地渲染…', exportHelp: '将以电脑可达到的最快速度运行，无需实时播放。', exportComplete: '导出完成', exportFailed: '导出失败', recordingFailed: '无法开始录制。请刷新窗口列表后重试。'
  },
  'zh-TW': {
    language: '語言', privacy: '所有內容僅儲存在此電腦上', eyebrow: '螢幕錄製，自動美化', hero1: '正常錄製。', hero2: '呈現專業剪輯效果。', intro: '以高畫質錄製一個應用程式視窗，精確選擇要收錄的應用程式聲音，並於本機匯出，無需上傳任何內容。',
    chooseWindow: '選擇要錄製的視窗', chooseWindowHelp: '影片中只會顯示此視窗', refresh: '重新整理', findingWindows: '正在尋找已開啟的視窗…', chooseAudio: '選擇應用程式音訊', chooseAudioHelp: '可選擇多個應用程式，或不選擇以錄製靜音影片', findingApps: '正在尋找應用程式…', audioSupport: '只會收錄已勾選應用程式的聲音，其他系統聲音將被排除。',
    startRecording: '開始錄製', selectWindowFirst: '請先在上方選擇一個視窗', recordingHotkey: '錄製快捷鍵', hotkeyHelp: 'ClickFilm 在背景執行時仍可使用', hotkeyPrompt: '點擊後按下新的快捷鍵', step1: '錄製螢幕', step1Help: '正常使用你的應用程式。', step2: '保留每個細節', step2Help: '高解析度、高位元率錄製。', step3: '匯出並分享', step3Help: '產生可直接發佈的 MP4。',
    recording: '正在錄製', recordNaturally: '正在進行高畫質錄製', stopRecording: '停止錄製', recordingHint: '錄影僅儲存於本機並保持私密。', project: '專案', untitled: '未命名錄影', newRecording: '新增錄影', exportMp4: '匯出 MP4', format: '畫面比例', background: '背景', none: '無', noneHelp: '選擇「無」可保留錄影的原始解析度和長寬比。',
    durationStat: '片長', qualityLabel: '高', qualityStat: '錄製品質',
    saveFolder: '預設儲存資料夾', changeFolder: '更改資料夾',
    pressShortcut: '請按快捷鍵…', shortcutInstructions: '請使用 Ctrl、Alt、Shift 或 Windows 鍵搭配另一個按鍵。', shortcutInvalid: '快捷鍵必須包含修飾鍵以及字母、數字或功能鍵。', shortcutReady: '快捷鍵已啟用。', shortcutUsed: '該快捷鍵已被 Windows 使用，先前的快捷鍵仍然有效。', noWindows: '找不到可錄製的視窗。請開啟目標應用程式後按「重新整理」。', noApps: '找不到具有視窗的應用程式。請開啟應用程式並播放聲音後按「重新整理」。', findingError: '無法載入清單。', startNewFirst: '請先新增專案再開始錄製。',
    exportRendering: '正在使用 FFmpeg 於本機轉譯…', exportHelp: '將以電腦可達到的最快速度執行，無需即時播放。', exportComplete: '匯出完成', exportFailed: '匯出失敗', recordingFailed: '無法開始錄製。請重新整理視窗清單後再試。'
  }
};

let currentLanguage = localStorage.getItem('language') || 'en';
function tr(key) { return translations[currentLanguage]?.[key] || translations.en[key] || key; }
function applyLanguage(language) {
  currentLanguage = translations[language] ? language : 'en';
  localStorage.setItem('language', currentLanguage);
  document.documentElement.lang = currentLanguage;
  languageSelect.value = currentLanguage;
  document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = tr(node.dataset.i18n); });
}
languageSelect.addEventListener('change', event => applyLanguage(event.target.value));
applyLanguage(currentLanguage);

let captureStream;
let recorder;
let chunks = [];
let recordingStartedAt = 0;
let timerInterval;
let rawRecordingUrl;
let rawRecordingBlob;
let localRecordingPromise;
let selectedSourceId = null;
let capturingHotkey = false;
function showView(name) {
  Object.entries(views).forEach(([key, view]) => view.classList.toggle('hidden', key !== name));
}

function playRecordingCue(kind) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContextClass();
    const gain = context.createGain();
    gain.connect(context.destination);
    const now = context.currentTime;
    const frequencies = kind === 'start' ? [523.25, 783.99] : [659.25, 392];
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + .015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + .34);
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(now + index * .1);
      oscillator.stop(now + .24 + index * .1);
    });
    setTimeout(() => context.close().catch(() => {}), 600);
  } catch (error) {
    console.warn('Recording cue unavailable:', error.message);
  }
}

startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
document.querySelector('#new-button').addEventListener('click', resetProject);
document.querySelector('#export-button').addEventListener('click', exportVideo);
hotkeyButton.addEventListener('click', beginHotkeyCapture);
document.querySelector('#refresh-sources').addEventListener('click', loadCaptureSources);
document.querySelector('#refresh-audio').addEventListener('click', loadAudioApps);
document.querySelector('#change-output-folder').addEventListener('click', chooseOutputFolder);
window.clickfilm.onRecordingToggle(() => {
  if (recorder?.state === 'recording') stopRecording();
  else if (!views.recording.classList.contains('hidden')) return;
  else if (!views.editor.classList.contains('hidden')) {
    hotkeyStatus.textContent = tr('startNewFirst');
  } else startRecording();
});

const savedHotkey = localStorage.getItem('recordingHotkey') || 'CommandOrControl+Shift+R';
setHotkey(savedHotkey, false);
loadCaptureSources();
loadAudioApps();
loadOutputFolder();

async function loadOutputFolder() {
  outputFolder.textContent = await window.clickfilm.getOutputDirectory();
  outputFolder.title = outputFolder.textContent;
}

async function chooseOutputFolder() {
  const result = await window.clickfilm.chooseOutputDirectory();
  if (result.path) {
    outputFolder.textContent = result.path;
    outputFolder.title = result.path;
  }
}

function beginHotkeyCapture() {
  capturingHotkey = true;
  hotkeyButton.classList.add('listening');
  hotkeyButton.textContent = tr('pressShortcut');
  hotkeyStatus.textContent = tr('shortcutInstructions');
  window.addEventListener('keydown', captureHotkey, { capture: true });
}

function captureHotkey(event) {
  if (!capturingHotkey) return;
  event.preventDefault();
  event.stopPropagation();
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return;
  capturingHotkey = false;
  window.removeEventListener('keydown', captureHotkey, { capture: true });
  const accelerator = acceleratorFromEvent(event);
  if (!accelerator) {
    hotkeyButton.classList.remove('listening');
    setHotkey(localStorage.getItem('recordingHotkey') || 'CommandOrControl+Shift+R', false);
    hotkeyStatus.textContent = tr('shortcutInvalid');
    return;
  }
  setHotkey(accelerator, true);
}

async function loadCaptureSources() {
  startButton.disabled = true;
  selectedSourceId = null;
  selectedSourceLabel.dataset.i18n = 'selectWindowFirst';
  selectedSourceLabel.textContent = tr('selectWindowFirst');
  sourceList.innerHTML = `<p class="source-loading">${tr('findingWindows')}</p>`;
  try {
    const sources = await window.clickfilm.listCaptureSources();
    sourceList.replaceChildren();
    if (!sources.length) {
      sourceList.innerHTML = `<p class="source-loading">${tr('noWindows')}</p>`;
      return;
    }
    sources.forEach(source => {
      const button = document.createElement('button');
      button.className = 'source-card';
      button.type = 'button';
      const image = document.createElement('img');
      image.src = source.thumbnail;
      image.alt = '';
      const label = document.createElement('span');
      label.textContent = source.name;
      button.append(image, label);
      button.addEventListener('click', () => selectCaptureSource(source, button));
      sourceList.appendChild(button);
    });
  } catch (error) {
    sourceList.innerHTML = `<p class="source-loading">${tr('findingError')} ${escapeText(error.message)}</p>`;
  }
}

async function selectCaptureSource(source, button) {
  const selected = await window.clickfilm.selectCaptureSource(source.id);
  if (!selected) return;
  selectedSourceId = source.id;
  delete selectedSourceLabel.dataset.i18n;
  sourceList.querySelectorAll('.source-card').forEach(card => card.classList.toggle('selected', card === button));
  selectedSourceLabel.textContent = source.name;
  startButton.disabled = false;
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

async function loadAudioApps() {
  const checked = new Set(selectedAudioPids());
  audioList.innerHTML = `<p class="source-loading">${tr('findingApps')}</p>`;
  try {
    const apps = await window.clickfilm.listAudioApps();
    audioList.replaceChildren();
    if (!apps.length) {
      audioList.innerHTML = `<p class="source-loading">${tr('noApps')}</p>`;
      return;
    }
    apps.forEach(app => {
      const label = document.createElement('label');
      label.className = 'audio-app';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = app.pid;
      input.checked = checked.has(app.pid);
      const name = document.createElement('span');
      name.textContent = app.title || app.name;
      name.title = `${app.name} — PID ${app.pid}`;
      label.append(input, name);
      audioList.appendChild(label);
    });
  } catch (error) {
    audioList.innerHTML = `<p class="source-loading">${tr('findingError')} ${escapeText(error.message)}</p>`;
  }
}

function selectedAudioPids() {
  return [...audioList.querySelectorAll('input:checked')].map(input => Number(input.value)).filter(Boolean);
}

async function setHotkey(accelerator, persist) {
  const result = await window.clickfilm.setRecordingHotkey(accelerator);
  hotkeyButton.classList.remove('listening');
  renderHotkey(result.accelerator);
  if (result.ok) {
    if (persist) localStorage.setItem('recordingHotkey', result.accelerator);
    hotkeyStatus.textContent = tr('shortcutReady');
  } else {
    hotkeyStatus.textContent = tr('shortcutUsed');
  }
}

function acceleratorFromEvent(event) {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return null;
  const modifiers = [];
  if (event.ctrlKey || event.metaKey) modifiers.push('CommandOrControl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (!modifiers.length) return null;
  let key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  if (key === ' ') key = 'Space';
  if (!/^([A-Z0-9]|F(?:[1-9]|1[0-2])|Space|Enter|Tab|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Arrow(?:Up|Down|Left|Right))$/.test(key)) return null;
  return [...modifiers, key].join('+');
}

function renderHotkey(accelerator) {
  const labels = accelerator.replace('CommandOrControl', 'Ctrl').split('+');
  hotkeyButton.innerHTML = labels.map(label => `<kbd>${label.replace('Arrow', '')}</kbd>`).join('<i>+</i>');
}

async function startRecording() {
  if (!selectedSourceId) {
    showView('welcome');
    selectedSourceLabel.textContent = tr('selectWindowFirst');
    return;
  }
  try {
    const audioResult = await window.clickfilm.startAudioCapture(selectedAudioPids());
    if (!audioResult.ok) throw new Error(audioResult.error);
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        width: { ideal: 3840 },
        height: { ideal: 2160 },
        frameRate: { ideal: 60, max: 60 },
        cursor: 'always'
      },
      audio: false
    });
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    recorder = new MediaRecorder(captureStream, { mimeType, videoBitsPerSecond: 24_000_000 });
    chunks = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = finishRecording;
    captureStream.getVideoTracks()[0].addEventListener('ended', () => {
      if (recorder?.state === 'recording') stopRecording();
    });

    liveVideo.srcObject = captureStream;
    recordingStartedAt = Date.now();
    recorder.start(500);
    playRecordingCue('start');
    showView('recording');
    timer.textContent = '00:00';
    timerInterval = setInterval(updateTimer, 250);
  } catch (error) {
    await window.clickfilm.stopAudioCapture().catch(() => {});
    alert(`${tr('recordingFailed')}\n${error.message || error.name}`);
  }
}

function updateTimer() {
  timer.textContent = formatTime((Date.now() - recordingStartedAt) / 1000);
}

async function stopRecording() {
  if (!recorder || recorder.state !== 'recording') return;
  clearInterval(timerInterval);
  recorder.stop();
  captureStream.getTracks().forEach(track => track.stop());
  await window.clickfilm.stopAudioCapture();
  playRecordingCue('stop');
}

function finishRecording() {
  const blob = new Blob(chunks, { type: recorder.mimeType });
  rawRecordingBlob = blob;
  localRecordingPromise = blob.arrayBuffer()
    .then(buffer => window.clickfilm.storeRecording(new Uint8Array(buffer)));
  if (rawRecordingUrl) URL.revokeObjectURL(rawRecordingUrl);
  rawRecordingUrl = URL.createObjectURL(blob);
  playbackVideo.src = rawRecordingUrl;
  playbackVideo.onloadedmetadata = () => {
    document.querySelector('#duration-label').textContent = formatTime(playbackVideo.duration);
  };
  showView('editor');
}

async function exportVideo() {
  if (!playbackVideo.duration || !rawRecordingBlob) return;
  document.querySelector('#export-button').disabled = true;
  exportStatus.classList.remove('hidden');
  exportProgress.textContent = '0%';
  try {
    exportStatus.querySelector('strong').textContent = tr('exportRendering');
    exportStatus.querySelector('small').textContent = tr('exportHelp');
    exportProgress.textContent = 'FAST';
    await localRecordingPromise;
    const result = await window.clickfilm.exportMp4({});
    if (result.ok) {
      exportStatus.querySelector('strong').textContent = tr('exportComplete');
      exportStatus.querySelector('small').textContent = result.path;
      exportProgress.textContent = '100%';
      setTimeout(() => exportStatus.classList.add('hidden'), 5000);
    } else if (!result.canceled) {
      throw new Error(result.error || 'MP4 conversion failed.');
    } else {
      exportStatus.classList.add('hidden');
    }
  } catch (error) {
    exportStatus.classList.add('hidden');
    alert(`${tr('exportFailed')}: ${error.message}`);
  } finally {
    document.querySelector('#export-button').disabled = false;
    exportStatus.querySelector('strong').textContent = 'Rendering your video…';
    exportStatus.querySelector('small').textContent = 'ClickFilm renders locally with FFmpeg. Keep the app open.';
  }
}

function resetProject() {
  playbackVideo.pause();
  playbackVideo.removeAttribute('src');
  playbackVideo.load();
  if (rawRecordingUrl) URL.revokeObjectURL(rawRecordingUrl);
  rawRecordingUrl = null;
  rawRecordingBlob = null;
  localRecordingPromise = null;
  window.clickfilm.clearRecording().catch(() => {});
  showView('welcome');
  loadCaptureSources();
  loadAudioApps();
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
