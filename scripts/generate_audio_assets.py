from __future__ import annotations

import math
import wave
from pathlib import Path

import numpy as np


SR = 44_100
OUT = Path("assets/audio/premium")


def env_exp(t: np.ndarray, attack: float, decay: float) -> np.ndarray:
    up = np.clip(t / max(attack, 1e-4), 0, 1)
    return up * np.exp(-np.maximum(t - attack, 0) / max(decay, 1e-4))


def stereo(signal: np.ndarray, pan: float = 0.0) -> np.ndarray:
    pan = float(np.clip(pan, -1, 1))
    left = math.cos((pan + 1) * math.pi / 4)
    right = math.sin((pan + 1) * math.pi / 4)
    return np.column_stack((signal * left, signal * right))


def lowpass_noise(length: int, amount: float = 0.035) -> np.ndarray:
    noise = np.random.default_rng(27).normal(0, 1, length)
    out = np.zeros(length)
    value = 0.0
    for i, sample in enumerate(noise):
      value = value * (1 - amount) + sample * amount
      out[i] = value
    return out


def fade_edges(data: np.ndarray, fade_in: float = 0.02, fade_out: float = 0.05) -> np.ndarray:
    result = data.copy()
    in_len = min(len(result), int(SR * fade_in))
    out_len = min(len(result), int(SR * fade_out))
    if in_len > 0:
        result[:in_len] *= np.linspace(0, 1, in_len)[:, None]
    if out_len > 0:
        result[-out_len:] *= np.linspace(1, 0, out_len)[:, None]
    return result


def normalize(data: np.ndarray, peak: float = 0.92) -> np.ndarray:
    max_value = float(np.max(np.abs(data))) if len(data) else 0.0
    if max_value <= 1e-6:
        return data
    return np.clip(data / max_value * peak, -1, 1)


def write_wav(name: str, data: np.ndarray, peak: float = 0.92) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    if data.ndim == 1:
        data = stereo(data)
    data = fade_edges(normalize(data, peak))
    pcm = (np.clip(data, -1, 1) * 32767).astype("<i2")
    with wave.open(str(OUT / name), "wb") as f:
        f.setnchannels(2)
        f.setsampwidth(2)
        f.setframerate(SR)
        f.writeframes(pcm.tobytes())


def oscillator(t: np.ndarray, freq: float, kind: str = "sine") -> np.ndarray:
    phase = 2 * np.pi * freq * t
    if kind == "triangle":
        return (2 / np.pi) * np.arcsin(np.sin(phase))
    if kind == "saw":
        return 2 * (t * freq - np.floor(0.5 + t * freq))
    return np.sin(phase)


def sweep(t: np.ndarray, start: float, end: float) -> np.ndarray:
    ratio = max(end / start, 1e-4)
    phase = 2 * np.pi * start * ((ratio ** t - 1) / max(math.log(ratio), 1e-4))
    return np.sin(phase)


def make_music() -> None:
    length = 28.0
    t = np.linspace(0, length, int(SR * length), endpoint=False)
    music = np.zeros((len(t), 2))

    drone = (
        0.28 * oscillator(t, 36)
        + 0.18 * oscillator(t, 54, "triangle")
        + 0.12 * oscillator(t, 72)
        + 0.06 * oscillator(t, 108)
    )
    slow_gate = 0.74 + 0.26 * np.sin(2 * np.pi * 0.055 * t + 0.4)
    music += stereo(drone * slow_gate, -0.08)

    chord = np.zeros_like(t)
    for freq, gain, detune in [(110, 0.11, 0.0), (146.83, 0.08, 0.004), (164.81, 0.07, -0.003), (220, 0.045, 0.002)]:
        chord += gain * oscillator(t, freq * (1 + detune), "triangle")
        chord += gain * 0.36 * oscillator(t, freq * 2.01)
    chord *= 0.5 + 0.5 * np.sin(2 * np.pi * 0.025 * t + 1.2) ** 2
    music += stereo(chord, 0.16)

    notes = [72, 72, 54, 81, 64, 54, 96, 81]
    beat = 0.62
    for step, start in enumerate(np.arange(0, length, beat)):
        idx = int(start * SR)
        dur = int(0.46 * SR)
        if idx + dur > len(t):
            break
        tt = np.arange(dur) / SR
        note = notes[step % len(notes)]
        hit = sweep(tt, note * 1.35, note * 0.54) * env_exp(tt, 0.008, 0.18)
        hit += 0.22 * oscillator(tt, note * 2.0, "triangle") * env_exp(tt, 0.005, 0.11)
        music[idx : idx + dur] += stereo(hit * (0.38 if step % 4 == 0 else 0.24), -0.22 if step % 2 else 0.22)

    air = lowpass_noise(len(t), 0.002)
    air *= 0.18 + 0.08 * np.sin(2 * np.pi * 0.031 * t)
    music += stereo(air, 0.0)

    rng = np.random.default_rng(91)
    for start in rng.uniform(0.6, length - 1.4, 42):
        idx = int(start * SR)
        dur = int(rng.uniform(0.12, 0.32) * SR)
        tt = np.arange(dur) / SR
        freq = rng.uniform(620, 1480)
        sparkle = oscillator(tt, freq) * env_exp(tt, 0.012, rng.uniform(0.07, 0.16))
        music[idx : idx + dur] += stereo(sparkle * rng.uniform(0.018, 0.035), rng.uniform(-0.8, 0.8))

    write_wav("space-defense-loop.wav", music, 0.86)


