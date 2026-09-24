# ClickFilm

ClickFilm is a local-first Windows screen recorder that captures a selected app in high quality, isolates audio from chosen applications, and exports a full-resolution MP4.

## MVP features

- Native screen or window picker
- One selected window per recording
- OBS-style app audio picker: include multiple apps and exclude all unselected sounds
- Customisable global start/stop recording hotkey (`Ctrl+Shift+R` by default)
- Up to 4K/60 fps capture when supported by the selected window and system
- High-bitrate VP9 source recording and high-quality H.264 export
- Native-resolution export that preserves the recorded window's aspect ratio
- Audible start and stop recording cues
- Persistent default save folder (`Videos\\ClickFilm` initially)
- Date-and-time filenames such as `ClickFilm-DATE(24.09.26)-TIME(22.35).mp4`
- Automatic MP4 saving to the default folder when recording stops
- Fast local finalisation that copies the video stream instead of re-rendering every frame
- No account, cloud upload, analytics, or paid API
- English, Simplified Chinese, and Traditional Chinese interface languages

## Run locally

Requirements: Node.js 20+ and Windows 10 build 20348 or newer (Windows 11 recommended for per-app audio).

```bash
npm install
npm start
```

Click **Start recording**, choose a window and the applications whose audio should be included, then carry out the demonstration. ClickFilm plays a short cue when recording starts and stops. Review the result, then export the high-quality MP4.

To change the recording shortcut, click the hotkey shown below **Start recording** and press a new key combination. ClickFilm remembers it on that computer.

## Build the Windows installer

```bash
npm install
npm run build:win
```

The installer and portable executable are written to `release/`. The included GitHub Actions workflow also builds both files on a Windows runner.

The Windows workflow compiles the bundled ApplicationLoopback helper before packaging. It uses Microsoft's Windows Process Loopback API to create one isolated WAV track per selected app. ClickFilm mixes those tracks locally during MP4 export.

## Current MVP limitations

- Primary-display recording gives the most accurate cursor alignment.
- Export speed depends on resolution and edits, but it is no longer limited to the recording's duration.
- Code signing is not configured, so Windows SmartScreen may warn about unsigned community builds.
- Microphone and webcam tracks are planned for a later version.

## Roadmap

- Trimming and silence removal
- Captions and microphone recording
- Camera overlay
- GIF export
- Brand presets and 4K Pro exports

## License

MIT
