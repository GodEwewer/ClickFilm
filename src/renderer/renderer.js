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
const previewStage = document.querySelector('#preview-stage');
const videoWindow = document.querySelector('#video-window');
const markerTrack = document.querySelector('#marker-track');
const playhead = document.querySelector('#playhead');
const exportStatus = document.querySelector('#export-status');
const exportProgress = document.querySelector('#export-progress');
const canvas = document.querySelector('#render-canvas');
const focusTarget = document.querySelector('#focus-target');
const zoomControls = document.querySelector('#zoom-controls');
const hotkeyButton = document.querySelector('#hotkey-button');
const hotkeyStatus = document.querySelector('#hotkey-status');
const sourceList = document.querySelector('#source-list');
const selectedSourceLabel = document.querySelector('#selected-source-label');
const audioList = document.querySelector('#audio-list');
const languageSelect = document.querySelector('#language-select');

const translations = {
  en: {
    language: 'Language', privacy: 'Everything stays on this computer', eyebrow: 'SCREEN RECORDING, AUTOMATICALLY POLISHED',
    hero1: 'Record normally.', hero2: 'Look professionally edited.', intro: 'Record one app, then add precise, animated zooms exactly where you want them—without uploading your recording anywhere.',
    chooseWindow: 'Choose a window to record', chooseWindowHelp: 'Only this window will appear in the video', refresh: 'Refresh', findingWindows: 'Finding open windows…',
    chooseAudio: 'Choose app audio', chooseAudioHelp: 'Select any number of apps, or none for a silent recording', findingApps: 'Finding apps…', audioSupport: 'Only checked apps will be included. Other system sounds are excluded.',
    startRecording: 'Start recording', selectWindowFirst: 'Select a window above first', recordingHotkey: 'Recording hotkey', hotkeyHelp: 'Works while ClickFilm is in the background', hotkeyPrompt: 'Click, then press your shortcut',
    step1: 'Record your screen', step1Help: 'Use your app naturally.', step2: 'Design your zooms', step2Help: 'Choose the area, timing, and strength.', step3: 'Export and share', step3Help: 'Ready-to-post MP4.',
    recording: 'Recording', recordNaturally: 'Record naturally — zooms are added later', stopRecording: 'Stop recording', recordingHint: 'Your recording stays untouched until you customise it in the editor.',
    project: 'PROJECT', untitled: 'Untitled recording', newRecording: 'New recording', exportMp4: 'Export MP4', format: 'Format', background: 'Background', none: 'None', noneHelp: "Choose None to preserve the recording's native resolution and aspect ratio.",
    customZooms: 'Custom zooms', addZoom: '+ Add zoom', zoomHelp: 'Move the playhead, add a zoom, then click the preview to choose its focus.', start: 'Start', duration: 'Duration', strength: 'Strength', deleteZoom: 'Delete selected zoom', customZoomsStat: 'custom zooms', durationStat: 'duration',
    pressShortcut: 'Press shortcut…', shortcutInstructions: 'Use Ctrl, Alt, Shift, or the Windows key plus another key.', shortcutInvalid: 'That shortcut needs a modifier and a letter, number, or function key.', shortcutReady: 'Shortcut ready.', shortcutUsed: 'Windows is already using that shortcut. The previous shortcut is still active.',
    noWindows: 'No recordable windows found. Open the app you want to record, then press Refresh.', noApps: 'No apps with open windows found. Open an app, play audio, then press Refresh.', findingError: 'Could not load the list.', startNewFirst: 'Start a new project before recording again.',
    exportRendering: 'Rendering locally with FFmpeg…', exportHelp: 'This runs as fast as your computer allows—no real-time playback required.', exportComplete: 'Export complete', exportFailed: 'Export failed', recordingFailed: 'Could not start recording. Refresh the window list and try again.'
  },
  'zh-CN': {
    language: '语言', privacy: '所有内容仅保存在此电脑上', eyebrow: '屏幕录制，自动美化', hero1: '正常录制。', hero2: '呈现专业剪辑效果。', intro: '录制一个应用窗口，再在需要的位置添加精准流畅的缩放效果，无需上传任何录像。',
    chooseWindow: '选择要录制的窗口', chooseWindowHelp: '视频中只会显示此窗口', refresh: '刷新', findingWindows: '正在查找已打开的窗口…', chooseAudio: '选择应用音频', chooseAudioHelp: '可选择多个应用，或不选择以录制静音视频', findingApps: '正在查找应用…', audioSupport: '只会收录已勾选应用的声音，其他系统声音将被排除。',
    startRecording: '开始录制', selectWindowFirst: '请先在上方选择一个窗口', recordingHotkey: '录制快捷键', hotkeyHelp: 'ClickFilm 在后台时仍可使用', hotkeyPrompt: '点击后按下新的快捷键', step1: '录制屏幕', step1Help: '正常使用你的应用。', step2: '设计缩放效果', step2Help: '选择区域、时间和缩放强度。', step3: '导出并分享', step3Help: '生成可直接发布的 MP4。',
    recording: '正在录制', recordNaturally: '正常录制——缩放效果稍后添加', stopRecording: '停止录制', recordingHint: '录像会保持原样，直到你在编辑器中进行调整。', project: '项目', untitled: '未命名录像', newRecording: '新建录像', exportMp4: '导出 MP4', format: '画面比例', background: '背景', none: '无', noneHelp: '选择“无”可保留录像的原始分辨率和宽高比。',
    customZooms: '自定义缩放', addZoom: '+ 添加缩放', zoomHelp: '移动播放指针并添加缩放，然后点击预览画面选择焦点。', start: '开始时间', duration: '持续时间', strength: '缩放强度', deleteZoom: '删除所选缩放', customZoomsStat: '个自定义缩放', durationStat: '时长',
    pressShortcut: '请按快捷键…', shortcutInstructions: '请使用 Ctrl、Alt、Shift 或 Windows 键搭配另一个按键。', shortcutInvalid: '快捷键必须包含修饰键以及字母、数字或功能键。', shortcutReady: '快捷键已启用。', shortcutUsed: '该快捷键已被 Windows 占用，之前的快捷键仍然有效。', noWindows: '未找到可录制的窗口。请打开目标应用后点击“刷新”。', noApps: '未找到带有窗口的应用。请打开应用并播放声音后点击“刷新”。', findingError: '无法加载列表。', startNewFirst: '请先新建项目再开始录制。',
    exportRendering: '正在使用 FFmpeg 本地渲染…', exportHelp: '将以电脑可达到的最快速度运行，无需实时播放。', exportComplete: '导出完成', exportFailed: '导出失败', recordingFailed: '无法开始录制。请刷新窗口列表后重试。'
  },
  'zh-TW': {
    language: '語言', privacy: '所有內容僅儲存在此電腦上', eyebrow: '螢幕錄製，自動美化', hero1: '正常錄製。', hero2: '呈現專業剪輯效果。', intro: '錄製一個應用程式視窗，再於需要的位置加入精準流暢的縮放效果，無需上傳任何錄影。',
    chooseWindow: '選擇要錄製的視窗', chooseWindowHelp: '影片中只會顯示此視窗', refresh: '重新整理', findingWindows: '正在尋找已開啟的視窗…', chooseAudio: '選擇應用程式音訊', chooseAudioHelp: '可選擇多個應用程式，或不選擇以錄製靜音影片', findingApps: '正在尋找應用程式…', audioSupport: '只會收錄已勾選應用程式的聲音，其他系統聲音將被排除。',
    startRecording: '開始錄製', selectWindowFirst: '請先在上方選擇一個視窗', recordingHotkey: '錄製快捷鍵', hotkeyHelp: 'ClickFilm 在背景執行時仍可使用', hotkeyPrompt: '點擊後按下新的快捷鍵', step1: '錄製螢幕', step1Help: '正常使用你的應用程式。', step2: '設計縮放效果', step2Help: '選擇區域、時間和縮放強度。', step3: '匯出並分享', step3Help: '產生可直接發佈的 MP4。',
    recording: '正在錄製', recordNaturally: '正常錄製——縮放效果稍後加入', stopRecording: '停止錄製', recordingHint: '錄影會保持原樣，直到你在編輯器中進行調整。', project: '專案', untitled: '未命名錄影', newRecording: '新增錄影', exportMp4: '匯出 MP4', format: '畫面比例', background: '背景', none: '無', noneHelp: '選擇「無」可保留錄影的原始解析度和長寬比。',
    customZooms: '自訂縮放', addZoom: '+ 加入縮放', zoomHelp: '移動播放指標並加入縮放，然後點擊預覽畫面選擇焦點。', start: '開始時間', duration: '持續時間', strength: '縮放強度', deleteZoom: '刪除所選縮放', customZoomsStat: '個自訂縮放', durationStat: '片長',
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
let zoomMarkers = [];
let selectedZoomId = null;
let selectedSourceId = null;
let capturingHotkey = false;
let settings = { format: 'landscape', background: 'aurora' };

const backgrounds = {
  aurora: ['#4f5ee7', '#b454cf'],
  ocean: ['#076585', '#45b5aa'],
  sunset: ['#f857a6', '#ff5858'],
  midnight: ['#111625', '#111625']
};

function showView(name) {
  Object.entries(views).forEach(([key, view]) => view.classList.toggle('hidden', key !== name));
}

startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
document.querySelector('#add-zoom').addEventListener('click', addCustomZoom);
document.querySelector('#delete-zoom').addEventListener('click', deleteSelectedZoom);
document.querySelector('#new-button').addEventListener('click', resetProject);
document.querySelector('#export-button').addEventListener('click', exportVideo);
hotkeyButton.addEventListener('click', beginHotkeyCapture);
document.querySelector('#refresh-sources').addEventListener('click', loadCaptureSources);
document.querySelector('#refresh-audio').addEventListener('click', loadAudioApps);
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
      video: { frameRate: { ideal: 30, max: 60 }, cursor: 'always' },
      audio: false
    });
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    recorder = new MediaRecorder(captureStream, { mimeType, videoBitsPerSecond: 10_000_000 });
    chunks = [];
    zoomMarkers = [];
    selectedZoomId = null;
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = finishRecording;
    captureStream.getVideoTracks()[0].addEventListener('ended', () => {
      if (recorder?.state === 'recording') stopRecording();
    });

    liveVideo.srcObject = captureStream;
    recordingStartedAt = Date.now();
    recorder.start(500);
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
    document.querySelector('#zoom-count').textContent = zoomMarkers.length;
    document.querySelector('#duration-label').textContent = formatTime(playbackVideo.duration);
    document.querySelector('#mid-time').textContent = formatTime(playbackVideo.duration / 2);
    document.querySelector('#end-time').textContent = formatTime(playbackVideo.duration);
    renderTimeline();
    syncZoomEditor();
  };
  playbackVideo.ontimeupdate = updatePreviewMotion;
  showView('editor');
}

