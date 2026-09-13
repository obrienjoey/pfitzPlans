// PROTOTYPE — throwaway shared switcher (issue #2). DEV only, never ships:
// returns null in production builds. Do not reuse in production code.
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface PrototypeVariantOption {
    key: string;
    label: string;
}

export const PrototypeSwitcher = ({ variants }: { variants: PrototypeVariantOption[] }) => {
    const [params, setParams] = useSearchParams();

    const current = params.get('variant') ?? 'prod';
    const idx = Math.max(
        0,
        variants.findIndex((v) => v.key === current),
    );

    const go = (dir: 1 | -1) => {
        const next = variants[(idx + dir + variants.length) % variants.length]!;
        setParams(
            (prev) => {
                const n = new URLSearchParams(prev);
                if (next.key === 'prod') n.delete('variant');
                else n.set('variant', next.key);
                return n;
            },
            { replace: true },
        );
    };

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const t = e.target as HTMLElement | null;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
            if (e.key === 'ArrowLeft') go(-1);
            else if (e.key === 'ArrowRight') go(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (import.meta.env.PROD) return null;

    const cur = variants[idx]!;
    return (
        <div
            role="toolbar"
            aria-label="Prototype variant switcher"
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-1 bg-ink text-paper shadow-2xl px-1.5 py-1.5 font-data"
        >
            <button
                onClick={() => go(-1)}
                aria-label="Previous variant"
                className="px-3 py-1.5 hover:bg-paper/20 text-lg leading-none"
            >
                ←
            </button>
            <span className="px-2 text-xs font-bold whitespace-nowrap">
                PROTO {cur.key} — {cur.label}
            </span>
            <button
                onClick={() => go(1)}
                aria-label="Next variant"
                className="px-3 py-1.5 hover:bg-paper/20 text-lg leading-none"
            >
                →
            </button>
        </div>
    );
};
