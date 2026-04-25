type SoundId =
  | "coin-drop"
  | "coin-score"
  | "reward-drop"
  | "reward-rare"
  | "reward-spawn"
  | "combo";

type ToneSpec = {
  durationSec: number;
  volume: number;
  attackSec: number;
  releaseSec: number;
  partials: Array<{
    frequency: number;
    weight: number;
    phase: number;
  }>;
};

const SAMPLE_RATE = 22050;
const PCM_SCALE = 32767;

const TONE_SPECS: Record<SoundId, ToneSpec> = {
  "coin-drop": {
    durationSec: 0.11,
    volume: 0.5,
    attackSec: 0.006,
    releaseSec: 0.09,
    partials: [
      { frequency: 880, weight: 1, phase: 0 },
      { frequency: 1320, weight: 0.45, phase: 0.2 }
    ]
  },
  "coin-score": {
    durationSec: 0.16,
    volume: 0.46,
    attackSec: 0.008,
    releaseSec: 0.1,
    partials: [
      { frequency: 740, weight: 1, phase: 0 },
      { frequency: 1110, weight: 0.5, phase: 0.35 }
    ]
  },
  "reward-drop": {
    durationSec: 0.25,
    volume: 0.42,
    attackSec: 0.01,
    releaseSec: 0.11,
    partials: [
      { frequency: 523.25, weight: 1, phase: 0 },
      { frequency: 659.25, weight: 0.7, phase: 0.2 },
      { frequency: 783.99, weight: 0.4, phase: 0.3 }
    ]
  },
  "reward-rare": {
    durationSec: 0.32,
    volume: 0.46,
    attackSec: 0.012,
    releaseSec: 0.13,
    partials: [
      { frequency: 659.25, weight: 1, phase: 0 },
      { frequency: 987.77, weight: 0.8, phase: 0.1 },
      { frequency: 1318.5, weight: 0.5, phase: 0.4 }
    ]
  },
  "reward-spawn": {
    durationSec: 0.18,
    volume: 0.43,
    attackSec: 0.008,
    releaseSec: 0.09,
    partials: [
      { frequency: 587.33, weight: 1, phase: 0 },
      { frequency: 783.99, weight: 0.6, phase: 0.15 }
    ]
  },
  combo: {
    durationSec: 0.22,
    volume: 0.44,
    attackSec: 0.01,
    releaseSec: 0.11,
    partials: [
      { frequency: 392, weight: 1, phase: 0 },
      { frequency: 523.25, weight: 0.8, phase: 0.2 },
      { frequency: 783.99, weight: 0.5, phase: 0.5 }
    ]
  }
};

const dataUriCache = new Map<SoundId, string>();
let isAudioAvailable = true;

function canUseAudioApi(): boolean {
  return typeof wx !== "undefined" && typeof wx.createInnerAudioContext === "function";
}

function toLittleEndian16(value: number): [number, number] {
  return [value & 255, (value >> 8) & 255];
}

function writeAscii(bytes: number[], value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    bytes.push(value.charCodeAt(index));
  }
}

function pushLittleEndian32(bytes: number[], value: number): void {
  bytes.push(value & 255, (value >> 8) & 255, (value >> 16) & 255, (value >> 24) & 255);
}

function getEnvelopeGain(timeSec: number, durationSec: number, attackSec: number, releaseSec: number): number {
  if (timeSec < attackSec) {
    return timeSec / Math.max(attackSec, 0.0001);
  }

  const releaseStart = durationSec - releaseSec;
  if (timeSec > releaseStart) {
    return Math.max((durationSec - timeSec) / Math.max(releaseSec, 0.0001), 0);
  }

  return 1;
}

function encodeBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let result = "";

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = index + 1 < bytes.length ? bytes[index + 1] : 0;
    const third = index + 2 < bytes.length ? bytes[index + 2] : 0;

    const packed = (first << 16) | (second << 8) | third;
    const char1 = (packed >> 18) & 63;
    const char2 = (packed >> 12) & 63;
    const char3 = (packed >> 6) & 63;
    const char4 = packed & 63;

    result += alphabet[char1];
    result += alphabet[char2];
    result += index + 1 < bytes.length ? alphabet[char3] : "=";
    result += index + 2 < bytes.length ? alphabet[char4] : "=";
  }

  return result;
}

function createWavDataUri(spec: ToneSpec): string {
  const sampleCount = Math.max(1, Math.floor(spec.durationSec * SAMPLE_RATE));
  const blockAlign = 2;
  const byteRate = SAMPLE_RATE * blockAlign;
  const pcmByteLength = sampleCount * blockAlign;

  const bytes: number[] = [];

  writeAscii(bytes, "RIFF");
  pushLittleEndian32(bytes, 36 + pcmByteLength);
  writeAscii(bytes, "WAVE");
  writeAscii(bytes, "fmt ");
  pushLittleEndian32(bytes, 16);
  bytes.push(1, 0);
  bytes.push(1, 0);
  pushLittleEndian32(bytes, SAMPLE_RATE);
  pushLittleEndian32(bytes, byteRate);
  bytes.push(blockAlign, 0);
  bytes.push(16, 0);
  writeAscii(bytes, "data");
  pushLittleEndian32(bytes, pcmByteLength);

  const weightTotal = spec.partials.reduce((sum, partial) => sum + partial.weight, 0);

  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    const timeSec = sampleIndex / SAMPLE_RATE;
    const envelope = getEnvelopeGain(timeSec, spec.durationSec, spec.attackSec, spec.releaseSec);

    let value = 0;
    for (const partial of spec.partials) {
      value += partial.weight * Math.sin(2 * Math.PI * partial.frequency * timeSec + partial.phase);
    }

    const normalized = (value / Math.max(weightTotal, 0.0001)) * envelope * spec.volume;
    const clamped = Math.max(-1, Math.min(1, normalized));
    const sample = Math.round(clamped * PCM_SCALE);
    const [lo, hi] = toLittleEndian16(sample);
    bytes.push(lo, hi);
  }

  return `data:audio/wav;base64,${encodeBase64(new Uint8Array(bytes))}`;
}

function getSoundDataUri(sound: SoundId): string {
  const cached = dataUriCache.get(sound);
  if (cached) {
    return cached;
  }

  const uri = createWavDataUri(TONE_SPECS[sound]);
  dataUriCache.set(sound, uri);
  return uri;
}

export function playSound(name: string): void {
  const spec = TONE_SPECS[name as SoundId];
  if (!spec || !isAudioAvailable || !canUseAudioApi()) {
    return;
  }

  const createInnerAudioContext = wx.createInnerAudioContext;
  if (!createInnerAudioContext) {
    return;
  }

  const audio = createInnerAudioContext();
  audio.autoplay = false;
  audio.loop = false;
  audio.volume = 1;
  audio.src = getSoundDataUri(name as SoundId);

  audio.onError(() => {
    isAudioAvailable = false;
    audio.destroy();
  });

  audio.onEnded(() => {
    audio.destroy();
  });

  audio.play();
}