function updatePreviewMotion() {
  if (!playbackVideo.duration) return;
  const ms = playbackVideo.currentTime * 1000;
  const motion = zoomAt(ms);
  videoWindow.style.transformOrigin = `${motion.x * 100}% ${motion.y * 100}%`;
  videoWindow.style.transform = `scale(${motion.scale})`;
  playhead.style.left = `${(playbackVideo.currentTime / playbackVideo.duration) * 100}%`;
}

function zoomAt(ms) {
  const marker = [...zoomMarkers].reverse().find(item => item.startMs <= ms && ms <= item.startMs + item.durationMs);
  if (!marker) return { x: .5, y: .5, scale: 1 };
  const age = ms - marker.startMs;
  const transition = Math.min(300, marker.durationMs * .25);
  const rampIn = ease(Math.min(1, age / transition));
  const rampOut = age > marker.durationMs - transition ? 1 - ease(Math.min(1, (age - marker.durationMs + transition) / transition)) : 1;
  const amount = Math.min(rampIn, rampOut);
  return { x: marker.x, y: marker.y, scale: 1 + (marker.scale - 1) * amount };
}

function ease(value) { return 1 - Math.pow(1 - value, 3); }

function renderTimeline() {
  markerTrack.querySelectorAll('.zoom-marker').forEach(node => node.remove());
  zoomMarkers.forEach(marker => {
    const node = document.createElement('button');
    node.className = `zoom-marker${marker.id === selectedZoomId ? ' selected' : ''}`;
    node.style.left = `${marker.startMs / (playbackVideo.duration * 10)}%`;
    node.style.width = `${Math.max(1.5, marker.durationMs / (playbackVideo.duration * 10))}%`;
    node.title = `Custom zoom at ${formatTime(marker.startMs / 1000)}`;
    node.addEventListener('click', () => selectZoom(marker.id));
    markerTrack.appendChild(node);
  });
}

