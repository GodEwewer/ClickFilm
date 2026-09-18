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

let captureStream;
let recorder;
let chunks = [];
let recordingStartedAt = 0;
let timerInterval;
let rawRecordingUrl;
let zoomMarkers = [];
let selectedZoomId = null;
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
window.clickfilm.onRecordingToggle(() => {
  if (recorder?.state === 'recording') stopRecording();
  else if (!views.recording.classList.contains('hidden')) return;
  else if (!views.editor.classList.contains('hidden')) {
    hotkeyStatus.textContent = 'Start a new project before recording again.';
  } else startRecording();
});

const savedHotkey = localStorage.getItem('recordingHotkey') || 'CommandOrControl+Shift+R';
setHotkey(savedHotkey, false);

function beginHotkeyCapture() {
  hotkeyButton.classList.add('listening');
  hotkeyButton.textContent = 'Press shortcut…';
  hotkeyStatus.textContent = 'Use Ctrl, Alt, Shift, or the Windows key plus another key.';
  window.addEventListener('keydown', captureHotkey, { once: true, capture: true });
}

function captureHotkey(event) {
  event.preventDefault();
  event.stopPropagation();
  const accelerator = acceleratorFromEvent(event);
  if (!accelerator) {
    hotkeyButton.classList.remove('listening');
    setHotkey(localStorage.getItem('recordingHotkey') || 'CommandOrControl+Shift+R', false);
    hotkeyStatus.textContent = 'That shortcut needs a modifier and a letter, number, or function key.';
    return;
  }
  setHotkey(accelerator, true);
}

async function setHotkey(accelerator, persist) {
  const result = await window.clickfilm.setRecordingHotkey(accelerator);
  hotkeyButton.classList.remove('listening');
  renderHotkey(result.accelerator);
  if (result.ok) {
    if (persist) localStorage.setItem('recordingHotkey', result.accelerator);
    hotkeyStatus.textContent = 'Shortcut ready.';
  } else {
    hotkeyStatus.textContent = 'Windows is already using that shortcut. The previous shortcut is still active.';
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
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30, max: 60 }, cursor: 'always' },
      audio: true
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
    if (error.name !== 'NotAllowedError') alert(`Could not start recording: ${error.message}`);
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
}

function finishRecording() {
  const blob = new Blob(chunks, { type: recorder.mimeType });
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
  if (!playbackVideo.duration) return;
  document.querySelector('#export-button').disabled = true;
  exportStatus.classList.remove('hidden');
  exportProgress.textContent = '0%';
  try {
    const webm = await renderStyledVideo();
    exportStatus.querySelector('strong').textContent = 'Converting to MP4…';
    const result = await window.clickfilm.exportMp4(new Uint8Array(await webm.arrayBuffer()));
    if (result.ok) {
      exportStatus.querySelector('strong').textContent = 'Export complete';
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
    alert(`Export failed: ${error.message}`);
  } finally {
    document.querySelector('#export-button').disabled = false;
    exportStatus.querySelector('strong').textContent = 'Rendering your video…';
    exportStatus.querySelector('small').textContent = 'ClickFilm renders locally in real time. Keep the app open.';
  }
}

async function renderStyledVideo() {
  const sizes = {
    landscape: [1920, 1080],
    portrait: [1080, 1920],
    square: [1080, 1080]
  };
  [canvas.width, canvas.height] = sizes[settings.format];
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
  const [start, end] = backgrounds[settings.background];
  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, start);
  gradient.addColorStop(1, end);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  const margin = settings.format === 'portrait' ? width * .065 : Math.min(width, height) * .075;
  const target = fitRect(playbackVideo.videoWidth, playbackVideo.videoHeight, width - margin * 2, height - margin * 2);
  const dx = (width - target.width) / 2;
  const dy = (height - target.height) / 2;
  const motion = zoomAt(playbackVideo.currentTime * 1000);
  const sourceWidth = playbackVideo.videoWidth / motion.scale;
  const sourceHeight = playbackVideo.videoHeight / motion.scale;
  const sourceX = Math.max(0, Math.min(playbackVideo.videoWidth - sourceWidth, motion.x * playbackVideo.videoWidth - sourceWidth / 2));
  const sourceY = Math.max(0, Math.min(playbackVideo.videoHeight - sourceHeight, motion.y * playbackVideo.videoHeight - sourceHeight / 2));

  context.save();
  context.shadowColor = 'rgba(0,0,0,.35)';
  context.shadowBlur = 46;
  context.shadowOffsetY = 22;
  roundedRect(context, dx, dy, target.width, target.height, 18);
  context.fillStyle = '#050608';
  context.fill();
  context.restore();
  context.save();
  roundedRect(context, dx, dy, target.width, target.height, 18);
  context.clip();
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
  zoomMarkers = [];
  selectedZoomId = null;
  showView('welcome');
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
