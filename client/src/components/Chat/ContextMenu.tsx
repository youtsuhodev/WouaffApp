import { EMOJIS, toggleReaction } from '../../utils/chatHelpers';
import type { MessageData } from '../../types';

interface ContextMenuProps {
  x: number;
  y: number;
  mid: string;
  msg: MessageData;
  convId: string;
  isGroup: boolean;
  isOwn: boolean;
  onReply: () => void;
  onEdit: () => void;
  onForward: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function ContextMenu({ x, y, mid, msg, convId, isGroup, isOwn, onReply, onEdit, onForward, onTogglePin, onDelete, onClose }: ContextMenuProps) {
  return (
    <div className="ctx-menu" style={{ position: 'fixed', left: x, top: y, zIndex: 9999 } as React.CSSProperties}>
      <div className="ctx-reactions">
        {EMOJIS.map(e => (
          <span key={e} className="ctx-emoji" onClick={() => { toggleReaction(mid, e, convId, isGroup); onClose(); }}>{e}</span>
        ))}
      </div>
      <div className="ctx-divider" />
      {!msg.deleted && (
        <div className="ctx-item" onClick={() => { onReply(); onClose(); }}>
          ↩️ Répondre
        </div>
      )}
      {isOwn && !msg.deleted && (
        <>
          <div className="ctx-item" onClick={() => { onEdit(); onClose(); }}>
            ✏️ Modifier
          </div>
          <div className="ctx-item" onClick={() => { onForward(); onClose(); }}>
            📤 Transférer
          </div>
          <div className="ctx-item" onClick={() => { onTogglePin(); onClose(); }}>
            📌 {msg.pinned ? 'Désépingler' : 'Épingler'}
          </div>
          <div className="ctx-item danger" onClick={() => { onDelete(); onClose(); }}>
            🗑️ Supprimer
          </div>
        </>
      )}
    </div>
  );
}