function addCustomZoom() {
  if (!playbackVideo.duration) return;
  const durationMs = Math.min(1500, Math.max(500, (playbackVideo.duration - playbackVideo.currentTime) * 1000));
  const zoom = {
    id: crypto.randomUUID(),
    startMs: Math.min(playbackVideo.currentTime * 1000, Math.max(0, playbackVideo.duration * 1000 - durationMs)),
    durationMs,
    scale: 1.65,
    x: .5,
    y: .5
  };
  zoomMarkers.push(zoom);
  zoomMarkers.sort((a, b) => a.startMs - b.startMs);
  selectZoom(zoom.id);
}

function selectedZoom() { return zoomMarkers.find(item => item.id === selectedZoomId); }

function selectZoom(id) {
  selectedZoomId = id;
  const zoom = selectedZoom();
  if (zoom) playbackVideo.currentTime = zoom.startMs / 1000 + Math.min(.35, zoom.durationMs / 2000);
  renderTimeline();
  syncZoomEditor();
  updatePreviewMotion();
}

function deleteSelectedZoom() {
  zoomMarkers = zoomMarkers.filter(item => item.id !== selectedZoomId);
  selectedZoomId = zoomMarkers[0]?.id || null;
  renderTimeline();
  syncZoomEditor();
  updatePreviewMotion();
}

