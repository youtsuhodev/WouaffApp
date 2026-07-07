import { useState, useRef } from 'react';
import { X, MapPin, Camera, Loader } from 'lucide-react';
import type { VideoData } from '../../types';

interface Props {
  onClose: () => void;
  onUploaded: (video: VideoData) => void;
}

export default function VideoUploader({ onClose, onUploaded }: Props) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; name?: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) { setError('Veuillez sélectionner une vidéo'); return; }
    if (file.size > 100 * 1024 * 1024) { setError('Vidéo trop volumineuse (max 100 Mo)'); return; }
    setVideoFile(file);
    setError('');
    const url = URL.createObjectURL(file);
    setPreview(url);
  };

  const getLocation = () => {
    if (!navigator.geolocation) { setError('Géolocalisation non disponible'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const loc: { lat: number; lng: number; name?: string } = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=10`, {
            headers: { 'User-Agent': 'WouaffApp/1.0' }
          });
          const data = await res.json();
          loc.name = data.display_name?.split(',')?.slice(0, 2)?.join(',') || undefined;
        } catch (e) { console.error(e); }
        setLocation(loc);
        setLocating(false);
      },
      () => { setLocating(false); setError('Impossible d\'obtenir la position'); },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleUpload = async () => {
    if (!videoFile) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (caption) formData.append('caption', caption);
      if (location) {
        formData.append('lat', location.lat.toString());
        formData.append('lng', location.lng.toString());
        if (location.name) formData.append('locationName', location.name);
      }
      const res = await fetch('/api/videos', { method: 'POST', body: formData });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Erreur upload'); }
      const data = await res.json();
      const v: VideoData = { id: data.id, uid: '', videoPath: data.videoPath, thumbnailPath: data.thumbnailPath, caption: data.caption, location: data.location, likesCount: 0, commentsCount: 0, createdAt: data.createdAt, liked: false };
      onUploaded(v);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'upload');
    }
    setUploading(false);
  };

  return (
    <div className="uploader-overlay" onClick={onClose}>
      <div className="uploader-modal" onClick={e => e.stopPropagation()}>
        <div className="uploader-header">
          <span>Publier une vidéo</span>
          <button onClick={onClose}><X size={22} /></button>
        </div>

        {error && <div className="uploader-error">{error}</div>}

        {!preview ? (
          <div className="uploader-select" onClick={() => videoInputRef.current?.click()}>
            <Camera size={48} />
            <span>Choisir une vidéo</span>
            <span className="uploader-hint">MP4, WebM – max 100 Mo</span>
            <input ref={videoInputRef} type="file" accept="video/*" hidden onChange={handleFileSelect} />
          </div>
        ) : (
          <div className="uploader-preview">
            <video src={preview} controls className="uploader-video" />
            <input className="uploader-caption" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Ajouter une légende..." maxLength={200} />

            <button className={`uploader-location-btn${location ? ' has-loc' : ''}`} onClick={getLocation} disabled={locating}>
              <MapPin size={18} />
              {locating ? 'Localisation...' : location ? location.name || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Ajouter la localisation'}
            </button>
            {location && <button className="uploader-remove-loc" onClick={() => setLocation(null)}>Retirer</button>}

            <button className="uploader-submit" onClick={handleUpload} disabled={uploading}>
              {uploading ? <><Loader size={18} className="spin" /> Publication...</> : 'Publier'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
