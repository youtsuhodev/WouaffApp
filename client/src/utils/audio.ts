/* Trim an audio Data URL to an extract and return as WAV base64 Data URL */
export async function trimAudio(dataUri: string, startSec: number, durationSec: number): Promise<string> {
  const audioCtx = new AudioContext();
  try {
    const resp = await fetch(dataUri);
    const buf = await resp.arrayBuffer();
    const audioBuf = await audioCtx.decodeAudioData(buf);

    const srcRate = audioBuf.sampleRate;
    const targetRate = 16000;
    const srcData = audioBuf.getChannelData(0);
    const startSample = Math.floor(startSec * srcRate);
    const totalSamples = Math.floor(durationSec * srcRate);
    const maxSrc = Math.min(totalSamples, srcData.length - startSample);
    const outLen = Math.ceil((maxSrc * targetRate) / srcRate);

    /* Resample to targetRate (simple linear interpolation) */
    const ratio = srcRate / targetRate;
    const outData = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const srcIdx = startSample + i * ratio;
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, srcData.length - 1);
      const frac = srcIdx - lo;
      outData[i] = srcData[lo] + (srcData[hi] - srcData[lo]) * frac;
    }

    const wav = encodeWav(outData, targetRate);
    const blob = new Blob([wav], { type: 'audio/wav' });
    return new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.readAsDataURL(blob);
    });
  } finally {
    audioCtx.close();
  }
}

/* Compress an image Data URL to max dimension and reduced quality, returns a smaller base64 */
export function compressImage(dataUri: string, maxDim = 800, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = dataUri;
  });
}

function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bitsPerSample = 16;
  const numChannels = 1;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataBytes = samples.length * bytesPerSample;
  const buf = new ArrayBuffer(44 + dataBytes);
  const v = new DataView(buf);

  function s(off: number, str: string) {
    for (let i = 0; i < str.length; i++) v.setUint8(off + i, str.charCodeAt(i));
  }

  s(0, 'RIFF');
  v.setUint32(4, 36 + dataBytes, true);
  s(8, 'WAVE');
  s(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, numChannels, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * blockAlign, true);
  v.setUint16(32, blockAlign, true);
  v.setUint16(34, bitsPerSample, true);
  s(36, 'data');
  v.setUint32(40, dataBytes, true);

  let off = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return buf;
}
