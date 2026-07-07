import { useEffect, useState } from 'react';
import { contacts as contactsAPI, groups as groupsAPI, messages as messagesAPI } from '../../services/api';
import type { MessageData } from '../../types';

interface ForwardModalProps {
  msg: MessageData;
  user: { uid: string } | null;
  currentChatWith: string | null;
  currentGroupId: string | null;
  onClose: () => void;
}

export default function ForwardModal({ msg, user, currentChatWith, currentGroupId, onClose }: ForwardModalProps) {
  const [contacts, setContacts] = useState<Record<string, { pseudo?: string; avatar?: string }>>({});
  const [groups, setGroups] = useState<Record<string, { group: { name: string; icon?: string } }>>({});

  useEffect(() => {
    contactsAPI
      .list()
      .then((r) => setContacts(r as any))
      .catch(() => {});
    groupsAPI
      .list()
      .then((r) => setGroups(r as any))
      .catch(() => {});
  }, []);

  const doForward = async (targetUid?: string, targetGid?: string) => {
    if (!user) return;
    const payload: Record<string, unknown> = {
      text: msg.text || '',
      type: msg.type || 'text',
      forwardedFrom: user.uid,
      forwardedSenderName: msg.senderName,
      messageTheme: 'default',
    };
    if (msg.imageData) {
      payload.imageData = msg.imageData;
      payload.type = 'image';
    }
    if (msg.fileData) {
      payload.fileData = msg.fileData;
      payload.fileName = msg.fileName;
      payload.type = 'file';
    }
    if (msg.audioData) {
      payload.audioData = msg.audioData;
      payload.duration = msg.duration;
      payload.type = 'voice';
    }
    if (msg.ephemeralDuration) {
      payload.ephemeralDuration = msg.ephemeralDuration;
    }
    try {
      if (targetUid) await messagesAPI.send(targetUid, payload);
      if (targetGid) await messagesAPI.sendGroup(targetGid, payload);
      onClose();
    } catch (e) {
      console.error('Forward failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-[var(--bg-card)] rounded-2xl p-5 max-w-[360px] w-[90%] max-h-[70vh] overflow-y-auto border border-[var(--border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-bold m-0 mb-3 text-[var(--text-primary)]">Transférer le message</h3>
        {Object.keys(contacts).length === 0 && Object.keys(groups).length === 0 && (
          <p className="text-text-muted text-xs">Aucune conversation disponible</p>
        )}
        {Object.keys(groups).length > 0 && (
          <>
            <div className="text-xs text-text-muted font-semibold my-2 uppercase tracking-[0.5px]">Groupes</div>
            {Object.entries(groups).map(([gid, g]) => {
              if (gid === currentGroupId) return null;
              return (
                <div key={gid} className="forward-item" onClick={() => doForward(undefined, gid)}>
                  <div className="forward-item-avatar">
                    {g.group.icon ? <img src={g.group.icon} alt="" /> : <span>{(g.group.name || 'G')[0]}</span>}
                  </div>
                  <span className="forward-item-name">{g.group.name}</span>
                </div>
              );
            })}
          </>
        )}
        {Object.keys(contacts).length > 0 && (
          <>
            <div className="text-xs text-text-muted font-semibold my-2 uppercase tracking-[0.5px]">Contacts</div>
            {Object.entries(contacts).map(([uid, c]) => {
              if (uid === currentChatWith) return null;
              return (
                <div key={uid} className="forward-item" onClick={() => doForward(uid)}>
                  <div className="forward-item-avatar">
                    {c.avatar ? <img src={c.avatar} alt="" /> : <span>{(c.pseudo || '?')[0]}</span>}
                  </div>
                  <span className="forward-item-name">{c.pseudo || uid}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