function syncZoomEditor() {
  const zoom = selectedZoom();
  document.querySelector('#zoom-count').textContent = zoomMarkers.length;
  document.querySelector('#zoom-empty').classList.toggle('hidden', Boolean(zoom));
  zoomControls.classList.toggle('hidden', !zoom);
  focusTarget.classList.toggle('hidden', !zoom);
  if (!zoom) return;
  const maxMs = playbackVideo.duration * 1000;
  const start = document.querySelector('#zoom-start');
  start.max = Math.max(0, maxMs - 500);
  start.value = zoom.startMs;
  document.querySelector('#zoom-start-output').textContent = formatPrecise(zoom.startMs / 1000);
  document.querySelector('#zoom-duration').value = zoom.durationMs / 1000;
  document.querySelector('#zoom-duration-output').textContent = `${(zoom.durationMs / 1000).toFixed(1)}s`;
  document.querySelector('#zoom-strength').value = zoom.scale;
  document.querySelector('#zoom-output').textContent = `${zoom.scale.toFixed(2)}×`;
  focusTarget.style.left = `${zoom.x * 100}%`;
  focusTarget.style.top = `${zoom.y * 100}%`;
}

document.querySelector('#zoom-start').addEventListener('input', event => {
  const zoom = selectedZoom();
  if (!zoom) return;
  zoom.startMs = Number(event.target.value);
  document.querySelector('#zoom-start-output').textContent = formatPrecise(zoom.startMs / 1000);
  playbackVideo.currentTime = zoom.startMs / 1000;
  zoomMarkers.sort((a, b) => a.startMs - b.startMs);
  renderTimeline();
});

document.querySelector('#zoom-duration').addEventListener('input', event => {
  const zoom = selectedZoom();
  if (!zoom) return;
  zoom.durationMs = Number(event.target.value) * 1000;
  document.querySelector('#zoom-duration-output').textContent = `${Number(event.target.value).toFixed(1)}s`;
  renderTimeline();
  updatePreviewMotion();
});

videoWindow.addEventListener('click', event => {
  if (event.target === playbackVideo && !selectedZoom()) return;
  const zoom = selectedZoom();
  if (!zoom) return;
  const bounds = videoWindow.getBoundingClientRect();
  zoom.x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
  zoom.y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  syncZoomEditor();
  updatePreviewMotion();
});

document.querySelector('#format-control').addEventListener('click', event => {
  const button = event.target.closest('button[data-format]');
  if (!button) return;
  settings.format = button.dataset.format;
  event.currentTarget.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
  previewStage.classList.remove('landscape', 'portrait', 'square');
  previewStage.classList.add(settings.format);
});

document.querySelector('#background-control').addEventListener('click', event => {
  const button = event.target.closest('button[data-background]');
  if (!button) return;
  settings.background = button.dataset.background;
  event.currentTarget.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
  previewStage.classList.remove(...Object.keys(backgrounds));
  previewStage.classList.remove('none');
  previewStage.classList.add(settings.background);
});

