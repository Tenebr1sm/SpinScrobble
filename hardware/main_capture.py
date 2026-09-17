import sys
import os
import numpy as np
import sounddevice as sd
import collections
import wave
import requests
import time
import threading

# 16 chunks * 0.5 seconds = 8 second rolling window
# Used to store in memory
audio_buffer = collections.deque(maxlen=16)

# Import functions from rms_detector.py
from rms_detector import calculate_rms, rms_to_dbfs, get_raw_state

# Hardware & Signal Settings
SAMPLE_RATE = 44100
CHUNK_DURATION = 0.5                # 0.5s chunks matching rms_detector
CHUNK_FRAMES = int(SAMPLE_RATE * CHUNK_DURATION)


PLAY_THRESHOLD = -48.0              # dBFS
NOISE_FLOOR = -68.0                 # dBFS
MIN_SUSTAIN_CHUNKS = 7              # Wait 3.5 seconds

def get_turntable_index():
    for idx, dev in enumerate(sd.query_devices()):
        name = dev['name'].lower()
        if ('usb audio' in name or 'turntable' in name or 'codec' in name) and dev['max_input_channels'] > 0:
            return idx
    return sd.default.device[0]

# State tracking variables
current_state = "NEEDLE_LIFTED"
consecutive_high = 0
consecutive_low = 0
last_sample_time = 0.0 

def audio_callback(indata, frames, time_info, status):
    global current_state, consecutive_high, consecutive_low, last_sample_time
    
    if status:
        print(f"[ALSA Status] {status}", file=sys.stderr)

    # Convert incoming stereo to mono average
    mono_data = indata.mean(axis=1)

    # Convert to 16-bit integer scale to match rms_to_dbfs
    int16_samples = mono_data * 32768.0

    # Format the raw stereo data for the WAV file and save to buffer
    # np.clip prevents static/distortion if the volume spikes.. wow technology!!
    stereo_int16 = np.clip(indata * 32767.0, -32768, 32767).astype(np.int16)
    audio_buffer.append(stereo_int16.copy())
    
    rms = calculate_rms(int16_samples)
    dbfs = rms_to_dbfs(rms, max_val=32768.0)
    raw_state = get_raw_state(dbfs, play_threshold=PLAY_THRESHOLD, noise_floor=NOISE_FLOOR)

    # Debouncing state machine
    previous_state = current_state

    if dbfs <= NOISE_FLOOR:
        current_state = "NEEDLE_LIFTED"
        consecutive_high = 0
        consecutive_low = 0
        last_sample_time = 0.0
    elif current_state == "NEEDLE_LIFTED":
        current_state = "NEEDLE_DROPPED"
        consecutive_high = 0
        consecutive_low = 0
    elif current_state == "NEEDLE_DROPPED":
        if raw_state == "TRACK_PLAYING":
            consecutive_high += 1
            if consecutive_high >= MIN_SUSTAIN_CHUNKS:
                current_state = "TRACK_PLAYING"
                consecutive_high = 0
        else:
            consecutive_low += 1
    elif current_state == "TRACK_PLAYING":
        if raw_state != "TRACK_PLAYING":
            consecutive_low += 1
            if consecutive_low >= MIN_SUSTAIN_CHUNKS:
                current_state = "NEEDLE_DROPPED"
                consecutive_low = 0
        else:
            consecutive_high = 0

    # Print updates whenever state changes or log current levels
    state_change = f"  <-- [EVENT: {previous_state} -> {current_state}]" if current_state != previous_state else ""
    print(f"RMS: {dbfs:6.2f} dBFS | State: {current_state:<15} (Raw: {raw_state}){state_change}")

    # If the state just officially flipped to playing, ship the buffer!
    # Fire if music is playing, buffer is full, and 10 seconds have passed since the last API call
    if current_state == "TRACK_PLAYING" and len(audio_buffer) >= 16:
        current_time = time.time()
        if current_time - last_sample_time >= 10.0:
            last_sample_time = current_time
            
            buffer_copy = list(audio_buffer)
            threading.Thread(target=process_and_send_sample, args=(buffer_copy,)).start()

def process_and_send_sample(buffer_snapshot, sample_rate=44100):
    if len(buffer_snapshot) < 16:
        print("\n[API] Buffer not full yet (under 8s), skipping...")
        return

    # Stitch the 16 chunks into one continuous array
    full_audio = np.concatenate(buffer_snapshot)
    
    # Save it to a WAV file
    os.makedirs("samples", exist_ok=True) # Creates the folder if it's missing
    filepath = os.path.abspath("samples/live_sample.wav")
    
    with wave.open(filepath, 'wb') as wf:
        wf.setnchannels(2) 
        wf.setsampwidth(2) # 16-bit
        wf.setframerate(sample_rate)
        wf.writeframes(full_audio.tobytes())
        
    # Fire the HTTP POST to Node.js
    payload = {
        "filepath": filepath,
        "timestamp": int(time.time() * 1000)
    }
    
    try:
        response = requests.post("http://localhost:3000/api/sample", json=payload, timeout=5.0)
        print(f"\n[API] Success! Node responded: {response.json()}")
    except requests.RequestException as e:
        print(f"\n[API] Node backend unreachable. Error: {e}")

if __name__ == "__main__":
    device_idx = get_turntable_index()
    dev_name = sd.query_devices(device_idx)['name']
    print("=" * 60)
    print(f"SpinScrobble Live Capture Engine")
    print(f"Device: #{device_idx} - {dev_name}")
    print(f"Chunk: {CHUNK_DURATION}s | Threshold: {PLAY_THRESHOLD} dBFS")
    print("=" * 60)
    print("Listening to turntable... (Press Ctrl+C to stop)\n")

    try:
        with sd.InputStream(
            device=device_idx,
            channels=2,
            samplerate=SAMPLE_RATE,
            blocksize=CHUNK_FRAMES,
            callback=audio_callback
        ):
            while True:
                sd.sleep(1000)
    except KeyboardInterrupt:
        print("\nStopping audio stream...")