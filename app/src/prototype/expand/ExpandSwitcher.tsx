import { useEffect } from 'react';
import { EXPAND_META } from './meta';

/** PROTOTYPE chrome — floating switcher for the tap-to-reveal variants (?expand=A|B|C). */
export const ExpandSwitcher = ({
    current,
    onSelect,
    onExit,
}: {
    current: string;
    onSelect: (key: string) => void;
    onExit: () => void;
}) => {
    const idx = Math.max(0, EXPAND_META.findIndex((m) => m.key === current));

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                onSelect(EXPAND_META[(idx - 1 + EXPAND_META.length) % EXPAND_META.length].key);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                onSelect(EXPAND_META[(idx + 1) % EXPAND_META.length].key);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [idx, onSelect]);

    return (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[12000] flex items-center gap-1 bg-slate-900/95 text-white rounded-full pl-2 pr-1 py-1.5 shadow-2xl border border-slate-700">
            <button
                onClick={() => onSelect(EXPAND_META[(idx - 1 + EXPAND_META.length) % EXPAND_META.length].key)}
                className="px-2 py-1 rounded-full hover:bg-slate-700 text-lg leading-none"
                title="Previous variant"
            >
                ‹
            </button>
            <span className="px-2 text-xs font-bold whitespace-nowrap">
                {current} — {EXPAND_META[idx].name}
            </span>
            <button
                onClick={() => onSelect(EXPAND_META[(idx + 1) % EXPAND_META.length].key)}
                className="px-2 py-1 rounded-full hover:bg-slate-700 text-lg leading-none"
                title="Next variant"
            >
                ›
            </button>
            <button
                onClick={onExit}
                className="ml-1 px-2 py-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white text-xs leading-none"
                title="Exit prototype"
            >
                ✕
            </button>
        </div>
    );
};
