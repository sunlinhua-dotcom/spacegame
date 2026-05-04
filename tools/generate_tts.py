#!/usr/bin/env python3
"""Generate TTS audio for dialogue lines via Xiaomi MiMo-V2.5-TTS-VoiceDesign.

The script reads dialogue lines from src/dialogue.js (parsed via simple regex),
maps each speaker to a voice-design prompt from src/heroes.js voiceDesc, then
calls the mimo API for each line and saves the resulting audio to
assets/voice/<scene>/<idx>-<speaker>.mp3.

Usage:
    python tools/generate_tts.py prologue
    python tools/generate_tts.py stage 1
    python tools/generate_tts.py epilogue
    python tools/generate_tts.py all      # everything (~156 calls — careful)

Idempotent: skips files that already exist on disk. Pass --force to redo.

API docs: https://platform.xiaomimimo.com/static/docs/usage-guide/speech-synthesis-v2.5.md
"""

import base64
import os
import re
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["MIMO_API_KEY"]
BASE_URL = os.environ.get("MIMO_BASE_URL", "https://api.xiaomimimo.com")
MODEL = os.environ.get("MIMO_TTS_MODEL", "mimo-v2.5-tts-voicedesign")

OUTPUT_FORMAT = "mp3"
ENDPOINT = f"{BASE_URL.rstrip('/').replace('platform.', 'api.')}/v1/chat/completions"
# Some users put platform.xiaomimimo.com in MIMO_BASE_URL — normalize to api.
if "platform.xiaomimimo.com" in BASE_URL:
    ENDPOINT = "https://api.xiaomimimo.com/v1/chat/completions"


# Voice design prompts — one per speaker. The HEROES list in heroes.js carries
# voiceDesc strings; this script keeps a copy here so the TTS layer doesn't
# need to import the JS module. Boss + narrator voices are also defined here.
EN_PRONUNCIATION_HINT = (
    " 重要:文本中所有英文单词(如 BRIGHT, ULT, ORBIT-S, DIGIREPUB, Lia, Devi, Rin, Yue, Aria, Sakura, Ade)"
    "请按英文单词整体发音连读,不要逐字母拼读,不要把字母分开。Lia 读 Lee-ah,Aria 读 Ah-ree-ah,"
    "BRIGHT 读 brait,DIGIREPUB 读 dij-i-re-pub,ORBIT-S 读 or-bit ess。"
)

VOICE_PROMPTS = {
    "bright":   "沉稳威严的男性指挥官,中低音,30岁左右,略带电子通讯滤镜的清晰咬字,语速适中,镇定不紧绷。" + EN_PRONUNCIATION_HINT,
    "lia":      "热带活力少女,中音偏亮,葡萄牙语口音的中文,自信高昂,语速中等偏快,带巴西阳光感。" + EN_PRONUNCIATION_HINT,
    "devi":     "温柔治愈型女声,印度英语口音的中文,中音偏低,语速稍慢,带有神秘的草药低语感。" + EN_PRONUNCIATION_HINT,
    "rin":      "冷静狙击手,清亮中音,韩式简练咬字,语速精准不拖,情绪克制。" + EN_PRONUNCIATION_HINT,
    "yue":      "古典禅意女声,中音,语调如诗般起伏,偏空灵,有月光般的柔和延展。" + EN_PRONUNCIATION_HINT,
    "ade":      "深沉有力的女声,中低音,带非洲鼓点般的节奏感,坚定而温暖。" + EN_PRONUNCIATION_HINT,
    "sakura":   "甜美少女音,日式柔气中文发音,语速轻盈,带樱花飘落般的轻盈尾音。" + EN_PRONUNCIATION_HINT,
    "aria":     "优雅指挥家女声,中音,法式韵律,如风过琴弦的清亮,语速从容。" + EN_PRONUNCIATION_HINT,
    "boss":     "低沉如熔岩沸腾的男低音,带火山轰鸣残响,缓慢威严,扭曲恶意的咬字。" + EN_PRONUNCIATION_HINT,
    "narrator": "电影级旁白男声,沉稳深邃,中低音,叙事感强,适合科幻片开场字幕。" + EN_PRONUNCIATION_HINT,
}


