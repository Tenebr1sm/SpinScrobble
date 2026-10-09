#!/bin/bash

echo "========================================"
echo "       Starting SpinScrobble...         "
echo "========================================"

#check if --verbose flag was passed
VERBOSE=0
for arg in "$@"; do
    if [ "$arg" == "--verbose" ]; then
        VERBOSE=1
    fi
done

#catch ctrl+c to cleanly shut down all background processes at once
trap "echo -e '\nShutting down SpinScrobble...'; kill 0; exit" SIGINT

#start Node.js server in the background (by using &)
if [ -d "track-recognition" ]; then
    echo "Starting Node.js backend..."
    cd track-recognition

    #use -eq to strictly compare numbers instead of strings
    if [ $VERBOSE -eq 1 ]; then
        node server.js &
    else
        # "> /dev/null 2>&1 &" tells the system to discard all standard output
        node server.js > /dev/null 2>&1 &
    fi
    cd ..
else
    echo "Error: track-recognition directory not found :("
    exit 1
fi

# Give the backend a second to boot up and open port 3000
sleep 1

#start Expo dashboard in background
if [ -d "track-recognition/dashboard" ]; then
    echo "Starting React Expo dashboard..."
    cd track-recognition/dashboard
    if [ $VERBOSE -eq 1 ]; then
        BROWSER=none npm run web &
    else
        #block the browser from launching by setting the environment variable (was crashing trying to open one)
        BROWSER=none npm run web > /dev/null 2>&1 &
    fi
    cd ../..
else
    echo "Error: dashboard directory not found :("
    exit 1
fi

#give react server a few secs to start port 8081
sleep 3

#start the Python hardware capture in the foreground (no & here)
if [ -d "hardware" ]; then
    echo -e "Starting Python hardware engine...\n"
    cd hardware
    source venv/bin/activate

    if [ $VERBOSE -eq 0 ]; then
        #delayed background subshell block () to print URLs after python loads
        (
            sleep 2
            #grab the host's local IP and print URLs manually
            #awk splits the output after every space of "hostname -I" and gets the first line "$1", kinda like strtok() in C
            HOST_IP=$(hostname -I | awk '{print $1}')
            echo "Dashboard is ready: "
            echo "  > Local: http://localhost:8081"
            echo "  > Network: http://$HOST_IP:8081"
        ) &
    fi

    python main_capture.py "$@"  #takes in argument/flag such as --verbose and sends directly to python script
else
    echo "Error: hardware directory not found :("
    kill 0
    exit 1
fi

#keeps script alive waiting for background processes
wait