document.querySelector('#zoom-strength').addEventListener('input', event => {
  const zoom = selectedZoom();
  if (!zoom) return;
  zoom.scale = Number(event.target.value);
  document.querySelector('#zoom-output').textContent = `${zoom.scale.toFixed(2)}×`;
  updatePreviewMotion();
});

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
    const result = await window.clickfilm.exportMp4({
      spec: {
        format: settings.format,
        background: settings.background,
        zooms: zoomMarkers,
        sourceWidth: playbackVideo.videoWidth,
        sourceHeight: playbackVideo.videoHeight
      }
    });
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

async function renderStyledVideo() {
  const sizes = {
    landscape: [1920, 1080],
    portrait: [1080, 1920],
    square: [1080, 1080]
  };
  [canvas.width, canvas.height] = settings.background === 'none'
    ? [playbackVideo.videoWidth, playbackVideo.videoHeight]
    : sizes[settings.format];
  const context = canvas.getContext('2d');
  const outputStream = canvas.captureStream(30);
  const sourceCapture = playbackVideo.captureStream?.();
  sourceCapture?.getAudioTracks().forEach(track => outputStream.addTrack(track));
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm';
  const writer = new MediaRecorder(outputStream, { mimeType, videoBitsPerSecond: 14_000_000 });
  const rendered = [];
  writer.ondataavailable = event => { if (event.data.size) rendered.push(event.data); };
  const done = new Promise(resolve => { writer.onstop = () => resolve(new Blob(rendered, { type: mimeType })); });

  playbackVideo.pause();
  playbackVideo.currentTime = 0;
  playbackVideo.muted = false;
  writer.start(500);
  await playbackVideo.play();

  await new Promise(resolve => {
    const draw = () => {
      drawFrame(context);
      exportProgress.textContent = `${Math.min(99, Math.round(playbackVideo.currentTime / playbackVideo.duration * 100))}%`;
      if (playbackVideo.ended) resolve();
      else requestAnimationFrame(draw);
    };
    draw();
  });
  writer.stop();
  playbackVideo.pause();
  playbackVideo.currentTime = 0;
  return done;
}

function drawFrame(context) {
  const width = canvas.width;
  const height = canvas.height;
  if (settings.background !== 'none') {
    const [start, end] = backgrounds[settings.background];
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  const margin = settings.background === 'none' ? 0 : settings.format === 'portrait' ? width * .065 : Math.min(width, height) * .075;
  const target = fitRect(playbackVideo.videoWidth, playbackVideo.videoHeight, width - margin * 2, height - margin * 2);
  const dx = (width - target.width) / 2;
  const dy = (height - target.height) / 2;
  const motion = zoomAt(playbackVideo.currentTime * 1000);
  const sourceWidth = playbackVideo.videoWidth / motion.scale;
  const sourceHeight = playbackVideo.videoHeight / motion.scale;
  const sourceX = Math.max(0, Math.min(playbackVideo.videoWidth - sourceWidth, motion.x * playbackVideo.videoWidth - sourceWidth / 2));
  const sourceY = Math.max(0, Math.min(playbackVideo.videoHeight - sourceHeight, motion.y * playbackVideo.videoHeight - sourceHeight / 2));

  if (settings.background !== 'none') {
    context.save();
    context.shadowColor = 'rgba(0,0,0,.35)';
    context.shadowBlur = 46;
    context.shadowOffsetY = 22;
    roundedRect(context, dx, dy, target.width, target.height, 18);
    context.fillStyle = '#050608';
    context.fill();
    context.restore();
  }
  context.save();
  if (settings.background !== 'none') {
    roundedRect(context, dx, dy, target.width, target.height, 18);
    context.clip();
  }
  context.drawImage(playbackVideo, sourceX, sourceY, sourceWidth, sourceHeight, dx, dy, target.width, target.height);
  context.restore();
}

function fitRect(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return { width: sourceWidth * ratio, height: sourceHeight * ratio };
}

function roundedRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.roundRect(x, y, width, height, r);
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
  zoomMarkers = [];
  selectedZoomId = null;
  showView('welcome');
  loadCaptureSources();
  loadAudioApps();
}

function formatPrecise(seconds) {
  return `${formatTime(seconds)}.${Math.floor((seconds % 1) * 10)}`;
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
