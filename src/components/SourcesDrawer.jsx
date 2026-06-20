import { useEffect, useState } from 'react';

const KIND_LABEL = {
  data: 'Data',
  email: 'Email',
  chat: 'Message',
};

export default function SourcesDrawer({ sources, open, activeId, onClose, onSelect }) {
  const [active, setActive] = useState(activeId || sources[0]?.id);

  useEffect(() => {
    if (activeId) setActive(activeId);
  }, [activeId]);

  // Lock body scroll while open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const activeSource = sources.find((s) => s.id === active) || sources[0];

  return (
    <div className={`drawer-root${open ? ' drawer-root--open' : ''}`} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={onClose} />
      <div className="drawer" role="dialog" aria-modal="true" aria-label="Source documents">
        <div className="drawer__handle" />
        <div className="drawer__head">
          <span className="eyebrow">Source documents</span>
          <button type="button" className="drawer__close" onClick={onClose} aria-label="Close sources">
            Close
          </button>
        </div>

        <div className="source-tabs" role="tablist">
          {sources.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={active === s.id}
              className={`source-tab${active === s.id ? ' source-tab--active' : ''}`}
              onClick={() => {
                setActive(s.id);
                onSelect?.(s.id);
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeSource && (
          <div className="source-body">
            <div className="source-body__kind">{KIND_LABEL[activeSource.kind] || 'Document'}</div>
            <pre className="source-content">{activeSource.content}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
