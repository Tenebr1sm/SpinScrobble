# SpinScrobble
In development web app that listens to a record player via computer and automatically scrobbles through last.fm.

## Setup
To setup, run these commands in bash. Git Bash is recommended for Windows.

Run `./setup.sh` and follow the steps it gives to add the API keys to the .env files. 

After that, run `./start.sh` to start the program. 

To run start.sh in verbose mode, simply add the `--verbose` flag to the command: `./start.sh --verbose`

## Live dashboard
The dashboard polls `http://localhost:3000/api/current-track` and displays the latest track after AudD confirms it, including album artwork when AudD returns artwork metadata. If artwork is unavailable, the dashboard shows a placeholder.

For Expo Go on a phone, set `EXPO_PUBLIC_API_URL` in `track-recognition\dashboard\.env` to the computer's LAN address, for example `http://192.168.1.20:3000`, then restart Expo. The phone and computer must be on the same network, and the computer's firewall must allow the connection.
