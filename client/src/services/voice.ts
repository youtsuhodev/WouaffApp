import Peer, { type SignalData } from 'simple-peer';
import type { CallPayload } from '../types';
import { getSocket } from './socket';

const ICE_SERVERS: RTCConfiguration['iceServers'] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:3478' },
];

let peer: Peer.Instance | null = null;
let localStream: MediaStream | null = null;
let remoteStream: MediaStream | null = null;
let callState: 'idle' | 'calling' | 'ringing' | 'connected' | 'ended' = 'idle';
let callTargetUid: string | null = null;
let pendingOfferSdp: string | null = null;
let incomingTimeout: ReturnType<typeof setTimeout> | null = null;
let isMuted = false;
let isDeafened = false;
let isCameraOn = false;
let reconnecting = false;

type CallbackMap = {
  onStateChange: (state: typeof callState) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onCallEnd: () => void;
  onError: (err: string) => void;
};

const callbacks: CallbackMap = {
  onStateChange: () => {},
  onRemoteStream: () => {},
  onCallEnd: () => {},
  onError: () => {},
};

function setState(s: typeof callState) {
  callState = s;
  callbacks.onStateChange(s);
}

function emitCall(event: string, payload: CallPayload) {
  const sock = getSocket();
  if (!sock?.connected) {
    console.warn('[voice] Socket not connected, cannot emit:', event);
    return;
  }
  sock.emit(event, payload);
}

/* ── ICE restart on connection loss ── */
function iceRestart() {
  if (!peer || reconnecting) return;
  reconnecting = true;
  try {
    peer.once('signal', (data: SignalData) => {
      reconnecting = false;
      if (data.type === 'offer' && callTargetUid) {
        emitCall('call:offer', { from: '', to: callTargetUid, sdp: JSON.stringify(data) });
      }
    });
    (peer as any)._pc
      ?.createOffer({ iceRestart: true })
      .then((offer: RTCSessionDescriptionInit) => (peer as any)._pc?.setLocalDescription(offer))
      .catch(() => {
        reconnecting = false;
      });
  } catch {
    reconnecting = false;
  }
}

function setupPeerEvents(p: Peer.Instance, targetUid: string, _isInitiator: boolean) {
  p.on('signal', (data: SignalData) => {
    if (data.type === 'offer') {
      emitCall('call:offer', { from: '', to: targetUid, sdp: JSON.stringify(data) });
    } else if (data.type === 'answer') {
      emitCall('call:answer', { from: '', to: targetUid, sdp: JSON.stringify(data) });
    } else if (data.type === 'candidate') {
      emitCall('call:ice-candidate', { from: '', to: targetUid, ice: data.candidate });
    }
  });

  p.on('stream', (stream: MediaStream) => {
    remoteStream = stream;
    /* Nouvelle référence pour forcer le re-render React quand des pistes sont ajoutées (ex: vidéo) */
    callbacks.onRemoteStream(new MediaStream(stream.getTracks()));
  });

  p.on('connect', () => {
    setState('connected');
  });

  p.on('close', () => {
    if (callState === 'connected') {
      iceRestart();
    } else {
      cleanup();
      callbacks.onCallEnd();
    }
  });

  p.on('error', () => {
    if (callState === 'connected') {
      iceRestart();
    } else {
      cleanup();
      callbacks.onError('Erreur de connexion');
    }
  });
}

export async function startCall(targetUid: string): Promise<void> {
  if (peer) {
    console.warn('[voice] startCall: ending previous call');
    endCall();
  }

  callTargetUid = targetUid;
  setState('calling');

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    console.error('[voice] startCall: getUserMedia failed:', err);
    setState('idle');
    callbacks.onError("Impossible d'accéder au micro");
    return;
  }

  peer = new Peer({ initiator: true, stream: localStream, config: { iceServers: ICE_SERVERS } });
  setupPeerEvents(peer, targetUid, true);
}

export function handleIncomingCall(data: CallPayload): void {
  callTargetUid = data.from;
  pendingOfferSdp = data.sdp || null;
  setState('ringing');

  /* Auto-reject after 30s */
  if (incomingTimeout) clearTimeout(incomingTimeout);
  incomingTimeout = setTimeout(() => {
    if (callState === 'ringing') {
      rejectCall();
      callbacks.onError('Appel non répond');
    }
  }, 30000);
}

export async function acceptCall(): Promise<void> {
  if (!callTargetUid || peer) {
    if (!callTargetUid) console.warn('[voice] acceptCall: callTargetUid is null');
    if (peer) console.warn('[voice] acceptCall: peer already exists');
    return;
  }
  if (incomingTimeout) {
    clearTimeout(incomingTimeout);
    incomingTimeout = null;
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    console.error('[voice] getUserMedia failed:', err);
    setState('idle');
    callbacks.onError("Impossible d'accéder au micro");
    return;
  }

  peer = new Peer({ stream: localStream, config: { iceServers: ICE_SERVERS } });

  setupPeerEvents(peer, callTargetUid, false);

  if (pendingOfferSdp) {
    try {
      peer.signal(JSON.parse(pendingOfferSdp));
    } catch (err) {
      console.error('[voice] Failed to signal pending offer:', err);
    }
    pendingOfferSdp = null;
  }

  /* Transition immédiate pour cacher l'overlay entrant et afficher la barre d'appel */
  setState('calling');

  emitCall('call:accept', { from: '', to: callTargetUid });
}