def make_fire() -> None:
    t = np.linspace(0, 0.18, int(SR * 0.18), endpoint=False)
    sig = sweep(t, 540, 1550) * env_exp(t, 0.004, 0.045)
    sig += 0.22 * lowpass_noise(len(t), 0.18) * env_exp(t, 0.001, 0.035)
    write_wav("fire.wav", stereo(sig, -0.15), 0.72)


def make_boom() -> None:
    t = np.linspace(0, 1.08, int(SR * 1.08), endpoint=False)
    low = sweep(t, 92, 29) * env_exp(t, 0.006, 0.42)
    crack = lowpass_noise(len(t), 0.08) * env_exp(t, 0.002, 0.18)
    tail = lowpass_noise(len(t), 0.012) * env_exp(t, 0.03, 0.58)
    sig = 0.82 * low + 0.44 * crack + 0.28 * tail
    write_wav("boom.wav", stereo(sig, 0.08), 0.9)


def make_hit() -> None:
    t = np.linspace(0, 0.36, int(SR * 0.36), endpoint=False)
    sig = 0.55 * sweep(t, 170, 52) * env_exp(t, 0.003, 0.14)
    sig += 0.34 * lowpass_noise(len(t), 0.12) * env_exp(t, 0.001, 0.1)
    write_wav("hit.wav", stereo(sig, 0.0), 0.72)


def make_select() -> None:
    t = np.linspace(0, 0.36, int(SR * 0.36), endpoint=False)
    sig = oscillator(t, 720, "triangle") * env_exp(t, 0.006, 0.08)
    sig += 0.64 * oscillator(t, 1440) * env_exp(np.maximum(t - 0.09, 0), 0.004, 0.08) * (t > 0.09)
    write_wav("select.wav", stereo(sig, 0.18), 0.7)


def make_levelup() -> None:
    duration = 1.4
    t = np.linspace(0, duration, int(SR * duration), endpoint=False)
    sig = np.zeros_like(t)
    for start, freq in [(0.0, 392), (0.12, 523.25), (0.24, 659.25), (0.36, 783.99), (0.58, 1046.5)]:
        local = np.maximum(t - start, 0)
        sig += oscillator(local, freq, "triangle") * env_exp(local, 0.012, 0.24) * (t >= start)
    sig += 0.08 * lowpass_noise(len(t), 0.03) * env_exp(t, 0.03, 0.8)
    write_wav("levelup.wav", stereo(sig, 0.0), 0.78)


def make_laser() -> None:
    t = np.linspace(0, 0.66, int(SR * 0.66), endpoint=False)
    sig = 0.52 * sweep(t, 360, 1850) * env_exp(t, 0.02, 0.23)
    sig += 0.24 * oscillator(t, 940, "triangle") * env_exp(t, 0.008, 0.26)
    sig += 0.16 * lowpass_noise(len(t), 0.055) * env_exp(t, 0.01, 0.2)
    write_wav("laser.wav", stereo(sig, -0.12), 0.78)


def make_beam() -> None:
    t = np.linspace(0, 1.1, int(SR * 1.1), endpoint=False)
    sig = 0.38 * sweep(t, 96, 64) * env_exp(t, 0.03, 0.55)
    sig += 0.34 * sweep(t, 420, 1120) * env_exp(t, 0.05, 0.36)
    sig += 0.22 * lowpass_noise(len(t), 0.035) * env_exp(t, 0.012, 0.52)
    write_wav("beam.wav", stereo(sig, 0.1), 0.86)


def main() -> None:
    np.random.seed(9)
    make_music()
    make_fire()
    make_boom()
    make_hit()
    make_select()
    make_levelup()
    make_laser()
    make_beam()
    for file in sorted(OUT.glob("*.wav")):
        print(file)


if __name__ == "__main__":
    main()
