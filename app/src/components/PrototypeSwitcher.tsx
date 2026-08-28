import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * PROTOTYPE — floating palette switcher (throwaway, branch only).
 * Cycles ?palette=A|B|C via arrow keys or the bar itself.
 */

const VARIANTS: Record<string, string> = {
    A: 'A — Blueprint / carbon',
    B: 'B — Aged ledger / oxblood',
    C: 'C — Grey carbonless / red pencil',
};

const isEditable = (el: EventTarget | null) => {
    const n = el as HTMLElement | null;
    if (!n) return false;
    if (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.isContentEditable) return true;
    return false;
};

export const PrototypeSwitcher = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const current = searchParams.get('palette') ?? 'A';
    const valid = VARIANTS[current] ? current : 'A';
    const keys = Object.keys(VARIANTS);
    const idx = keys.indexOf(valid);

    const cycle = (dir: number) => {
        const next = keys[(idx + dir + keys.length) % keys.length];
        const params = new URLSearchParams(searchParams);
        params.set('palette', next);
        setSearchParams(params, { replace: true });
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (isEditable(e.target)) return;
            if (e.key === 'ArrowLeft') { e.preventDefault(); cycle(-1); }
            if (e.key === 'ArrowRight') { e.preventDefault(); cycle(1); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (import.meta.env.PROD) return null;

    return (
        <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-2 py-1.5 rounded-full border border-ink/20 bg-ink text-paper shadow-2xl font-data text-xs"
            aria-label="Prototype palette switcher"
        >
            <button
                onClick={() => cycle(-1)}
                aria-label="Previous palette"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-paper/10 hover:bg-paper/20 transition-colors"
            >
                ◀
            </button>
            <span className="px-2 whitespace-nowrap">{valid} — {VARIANTS[valid]}</span>
            <button
                onClick={() => cycle(1)}
                aria-label="Next palette"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-paper/10 hover:bg-paper/20 transition-colors"
            >
                ▶
            </button>
        </div>
    );
};
