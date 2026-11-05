# SpinScrobble
In development web app that listens to a record player via computer and automatically scrobbles through last.fm.

## Setup
To setup, run these commands in bash. Git Bash is recommended for Windows.

Run `./setup.sh` and follow the steps it gives to add the API keys to the .env files. 

After that, run `./start.sh` to start the program. 

To run start.sh in verbose mode, simply add the `--verbose` flag to the command: `./start.sh --verbose`

## Live dashboard
The dashboard polls `http://localhost:3000/api/current-track` and displays the latest track after AudD confirms it, including album artwork when AudD returns artwork metadata. If artwork is unavailable, the dashboard shows a placeholder.

For Expo Go on a phone, set `EXPO_PUBLIC_API_URL` in `track-recognition\dashboard\.env` to the computer's LAN address, for example `http://192.168.1.20:3000` or `http://localhost:3000` if on same machine, then restart Expo. The phone and computer must be on the same network, and the computer's firewall must allow the connection.

## Discord Rich Presence Desktop Companion

There is an included Discord RPC tool in the `tools/discord_companion` folder that polls the SpinScrobble API and displays what vinyl you are currently listening to on your desktop Discord profile. 

For this to work, the SpinScrobble backend server must be running either locally on your machine or on another device on the same local network (like a Raspberry Pi).

### Prerequisites
* You must have Node.js installed on your desktop machine to run the bridge.
* The Discord desktop client must be open and running.

### Setup Instructions

1. On the Discord client machine, clone this repository or download it as a ZIP file and extract it.
2. Navigate to the `tools/discord_companion` folder, create an `.env` file, and add a `PI_URL` variable to point to your backend server's local IP address, port, and API endpoint:

   ```env
   PI_URL=http://192.168.1.2:3000/api/current-track
   ```
   *(Note: Use `PI_URL=http://localhost:3000/api/current-track` if running on the same machine)*

3. Open a terminal in that directory, install the dependencies, and start the node server:

   ```bash
   cd tools/discord_companion
   npm install
   node discord-bridge.js
   ```
