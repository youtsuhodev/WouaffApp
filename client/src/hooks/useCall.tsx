import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import type { CallState, CallPayload, CallerInfo } from '../types';
import {
  onCallIncoming, offCallIncoming,
  onCallAccepted, offCallAccepted,
  onCallAnswer, offCallAnswer,
  onCallICE, offCallICE,
  onCallEnded, offCallEnded,
  onCallRejected, offCallRejected,
} from '../services/socket';
import {
  startCall as voiceStartCall,
  acceptCall as voiceAcceptCall,
  rejectCall as voiceRejectCall,
  endCall as voiceEndCall,
  handleIncomingCall,
  handleAnswer,
  handleOffer,
  handleICE,
  handleRemoteEnd,
  subscribeCallbacks,
  unsubscribeCallbacks,
  getRemoteStream,
  getLocalStream,
  toggleMute as voiceToggleMute,
  toggleDeafen as voiceToggleDeafen,
  toggleCamera as voiceToggleCamera,
  getMuted,
  getDeafened,
  getCameraOn,
} from '../services/voice';
import { profiles } from '../services/api';
import { playRingtone, stopRingtone } from '../utils/ringtone';

interface CallContextValue {
  state: CallState;
  remoteStream: MediaStream | null;
  localStream: MediaStream | null;
  callerInfo: CallerInfo | null;
  muted: boolean;
  deafened: boolean;
  cameraOn: boolean;
  startCall: (uid: string, pseudo: string, avatar?: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  toggleCamera: () => void;
}

const CallContext = createContext<CallContextValue>({
  state: 'idle',
  remoteStream: null,
  localStream: null,
  callerInfo: null,
  muted: false,
  deafened: false,
  cameraOn: false,
  startCall: () => {},
  acceptCall: () => {},
  rejectCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleDeafen: () => {},
  toggleCamera: () => {},
});

export function CallProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CallState>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const callTargetRef = useRef<{ uid: string; pseudo: string; avatar?: string } | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    if (state !== 'ringing') stopRingtone();
  }, [state]);

  useEffect(() => {
    subscribeCallbacks({
      onStateChange: (s) => setState(s === 'ended' ? 'idle' : s),
      onRemoteStream: (stream) => setRemoteStream(stream),
      onCallEnd: () => {
        setState('idle');
        setRemoteStream(null);
        setCallerInfo(null);
        setMuted(false);
        setDeafened(false);
        setCameraOn(false);
        callTargetRef.current = null;
      },
      onError: () => {
        setState('idle');
        setCallerInfo(null);
        callTargetRef.current = null;
      },
    });

    const onIncoming = async (data: CallPayload) => {
      /* Renégociation d'une piste vidéo en cours d'appel */
      if (stateRef.current === 'connected' && data.sdp) {
        handleOffer(data);
        return;
      }
      if (stateRef.current !== 'idle') return;
      try {
        const profile = await profiles.get(data.from);
        const info: CallerInfo = {
          uid: data.from,
          pseudo: ((profile as any)?.pseudo as string) || data.from,
          avatar: (profile as any)?.avatar as string | undefined,
        };
        setCallerInfo(info);
        callTargetRef.current = { uid: data.from, pseudo: info.pseudo, avatar: info.avatar };
        handleIncomingCall(data);
        playRingtone();
      } catch {
        setCallerInfo({ uid: data.from, pseudo: data.from });
        callTargetRef.current = { uid: data.from, pseudo: data.from };
        handleIncomingCall(data);
        playRingtone();
      }
    };

    const onAnswer = (data: CallPayload) => {
      handleAnswer(data);
    };

    const onICE = (data: CallPayload) => {
      handleICE(data);
    };

    const onEnded = () => {
      handleRemoteEnd();
    };

    const onAccepted = () => {
      /* caller notified that callee accepted */
    };

    const onRejected = () => {
      setState('idle');
      setCallerInfo(null);
      callTargetRef.current = null;
    };

    onCallIncoming(onIncoming);
    onCallAccepted(onAccepted);
    onCallAnswer(onAnswer);
    onCallICE(onICE);
    onCallEnded(onEnded);
    onCallRejected(onRejected);

    return () => {
      offCallIncoming(onIncoming);
      offCallAccepted(onAccepted);
      offCallAnswer(onAnswer);
      offCallICE(onICE);
      offCallEnded(onEnded);
      offCallRejected(onRejected);
      unsubscribeCallbacks();
    };
  }, []);

  const startCall = (uid: string, pseudo: string, avatar?: string) => {
    callTargetRef.current = { uid, pseudo, avatar };
    setCallerInfo({ uid, pseudo, avatar });
    voiceStartCall(uid);
  };

  const acceptCall = () => {
    voiceAcceptCall();
  };

  const rejectCall = () => {
    voiceRejectCall();
    setCallerInfo(null);
    callTargetRef.current = null;
  };

  const endCall = () => {
    voiceEndCall();
  };

  const toggleMute = () => {
    const val = voiceToggleMute();
    setMuted(val);
  };

  const toggleDeafen = () => {
    const val = voiceToggleDeafen();
    setDeafened(val);
  };

  const toggleCamera = () => {
    voiceToggleCamera().then(setCameraOn);
  };

  return (
    <CallContext.Provider value={{ state, remoteStream, localStream: getLocalStream(), callerInfo, muted, deafened, cameraOn, startCall, acceptCall, rejectCall, endCall, toggleMute, toggleDeafen, toggleCamera }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall(): CallContextValue {
  return useContext(CallContext);
}