def parse_dialogue_js() -> dict:
    """Parse src/dialogue.js and pull out PROLOGUE / EPILOGUE / per-stage lines.

    The file is hand-authored JS with a stable shape — easier to regex than to
    invoke a JS runtime. We only need {speaker, text, durationMs?} per line.
    """
    src = Path("src/dialogue.js").read_text()

    def collect(name):
        # Matches `export const PROLOGUE = [` ... `];`
        m = re.search(rf"export const {name} = \[\s*(.*?)\s*\];", src, re.DOTALL)
        if not m:
            return []
        body = m.group(1)
        return parse_line_list(body)

    def parse_line_list(body):
        # Each line: { speaker: "lia", text: "桑巴节奏…", durationMs: 2200 },
        out = []
        # Match { speaker: "X", text: "Y" [, durationMs: N] },
        for ln in re.finditer(r"\{\s*speaker:\s*\"([^\"]+)\"\s*,\s*text:\s*\"([^\"]+)\"(?:[^}]*durationMs:\s*(\d+))?[^}]*\}", body):
            speaker, text, dur = ln.group(1), ln.group(2), ln.group(3)
            out.append({"speaker": speaker, "text": text, "durationMs": int(dur) if dur else None})
        return out

    result = {"prologue": collect("PROLOGUE"), "epilogue": collect("EPILOGUE")}
    # Stage scripts: STAGE_DIALOGUE = { 1: { ... }, 2: { ... }, ... }
    stage_block = re.search(r"export const STAGE_DIALOGUE = \{\s*(.*?)^\};", src, re.DOTALL | re.MULTILINE)
    if stage_block:
        body = stage_block.group(1)
        # Each stage: N: { bossId: "…", bossName: "…", "stage-enter": [...], ... }
        for stage_match in re.finditer(r"(\d+):\s*\{(.*?)^  \},", body, re.DOTALL | re.MULTILINE):
            stage_num = int(stage_match.group(1))
            stage_body = stage_match.group(2)
            stage_lines = []
            for ev_match in re.finditer(r"\"([^\"]+)\":\s*\[(.*?)\]", stage_body, re.DOTALL):
                event = ev_match.group(1)
                lines = parse_line_list(ev_match.group(2))
                for i, ln in enumerate(lines):
                    ln["event"] = event
                    ln["lineIdx"] = i
                stage_lines.extend(lines)
            result[f"stage_{stage_num}"] = stage_lines
    return result


def synth_line(text: str, voice_prompt: str, out_path: Path) -> bool:
    """One TTS call. Returns True if file was written, False on error."""
    if out_path.exists():
        print(f"  [skip] {out_path.name}", flush=True)
        return True

    body = {
        "model": MODEL,
        "messages": [
            {"role": "user", "content": voice_prompt},
            {"role": "assistant", "content": text},
        ],
        "audio": {"format": OUTPUT_FORMAT},
    }
    headers = {"api-key": API_KEY, "Content-Type": "application/json"}
    try:
        r = requests.post(ENDPOINT, json=body, headers=headers, timeout=60)
    except Exception as e:
        print(f"  [error] network: {e}", flush=True)
        return False
    if r.status_code != 200:
        print(f"  [error] HTTP {r.status_code}: {r.text[:300]}", flush=True)
        return False

    j = r.json()
    # Response shape (per docs): choices[0].message.audio.data is base64 audio.
    try:
        audio_b64 = j["choices"][0]["message"]["audio"]["data"]
    except (KeyError, IndexError):
        # Some variants use message.content as base64 directly
        try:
            audio_b64 = j["choices"][0]["message"]["content"]
        except Exception:
            print(f"  [error] unexpected response shape: {list(j.keys())}", flush=True)
            return False

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_bytes(base64.b64decode(audio_b64))
    print(f"  [ok] {out_path.name}  {out_path.stat().st_size // 1024} KB", flush=True)
    return True


def render_set(name: str, lines: list, force: bool = False) -> tuple[int, int]:
    """Render every line in `lines` to assets/voice/<name>/.

    File naming:
      • Per-stage scripts (event + lineIdx attached): {event}-{lineIdx:02}-{speaker}.mp3
        e.g. stage-enter-00-boss.mp3, boss-defeat-02-bright.mp3
      • Prologue / epilogue (no event): {idx:02}-{speaker}.mp3
    """
    out_dir = Path(f"assets/voice/{name}")
    ok, fail = 0, 0
    for idx, ln in enumerate(lines):
        speaker = ln["speaker"]
        voice = VOICE_PROMPTS.get(speaker, VOICE_PROMPTS["narrator"])
        event = ln.get("event")
        line_idx = ln.get("lineIdx", idx)
        if event:
            name_part = f"{event}-{line_idx:02d}-{speaker}.mp3"
        else:
            name_part = f"{idx:02d}-{speaker}.mp3"
        out_path = out_dir / name_part
        if force and out_path.exists():
            out_path.unlink()
        if synth_line(ln["text"], voice, out_path):
            ok += 1
        else:
            fail += 1
        # Mimo rate limit safety
        time.sleep(0.4)
    return ok, fail


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__, file=sys.stderr)
        return 2
    target = sys.argv[1]
    force = "--force" in sys.argv

    parsed = parse_dialogue_js()

    if target == "prologue":
        ok, fail = render_set("prologue", parsed["prologue"], force)
        print(f"prologue: {ok} ok / {fail} fail", flush=True)
    elif target == "epilogue":
        ok, fail = render_set("epilogue", parsed["epilogue"], force)
        print(f"epilogue: {ok} ok / {fail} fail", flush=True)
    elif target == "stage" and len(sys.argv) >= 3:
        n = int(sys.argv[2])
        key = f"stage_{n}"
        if key not in parsed:
            print(f"no script for stage {n}", file=sys.stderr); return 2
        ok, fail = render_set(f"stage-{n}", parsed[key], force)
        print(f"stage {n}: {ok} ok / {fail} fail", flush=True)
    elif target == "all":
        # Hard cap so we don't accidentally torch the budget.
        confirm = input("This will issue ~156 TTS calls. Type YES to continue: ")
        if confirm != "YES":
            print("aborted"); return 1
        for key in ["prologue", "epilogue"] + [f"stage_{i}" for i in range(1, 11)]:
            scene = key.replace("_", "-")
            ok, fail = render_set(scene, parsed[key], force)
            print(f"{scene}: {ok} ok / {fail} fail", flush=True)
    else:
        print(__doc__, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
