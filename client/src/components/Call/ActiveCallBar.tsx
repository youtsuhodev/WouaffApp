import { useEffect, useRef, useState } from 'react';
import { useCall } from '../../hooks/useCall';

export default function ActiveCallBar() {
  const { state, callerInfo, remoteStream, localStream, muted, deafened, cameraOn, endCall, toggleMute, toggleDeafen, toggleCamera } = useCall();
  const [elapsed, setElapsed] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (state === 'connected') {
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    setElapsed(0);
  }, [state]);

  useEffect(() => {
    if (remoteStream && audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (cameraOn && localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    } else if (!cameraOn && localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, [cameraOn, localStream]);

  if (state !== 'connected' && state !== 'calling') return null;

  const name = callerInfo?.pseudo || '...';
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const duration = state === 'connected'
    ? `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : 'Appel en cours...';

  const hasRemoteVideo = remoteStream?.getVideoTracks().some(t => t.enabled);

  return (
    <>
      <audio ref={audioRef} autoPlay />
      {hasRemoteVideo && (
        <div className="call-video-container">
          <video ref={remoteVideoRef} autoPlay playsInline className="call-video-remote" />
        </div>
      )}
      {cameraOn && localStream && (
        <div className="call-video-self-container">
          <video ref={localVideoRef} autoPlay playsInline muted className="call-video-self" />
        </div>
      )}
      <div className="active-call-bar">
        <div className="active-call-info">
          <div className="active-call-name">{name}</div>
          <div className="active-call-duration">{duration}</div>
        </div>
        <div className="active-call-controls">
          <button
            className={`active-call-btn${muted ? ' active' : ''}`}
            onClick={toggleMute}
            title={muted ? 'Activer le micro' : 'Couper le micro'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              {muted
                ? <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                : <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>
              }
            </svg>
          </button>
          <button
            className={`active-call-btn${deafened ? ' active' : ''}`}
            onClick={toggleDeafen}
            title={deafened ? 'Réactiver le son' : 'Sourdine'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              {deafened
                ? <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
                : <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
              }
            </svg>
          </button>
          <button
            className={`active-call-btn active-call-btn-camera${cameraOn ? ' on' : ''}`}
            onClick={toggleCamera}
            title={cameraOn ? 'Éteindre la caméra' : 'Activer la caméra'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              {cameraOn
                ? <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                : <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H9.82l6.96 6.96c.14.14.22.34.22.54v2.62l4 4V6.5zM3.27 2L2 3.27 4.73 6H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.21 0 .39-.08.54-.18L19.73 21 21 19.73 3.27 2z"/>
              }
            </svg>
          </button>
          <button className="active-call-end" onClick={endCall} title="Raccrocher">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
