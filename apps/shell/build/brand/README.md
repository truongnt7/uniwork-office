# UniWork brand lockup → app icon

- `uniwork-lockup-source.jpg` — full wordmark lockup (source of truth for the W mark)
- `uniwork-w-mark.png` — cropped stylized W only (purple→cyan ribbon + dots)

Regenerate Dock / taskbar / installer / Linux icons:

```bash
python3 tools/gen-app-icons.py
```

That refreshes `apps/shell/build/icon.png`, `icon-mac.png`, `icon.icns`, `icon.ico`,
`icons/**`, and `apps/shell/src/renderer/src/assets/app-icon.png`.
