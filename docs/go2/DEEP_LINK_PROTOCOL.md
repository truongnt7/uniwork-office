# GO-2 — deep link protocol

Scheme: `uniwork`

Paths:

- `/office/open` (`uniwork://office/open?token=…`) — Bridge launch of a Work Product session
- `/office/app` (`uniwork://office/app?kind=docs|sheets|slides|pdf|markdown|html`) — open a new UniOffice editor tab (no file path or credentials in the URL)

Registration:

- electron-builder `protocols.schemes: ['uniwork']`
- `app.setAsDefaultProtocolClient('uniwork')`
- macOS `open-url`
- Windows/Linux argv + `second-instance`

Parser (`parseOfficeLaunchUrl`) rejects:

- other schemes
- `jwt`, `access_token`, `file`, `path`, `url`, `storage`, `apikey`, `service_role`
- JWT-shaped tokens (`a.b.c`)
- missing/short tokens

The URL never opens an arbitrary local file. Only the Bridge exchange + download path may write into `<userData>/bridge-sessions/`.

If the app is already running, the second instance forwards the URL to the first window (no extra uncontrolled windows).
