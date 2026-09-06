import os
import wave
import argparse
import numpy as np

def calculate_rms(samples: np.ndarray) -> float:
    """Calculate the Root Mean Square (RMS) of audio sample"""
    if len(samples) == 0:
        return 0.0
    return float(np.sqrt(np.mean(np.square(samples, dtype=np.float64))))

def rms_to_dbfs(rms: float, max_val: float = 32768.0) -> float:
    """ Convert raw RMS aplitude to dBFS (decibels relative to full scale) """
    if rms <= 0:
        return -100.0
    return 20.0 * np.log10(rms / max_val)

def get_raw_state(dbfs: float, play_threshold: float = -33.0, noise_floor: float = -60.0) -> str:
    """Determine raw chunk state before debouncing"""
    if dbfs >= play_threshold:
        return "TRACK_PLAYING"
    elif dbfs <= noise_floor:
        return "NEEDLE_LIFTED"
    else:
        return "NEEDLE_DROPPED"

def analyze_wav_file(file_path: str, chunk_duration: float = 0.5, threshold_db: float = -33.0):
    """Analyze a WAV file and print debounced audio state for each chunk"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return

    try:
        with wave.open(file_path, 'rb') as wf:
            sample_rate = wf.getframerate()
            num_channels = wf.getnchannels()
            sample_width = wf.getsampwidth()
            total_frames = wf.getnframes()

            # sample width in bytes to numpy integer
            if sample_width == 2:
                dtype = np.int16
            elif sample_width == 1:
                dtype = np.uint8
            elif sample_width == 4:
                dtype = np.int32
            else:
                print(f"Unsupported sample width: {sample_width}")
                return
            
            max_possible_amplitude = float(2 ** (8 * sample_width - 1))
            frames_per_chunk = int(sample_rate * chunk_duration)
            total_duration =  total_frames / sample_rate

            print("=" * 65)
            print(f" File: {os.path.basename(file_path)}")
            print(f" Format: {sample_rate}Hz | {num_channels} Ch | {sample_width * 8}-bit PCM")
            print(f" Total Duration: {total_duration:.2f}s | Chunk Size: {chunk_duration}s")
            print(f" Play Threshold: {threshold_db} dBFS")
            print("=" * 65)
            print(f"{'Time Frame':<18} | {'RMS (dBFS)':<12} | {'Detected State'}")
            print("-" * 65)

            chunk_idx = 0
            playing_chunks = 0
            total_chunks = 0

            current_state = "NEEDLE_LIFTED"
            consecutive_high = 0
            consecutive_low = 0
            # should avoid rapid bumps in dB making the state fluctuate
            MIN_SUSTAIN_CHUNKS = 3

            while True:
                raw_bytes = wf.readframes(frames_per_chunk)
                if not raw_bytes:
                    break

                # raw bytes to sample array
                audio_data = np.frombuffer(raw_bytes, dtype=dtype)

                # flatten stereo to mono if necessary
                if num_channels > 1:
                    audio_data = audio_data.reshape(-1, num_channels).mean(axis=1)

                rms = calculate_rms(audio_data)
                dbfs = rms_to_dbfs(rms, max_possible_amplitude)
                raw = get_raw_state(dbfs, play_threshold=threshold_db)

                # debouncing logic
                if dbfs <= -60.0:
                    current_state = "NEEDLE_LIFTED"
                    consecutive_high = 0
                    consecutive_low = 0

                elif current_state == "NEEDLE_LIFTED":
                    current_state = "NEEDLE_DROPPED"
                    consecutive_high = 0
                    consecutive_low = 0

                elif current_state == "NEEDLE_DROPPED":
                    if raw == "TRACK_PLAYING":
                        consecutive_high += 1
                        if consecutive_high >= MIN_SUSTAIN_CHUNKS:
                            current_state = "TRACK_PLAYING"
                            consecutive_high = 0
                    else:
                        consecutive_low += 1

                elif current_state == "TRACK_PLAYING":
                    if raw != "TRACK_PLAYING":
                        consecutive_low += 1
                        if consecutive_low >= MIN_SUSTAIN_CHUNKS:
                            current_state = "NEEDLE_DROPPED"
                            consecutive_low = 0
                    else:
                        consecutive_high = 0


                start_time = chunk_idx * chunk_duration
                end_time = start_time + chunk_duration

                print(f"{start_time:6.2f}s - {end_time:6.2f}s | {dbfs:8.2f} dBFS | {current_state}")

                if current_state == "TRACK_PLAYING":
                    playing_chunks += 1
                total_chunks += 1
                chunk_idx += 1

            print("-" * 65)
            print(f"Analysis Complete: {playing_chunks}/{total_chunks} chunks detected as TRACK_PLAYING")

    except wave.Error as e:
        print(f"Error reading WAV file: {e}")
        return

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze WAV file for audio state detection based on RMS levels.")
    parser.add_argument("file_path", type=str, help="Path to the WAV file to analyze.")
    parser.add_argument("--chunk_duration", type=float, default=0.5, help="Duration of each chunk in seconds (default: 0.5s).")
    parser.add_argument("--threshold_db", type=float, default=-33.0, help="Threshold in dBFS to detect TRACK_PLAYING (default: -33.0 dBFS).")

    args = parser.parse_args()
    analyze_wav_file(args.file_path, chunk_duration=args.chunk_duration, threshold_db=args.threshold_db)