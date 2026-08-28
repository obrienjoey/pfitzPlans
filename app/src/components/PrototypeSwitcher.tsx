import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * PROTOTYPE — floating variant switcher (throwaway).
 * Cycles ?variant=A|B|C via arrow keys or the bar itself.
 */

const VARIANTS: Record<string, string> = {
    A: 'A — Signal (remove eyebrows)',
    B: 'B — Margin rail (labels to the side)',
    C: 'C — Pen annotations (quiet eyebrows)',
};

const isEditable = (el: EventTarget | null) => {
    const n = el as HTMLElement | null;
    if (!n) return false;
    if (n.tagName === 'INPUT' || n.tagName === 'TEXTAREA' || n.isContentEditable) return true;
    return false;
};

export const PrototypeSwitcher = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const keys = Object.keys(VARIANTS);

    const cycle = (dir: number) => {
        // Read fresh from the URL (not captured state) so rapid clicks/keypresses
        // never reuse a stale variant.
        const here = new URL(window.location.href);
        const cur = here.searchParams.get('variant') ?? 'A';
        const ci = VARIANTS[cur] ? keys.indexOf(cur) : 0;
        const next = keys[(ci + dir + keys.length) % keys.length];
        const params = new URLSearchParams(searchParams);
        params.set('variant', next);
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

    const current = searchParams.get('variant') ?? 'A';
    const valid = VARIANTS[current] ? current : 'A';

    return (
        <div
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-2 py-1.5 rounded-full border border-ink/20 bg-ink text-paper shadow-2xl font-data text-xs"
            aria-label="Prototype variant switcher"
        >
            <button
                onClick={() => cycle(-1)}
                aria-label="Previous variant"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-paper/10 hover:bg-paper/20 transition-colors"
            >
                ◀
            </button>
            <span className="px-2 whitespace-nowrap">{valid} — {VARIANTS[valid]}</span>
            <button
                onClick={() => cycle(1)}
                aria-label="Next variant"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-paper/10 hover:bg-paper/20 transition-colors"
            >
                ▶
            </button>
        </div>
    );
};
