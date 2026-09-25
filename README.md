# ClickFilm

ClickFilm is a simple Windows screen recorder. Record one selected app, include audio only from the apps you choose, and save everything locally as an MP4.

## Download

[Download the latest Windows version](https://github.com/GodEwewer/ClickFilm/releases/latest) as an installer, portable app, or ZIP.

## How to use

1. Select the window you want to record.
2. Select one or more apps whose audio should be included.
3. Choose **High (24 Mbps)** or **Ultra (50 Mbps)** quality.
4. Start and stop recording with the button or your custom hotkey.
5. The MP4 is saved automatically to your selected folder.

The default folder is `Videos\ClickFilm`. Recordings are named like `Albion Online-25.09.26-1312.mp4`.

ClickFilm supports English, Simplified Chinese, and Traditional Chinese. Recordings stay on your computer and are never uploaded.

## Build from source

Requires Node.js 20+ and Windows 10 build 20348 or newer. Windows 11 is recommended for per-app audio.

```bash
npm install
npm start
npm run build:win
```

## License

MIT
