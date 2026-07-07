/* ── E2EE CRYPTO MODULE (ECDH P-256 + AES-256-GCM) ──
 * Ported from assets/js/crypto.js for React + TypeScript
 */

const KEY = 'wouaff_e2ee';

let _privKey: CryptoKey | null = null;
let _pubKey: JsonWebKey | null = null;
const _keyCache = new Map<string, CryptoKey>();

async function _importPrivKey(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey', 'deriveBits']);
}

async function _generateKeyPair(): Promise<{ privKey: CryptoKey; privJwk: JsonWebKey; pubJwk: JsonWebKey }> {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
  return {
    privKey: kp.privateKey,
    privJwk: await crypto.subtle.exportKey('jwk', kp.privateKey),
    pubJwk: await crypto.subtle.exportKey('jwk', kp.publicKey),
  };
}

async function _getAesKey(partnerPubJwk: JsonWebKey): Promise<CryptoKey> {
  if (!_privKey) throw new Error('E2EE not initialised');
  const key = JSON.stringify(partnerPubJwk);
  const cached = _keyCache.get(key);
  if (cached) return cached;
  const pub = await crypto.subtle.importKey('jwk', partnerPubJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const aes = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: pub },
    _privKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
  _keyCache.set(key, aes);
  return aes;
}

/* ── Public API ── */

export async function initE2EE(uid: string, fetchPublicKeyFromAPI: (uid: string) => Promise<JsonWebKey | null>): Promise<void> {
  const stored = localStorage.getItem(KEY);
  if (stored) {
    try {
      const data = JSON.parse(stored) as { privJwk: JsonWebKey; pubJwk: JsonWebKey };
      _privKey = await _importPrivKey(data.privJwk);
      _pubKey = data.pubJwk;
      return;
    } catch {
      localStorage.removeItem(KEY);
    }
  }
  const pair = await _generateKeyPair();
  _privKey = pair.privKey;
  _pubKey = pair.pubJwk;
  localStorage.setItem(KEY, JSON.stringify({ privJwk: pair.privJwk, pubJwk: pair.pubJwk }));
}

export function clearE2EE(): void {
  _keyCache.clear();
  _privKey = null;
  _pubKey = null;
}

export async function encrypt(partnerPubJwk: JsonWebKey, plaintext: string): Promise<{ ct: string; iv: string }> {
  const aes = await _getAesKey(partnerPubJwk);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aes,
    new TextEncoder().encode(plaintext),
  );
  return {
    ct: btoa(String.fromCharCode(...new Uint8Array(enc))),
    iv: btoa(String.fromCharCode(...iv)),
  };
}

export async function decrypt(partnerPubJwk: JsonWebKey, ct: string, iv: string): Promise<string> {
  const aes = await _getAesKey(partnerPubJwk);
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: Uint8Array.from(atob(iv), (c) => c.charCodeAt(0)) },
    aes,
    Uint8Array.from(atob(ct), (c) => c.charCodeAt(0)),
  );
  return new TextDecoder().decode(raw);
}

export function encryptMessageData(
  msgData: Record<string, unknown>,
  partnerPubJwk: JsonWebKey,
): Promise<Record<string, unknown>> {
  return (async () => {
    let plaintext: string;
    if (msgData.type === 'image') {
      plaintext = (msgData.imageData as string) || '';
      delete msgData.imageData;
      msgData.text = '\u{1F512} Image';
    } else if (msgData.type === 'voice') {
      plaintext = (msgData.audioData as string) || '';
      delete msgData.audioData;
      msgData.text = '\u{1F512} Message vocal';
    } else if (msgData.type === 'file') {
      plaintext = JSON.stringify({ d: msgData.fileData || '', n: msgData.fileName || '' });
      delete msgData.fileData;
      delete msgData.fileName;
      msgData.text = '\u{1F512} Fichier';
    } else if (msgData.type === 'contact') {
      plaintext = JSON.stringify(msgData.contact || '');
      delete msgData.contact;
      msgData.text = '\u{1F512} Contact';
    } else {
      plaintext = (msgData.text as string) || '';
      msgData.text = '\u{1F512} Message chiffr\u00E9';
    }
    const { ct, iv } = await encrypt(partnerPubJwk, plaintext);
    msgData.ct = ct;
    msgData.iv = iv;
    msgData.encrypted = true;
    return msgData;
  })();
}

export function decryptMessageData(
  msg: Record<string, unknown>,
  partnerPubJwk: JsonWebKey,
): Promise<Record<string, unknown>> {
  return (async () => {
    if (!msg.encrypted || !msg.ct || !msg.iv) return msg;
    try {
      const pt = await decrypt(partnerPubJwk, msg.ct as string, msg.iv as string);
      if (msg.type === 'image') {
        msg.imageData = pt;
      } else if (msg.type === 'voice') {
        msg.audioData = pt;
      } else if (msg.type === 'file') {
        try { const p = JSON.parse(pt); msg.fileData = p.d; msg.fileName = p.n; } catch (e) { console.error(e); }
      } else if (msg.type === 'contact') {
        try { msg.contact = JSON.parse(pt); } catch (e) { console.error(e); }
      } else {
        msg.text = pt;
      }
      delete msg.ct;
      delete msg.iv;
      msg.encrypted = false;
    } catch (e) {
      console.warn('E2EE decrypt failed', e);
    }
    return msg;
  })();
}

export function getPublicKey(): JsonWebKey | null {
  return _pubKey;
}
