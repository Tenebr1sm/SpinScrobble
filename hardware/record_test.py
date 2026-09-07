# Script to record clips yourself from a record player to test in rms_detector.py

import os
import sounddevice as sd
from scipy.io.wavfile import write

SAMPLE_RATE = 44100
CHANNELS = 2

# Safely route to hardware/samples
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(BASE_DIR, "samples")

def get_turntable_index():
    for idx, dev in enumerate(sd.query_devices()):
        name = dev['name'].lower()
        if ('usb audio' in name or 'turntable' in name or 'codec' in name) and dev['max_input_channels'] > 0:
            return idx
    return sd.default.device[0]

def record_clip(filename: str, prompt: str, device_idx: int):
    print(f"\n[ACTION] {prompt}")
    
    # Ask for duration at runtime
    user_input = input("Enter duration in seconds (or press ENTER for 3): ")
    try:
        # Convert to float so user can enter "1.5" or "6"
        duration = float(user_input) if user_input.strip() else 3.0
    except ValueError:
        print("Invalid number. Defaulting to 3.0 seconds.")
        duration = 3.0

    input(f"Press ENTER when ready to record {duration} seconds...")
    
    audio = sd.rec(int(duration * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=CHANNELS, dtype='int16', device=device_idx)
    sd.wait()
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    write(filepath, SAMPLE_RATE, audio)
    print(f"Saved {filepath}")

if __name__ == "__main__":
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    idx = get_turntable_index()
    print(f"Using device #{idx}")
    
    record_clip("sample_lifted.wav", "LIFT tonearm on the rest.", idx)
    record_clip("sample_groove.wav", "DROP needle on lead-in groove.", idx)
    record_clip("sample_music.wav", "PLAY active music passage.", idx)