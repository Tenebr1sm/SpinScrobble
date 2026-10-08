#!/bin/bash

echo "========================================"
echo "       Starting SpinScrobble...         "
echo "========================================"

#catch ctrl+c to cleanly shut down all background processes at once
trap "echo -e '\nShutting down SpinScrobble...'; kill 0; exit" SIGINT

#start node.js server in the background (by using &)
if [ -d "track-recognition" ]; then
    echo "Starting Node.js backend..."
    cd track-recognition
    node server.js &
    cd ..
else
    echo "Error: track-recognition directory not found :("
    exit 1
fi

# Give the backend a second to boot up and open port 3000
sleep 1

#start expo dashboard in background
if [ -d "track-recognition/dashboard" ]; then
    echo "Starting React Expo dashboard..."
    cd track-recognition/dashboard
    
    #block the browser from launching by setting the environment variable (was crashing trying to open one)
    BROWSER=none npm run web &
    
    cd ../..
else
    echo "Error: dashboard directory not found :("
    exit 1
fi

#give react server a few secs to start port 8081
sleep 3

#start the python hardware capture in the foreground (no & here)
if [ -d "hardware" ]; then
    echo -e "Starting Python hardware engine...\n"
    cd hardware
    source venv/bin/activate
    python main_capture.py "$@"  #takes in argument/flag such as --verbose and sends directly to python script
else
    echo "Error: hardware directory not found :("
    kill 0
    exit 1
fi

#keeps script alive waiting for background processes
wait