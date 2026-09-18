# ClickFilm

ClickFilm is a local-first Windows screen recorder that turns an ordinary recording into a polished product demo. Record naturally, add custom animated zooms in the editor, choose a presentation background, and export an MP4.

## MVP features

- Native screen or window picker
- Screen and optional system-audio recording
- Customisable global start/stop recording hotkey (`Ctrl+Shift+R` by default)
- Manual zooms with editable focal point, start time, duration, and strength
- Smooth animated zoom preview and timeline segments
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

Click **Start recording**, choose a screen or window, and carry out the demonstration. Stop the recording, move the playhead to a moment you want to emphasize, and click **Add zoom**. Click the preview to set the focal point, then adjust the zoom's timing, duration, and strength before exporting.

To change the recording shortcut, click the hotkey shown below **Start recording** and press a new key combination. ClickFilm remembers it on that computer.

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

- Trimming and silence removal
- Captions and microphone recording
- Camera overlay
- GIF export
- Faster-than-real-time rendering
- Brand presets and 4K Pro exports

## License

MIT
