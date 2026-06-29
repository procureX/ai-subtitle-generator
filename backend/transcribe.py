import datetime
from faster_whisper import WhisperModel
import srt

def generate_subtitles(audio_path: str, output_srt_path: str):
    print("🤖 Loading local AI Whisper Model... (this may take a moment the first time)")
    
    # We use the 'tiny' model size so it runs blazing fast on your CPU
    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    
    # Tell the model to transcribe our extracted audio file
    print("🎙️ Transcribing audio track...")
    segments, info = model.transcribe(audio_path, beam_size=5, language="en")
    
    subtitle_blocks = []
    
    # Loop over every sentence the AI detects along with its timestamps
    for index, segment in enumerate(segments, start=1):
        # Convert raw seconds into a time format subtitles can understand
        start_time = datetime.timedelta(seconds=segment.start)
        end_time = datetime.timedelta(seconds=segment.end)
        
        # Build an individual subtitle entry
        sub = srt.Subtitle(
            index=index,
            start=start_time,
            end=end_time,
            content=segment.text.strip()
        )
        subtitle_blocks.append(sub)
        print(f"[{start_time} -> {end_time}]: {segment.text}")

    # Compile all sentences and save them as a clean standard .srt file
    with open(output_srt_path, "w", encoding="utf-8") as f:
        f.write(srt.compose(subtitle_blocks))
        
    print(f"🎉 Subtitles successfully generated at: {output_srt_path}")