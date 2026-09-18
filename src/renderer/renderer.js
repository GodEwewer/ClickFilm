const views = {
  welcome: document.querySelector('#welcome-view'),
  recording: document.querySelector('#recording-view'),
  editor: document.querySelector('#editor-view')
};
const startButton = document.querySelector('#start-button');
const stopButton = document.querySelector('#stop-button');
const manualZoomButton = document.querySelector('#manual-zoom');
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

let captureStream;
let recorder;
let chunks = [];
let recordingStartedAt = 0;
let timerInterval;
let unsubscribeTracker;
let rawRecordingUrl;
let cursorSamples = [];
let zoomMarkers = [];
let settings = { format: 'landscape', background: 'aurora', zoom: 1.65 };

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
manualZoomButton.addEventListener('click', () => addManualZoom());
document.querySelector('#new-button').addEventListener('click', resetProject);
document.querySelector('#export-button').addEventListener('click', exportVideo);

async function startRecording() {
  try {
    captureStream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 30, max: 60 }, cursor: 'never' },
      audio: true
    });
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : 'video/webm';
    recorder = new MediaRecorder(captureStream, { mimeType, videoBitsPerSecond: 10_000_000 });
    chunks = [];
    cursorSamples = [];
    zoomMarkers = [];
    recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
    recorder.onstop = finishRecording;
    captureStream.getVideoTracks()[0].addEventListener('ended', () => {
      if (recorder?.state === 'recording') stopRecording();
    });

    liveVideo.srcObject = captureStream;
    const tracker = await window.clickfilm.startTracker();
    recordingStartedAt = tracker.startedAt;
    document.querySelector('#hook-message').textContent = tracker.hookAvailable
      ? 'Automatic click tracking is active.'
      : 'Windows blocked automatic clicks. Use Ctrl+Shift+Z to add zooms.';
    unsubscribeTracker = window.clickfilm.onTrackerEvent(event => {
      const sample = { t: Math.max(0, event.at - recordingStartedAt), x: event.x, y: event.y };
      cursorSamples.push(sample);
      if (event.kind === 'click') zoomMarkers.push(sample);
    });

    recorder.start(500);
    showView('recording');
    timer.textContent = '00:00';
    timerInterval = setInterval(updateTimer, 250);
  } catch (error) {
    if (error.name !== 'NotAllowedError') alert(`Could not start recording: ${error.message}`);
  }
}

function addManualZoom() {
  const last = cursorSamples.at(-1) || { x: .5, y: .5 };
  zoomMarkers.push({ ...last, t: Date.now() - recordingStartedAt });
}

function updateTimer() {
  timer.textContent = formatTime((Date.now() - recordingStartedAt) / 1000);
}

async function stopRecording() {
  if (!recorder || recorder.state !== 'recording') return;
  clearInterval(timerInterval);
  await window.clickfilm.stopTracker();
  unsubscribeTracker?.();
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
  const marker = [...zoomMarkers].reverse().find(item => item.t <= ms && ms - item.t < 1900);
  if (!marker) return { x: .5, y: .5, scale: 1 };
  const age = ms - marker.t;
  const rampIn = ease(Math.min(1, age / 260));
  const rampOut = age > 1450 ? 1 - ease(Math.min(1, (age - 1450) / 450)) : 1;
  const amount = Math.min(rampIn, rampOut);
  return { x: marker.x, y: marker.y, scale: 1 + (settings.zoom - 1) * amount };
}

function ease(value) { return 1 - Math.pow(1 - value, 3); }

function renderTimeline() {
  markerTrack.querySelectorAll('.zoom-marker').forEach(node => node.remove());
  zoomMarkers.forEach(marker => {
    const node = document.createElement('i');
    node.className = 'zoom-marker';
    node.style.left = `${Math.min(100, marker.t / (playbackVideo.duration * 10))}%`;
    node.title = `Zoom at ${formatTime(marker.t / 1000)}`;
    markerTrack.appendChild(node);
  });
}

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
  settings.zoom = Number(event.target.value);
  document.querySelector('#zoom-output').textContent = `${settings.zoom.toFixed(2)}×`;
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
  drawCursor(context, dx, dy, target.width, target.height, motion);
  context.restore();
}

function drawCursor(context, dx, dy, width, height, motion) {
  const time = playbackVideo.currentTime * 1000;
  const index = lowerBound(cursorSamples, time);
  const current = cursorSamples[Math.min(index, cursorSamples.length - 1)];
  if (!current) return;
  const cursorX = dx + ((current.x - (motion.x - .5 / motion.scale)) * motion.scale) * width;
  const cursorY = dy + ((current.y - (motion.y - .5 / motion.scale)) * motion.scale) * height;
  context.save();
  context.translate(cursorX, cursorY);
  context.scale(Math.max(1, canvas.width / 1200), Math.max(1, canvas.width / 1200));
  context.beginPath();
  context.moveTo(0, 0);
  context.lineTo(0, 25);
  context.lineTo(7, 19);
  context.lineTo(12, 31);
  context.lineTo(18, 28);
  context.lineTo(13, 17);
  context.lineTo(23, 16);
  context.closePath();
  context.fillStyle = '#fff';
  context.strokeStyle = '#111';
  context.lineWidth = 2;
  context.fill();
  context.stroke();
  context.restore();
}

function lowerBound(samples, time) {
  let low = 0;
  let high = samples.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (samples[mid].t < time) low = mid + 1;
    else high = mid;
  }
  return low;
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
  cursorSamples = [];
  zoomMarkers = [];
  showView('welcome');
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}
