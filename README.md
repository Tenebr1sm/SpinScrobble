# SpinScrobble
In development web app that listens to a record player via computer and automatically scrobbles through last.fm.

## Live dashboard

Run the Node backend (`node server.js`) and audio capture (`python main_capture.py`) as usual. In another terminal, start the Expo dashboard:

```powershell
cd track-recognition\dashboard
npm run web
```

The dashboard polls `http://localhost:3000/api/current-track` and displays the latest track after AudD confirms it, including album artwork when AudD returns artwork metadata. If artwork is unavailable, the dashboard shows a placeholder.

For Expo Go on a phone, set `EXPO_PUBLIC_API_URL` in `track-recognition\dashboard\.env` to the computer's LAN address, for example `http://192.168.1.20:3000`, then restart Expo. The phone and computer must be on the same network, and the computer's firewall must allow the connection.
