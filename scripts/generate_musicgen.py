#!/usr/bin/env python3
"""Try to generate a local MusicGen loop, with no hard dependency on the game runtime."""

from __future__ import annotations

import os
import pathlib
import sys


OUT = pathlib.Path(os.environ.get("MUSICGEN_OUT", "assets/audio/musicgen-earth-defense.wav"))
MODEL_ID = os.environ.get("MUSICGEN_MODEL", "facebook/musicgen-small")
LOCAL_ONLY = os.environ.get("MUSICGEN_LOCAL_ONLY", "0") == "1"
MAX_NEW_TOKENS = int(os.environ.get("MUSICGEN_MAX_NEW_TOKENS", "384"))
PROMPT = (
    "premium cinematic sci-fi tower defense game music loop, Earth defense in deep space, "
    "massive low percussion pulses, dark space drone, urgent arpeggiated synths, "
    "bright cyan laser accents, polished arcade combat, no vocals, no speech"
)


def main() -> int:
    try:
      import scipy.io.wavfile
      import torch
      from transformers import AutoProcessor, MusicgenForConditionalGeneration
    except Exception as exc:
      print(f"MusicGen dependencies are not available: {exc}")
      return 2

    print(f"Loading {MODEL_ID} ... local_only={LOCAL_ONLY}")
    processor = AutoProcessor.from_pretrained(MODEL_ID, local_files_only=LOCAL_ONLY)
    model = MusicgenForConditionalGeneration.from_pretrained(MODEL_ID, local_files_only=LOCAL_ONLY)
    device = "mps" if torch.backends.mps.is_available() else "cpu"
    model.to(device)
    inputs = processor(text=[PROMPT], padding=True, return_tensors="pt").to(device)
    print("Generating short local loop ...")
    audio_values = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS)
    sampling_rate = model.config.audio_encoder.sampling_rate
    OUT.parent.mkdir(parents=True, exist_ok=True)
    scipy.io.wavfile.write(OUT, rate=sampling_rate, data=audio_values[0, 0].detach().cpu().numpy())
    print(f"Wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
