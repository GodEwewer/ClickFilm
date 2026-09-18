# ClickFilm

ClickFilm is a local-first Windows screen recorder that turns an ordinary recording into a polished product demo. It records cursor movement and clicks, creates automatic animated zooms, adds a presentation background, and exports an MP4.

## MVP features

- Native screen or window picker
- Screen and optional system-audio recording
- Global cursor tracking
- Automatic zoom markers on mouse clicks
- `Ctrl+Shift+Z` manual zoom marker while recording
- Smooth animated zoom preview
- Gradient or solid presentation backgrounds
- 16:9, 9:16, and 1:1 output formats
- Local MP4 rendering through FFmpeg
- No account, cloud upload, analytics, or paid API

## Run locally

Requirements: Node.js 20+ and Windows 10 or 11.

```bash
npm install
npm start
```

Click **Start recording**, choose a screen or window, and carry out the demonstration. ClickFilm automatically places zooms where you click. Stop the recording, review it, select a style, and export the result.

> Global click detection uses `uiohook-napi`. If Windows blocks the hook or it is unavailable, recording still works and `Ctrl+Shift+Z` can add manual zooms.

## Build the Windows installer

```bash
npm install
npm run build:win
```

The installer and portable executable are written to `release/`. The included GitHub Actions workflow also builds both files on a Windows runner.

## Current MVP limitations

- Primary-display recording gives the most accurate cursor alignment.
- Rendering occurs in real time, so a one-minute recording takes roughly one minute to export.
- Code signing is not configured, so Windows SmartScreen may warn about unsigned community builds.
- Microphone and webcam tracks are planned for a later version.

## Roadmap

- Editable zoom timeline
- Trimming and silence removal
- Captions and microphone recording
- Camera overlay
- GIF export
- Faster-than-real-time rendering
- Brand presets and 4K Pro exports

## License

MIT
