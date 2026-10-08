#!/bin/bash

echo -e "Setting up SpinScrobble... \n"

#node install
if [ -d "track-recognition" ]; then
    cd track-recognition

    echo -e "Installing node.js dependencies...\n"

    if [ -f "package.json" ]; then
        npm install
        echo "node dependencies installed"
    else 
        echo "package.json could not be found. skipping npm install :("
    fi

    cd ..
fi

#react + expo install
if [ -d "track-recognition/dashboard" ]; then
    cd track-recognition/dashboard

    echo -e "Installing frontend react and expo dependencies...\n"

    if [ -f "package.json" ]; then
        npm install
        echo "node dependencies installed"
    else 
        echo "package.json could not be found. skipping npm install :("
    fi

    cd ../..
fi

#python venv setup
echo -e "Setting up virtual environment...\n"

if [ -d "hardware" ]; then
    cd hardware
    
    #create venv
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "venv created in $(pwd)"
    else
        echo "venv already exists"
    fi

    #activate and install requirements
    source venv/bin/activate
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
        echo "Python dependencies installed"
    else
        echo "No requirements.txt found, skipping python install :( "
    fi
    deactivate
    
    #go back to the root directory
    cd ..
else
    echo "hardware directory not found :("
fi

#setup track-recognition .env
echo -e "\nChecking environment variables..."
if [ ! -f "track-recognition/.env" ]; then
    echo "Creating a template .env file..."
    cat <<EOT >> track-recognition/.env
audD_key=

LASTFM_API_KEY=
LASTFM_SESSION_KEY=
EOT
    echo "=================== [ACTION REQUIRED!!!!] .env created. Open track-recognition/.env and add your API keys there. ==================="
else
    echo "trackrecognition/ .env file already exists"
fi

#create .env in track-recognition/dashboard/
if [ ! -f "track-recognition/dashboard/.env" ]; then
    echo "Creating a template dashboard .env file..."
    cat <<EOT >> track-recognition/dashboard/.env
EXPO_PUBLIC_API_URL=http://<IP_ADDR>:3000
EOT
    echo "=================== [ACTION REQUIRED!!!!] Update the IP address of the machine in track-recognition/dashboard/.env ==================="
else
    echo "Dashboard .env file already exists"
fi

echo -e "\n========== SETUP COMPLETE!!!!!!!!! =========="
echo "Run start.sh to run the program now!!"
echo "Make sure to check your .envs or it will scream at you!"

#echo -e "\nSteps to start process:"
#echo "Open track-recognition directory and run \"node ./server.js\""
#echo "Open the link it gives and authenticate with last.fm"
#echo "Copy session key into track-recognition/.env"
#echo "Kill and restart node server"
#echo "Open new terminal, open hardware/ directory and run \"python main_capture.py\""
#echo "Open another terminal (dont worry this is all just for now), go to track-recognition/dashboard directory, and run "npm run web" to start frontend dashboard server"