export function rejectCall(): void {
  if (!callTargetUid) return;
  if (incomingTimeout) {
    clearTimeout(incomingTimeout);
    incomingTimeout = null;
  }
  emitCall('call:reject', { from: '', to: callTargetUid });
  setState('idle');
  callTargetUid = null;
  pendingOfferSdp = null;
}

export function handleAnswer(data: CallPayload): void {
  if (!peer || !data.sdp) {
    if (!peer) console.warn('[voice] handleAnswer: no peer');
    return;
  }
  try {
    peer.signal(JSON.parse(data.sdp));
  } catch (err) {
    console.error('[voice] handleAnswer: signal error:', err);
  }
}

export function handleOffer(data: CallPayload): void {
  if (!peer || !data.sdp) {
    if (!peer) console.warn('[voice] handleOffer: no peer');
    return;
  }
  try {
    peer.signal(JSON.parse(data.sdp));
  } catch (err) {
    console.error('[voice] handleOffer: signal error:', err);
  }
}

export function handleICE(data: CallPayload): void {
  if (!peer || !data.ice) return;
  try {
    peer.signal({ type: 'candidate', candidate: data.ice });
  } catch (err) {
    console.error('[voice] handleICE error:', err);
  }
}

export function handleRemoteEnd(): void {
  cleanup();
  callbacks.onCallEnd();
}

export function endCall(): void {
  if (callTargetUid) {
    emitCall('call:end', { from: '', to: callTargetUid });
  }
  cleanup();
  callbacks.onCallEnd();
}

export function toggleMute(): boolean {
  isMuted = !isMuted;
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }
  return isMuted;
}

export function toggleDeafen(): boolean {
  isDeafened = !isDeafened;
  if (remoteStream) {
    remoteStream.getAudioTracks().forEach((track) => {
      track.enabled = !isDeafened;
    });
  }
  return isDeafened;
}

export async function toggleCamera(): Promise<boolean> {
  isCameraOn = !isCameraOn;
  if (!peer) return false;

  const pc = (peer as any)._pc as RTCPeerConnection;
  if (isCameraOn) {
    try {
      const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = videoStream.getVideoTracks()[0];
      if (videoTrack && localStream) {
        localStream.addTrack(videoTrack);

        const existing = pc?.getSenders()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
        if (existing) {
          await existing.replaceTrack(videoTrack);
        } else if (pc) {
          /* addTrack attache la piste AVANT de déclencher negotiationneeded,
             contrairement à addTransceiver + replaceTrack où l'offre part sans piste */
          pc.addTrack(videoTrack, localStream);
        }
      }
    } catch (err) {
      console.error('[voice] toggleCamera on error:', err);
      isCameraOn = false;
    }
  } else if (localStream) {
    const videoTracks = localStream.getVideoTracks();
    videoTracks.forEach((t) => {
      t.stop();
      localStream?.removeTrack(t);
    });
    const sender = pc?.getSenders()?.find((s: RTCRtpSender) => s.track?.kind === 'video');
    if (sender) {
      try {
        await sender.replaceTrack(null);
      } catch (err) {
        console.error('[voice] toggleCamera off replaceTrack error:', err);
      }
    }
  }
  return isCameraOn;
}

export function getMuted(): boolean {
  return isMuted;
}
export function getDeafened(): boolean {
  return isDeafened;
}
export function getCameraOn(): boolean {
  return isCameraOn;
}

function cleanup(): void {
  setState('ended');
  if (incomingTimeout) {
    clearTimeout(incomingTimeout);
    incomingTimeout = null;
  }
  if (peer) {
    try {
      peer.destroy();
    } catch {}
    peer = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((t) => t.stop());
    localStream = null;
  }
  remoteStream = null;
  callTargetUid = null;
  pendingOfferSdp = null;
  isMuted = false;
  isDeafened = false;
  isCameraOn = false;
  reconnecting = false;
}

export function getRemoteStream(): MediaStream | null {
  return remoteStream;
}

export function getLocalStream(): MediaStream | null {
  return localStream;
}

export function getCallState(): typeof callState {
  return callState;
}

export function getCallTargetUid(): string | null {
  return callTargetUid;
}

export function subscribeCallbacks(cb: Partial<CallbackMap>): void {
  if (cb.onStateChange) callbacks.onStateChange = cb.onStateChange;
  if (cb.onRemoteStream) callbacks.onRemoteStream = cb.onRemoteStream;
  if (cb.onCallEnd) callbacks.onCallEnd = cb.onCallEnd;
  if (cb.onError) callbacks.onError = cb.onError;
}

export function unsubscribeCallbacks(): void {
  callbacks.onStateChange = () => {};
  callbacks.onRemoteStream = () => {};
  callbacks.onCallEnd = () => {};
  callbacks.onError = () => {};
}
