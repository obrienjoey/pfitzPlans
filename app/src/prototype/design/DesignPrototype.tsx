import { useSearchParams } from 'react-router-dom';
import '@fontsource/barlow-condensed/500.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource-variable/spline-sans-mono';
import './design.css';
import type { RenderedPlan } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { DESIGN_META } from './designMeta';
import { DesignVariantA } from './designVariantA';
import { DesignVariantB } from './designVariantB';
import { DesignVariantC } from './designVariantC';
import { DesignSwitcher } from './DesignSwitcher';

/**
 * PROTOTYPE host — full-bleed overlay rendering one of three structural
 * variants of the plan page under the 'coach's paper training log' direction,
 * selected by ?design=A|B|C with a floating switcher. Dev builds only.
 */
export interface DesignPrototypeProps {
    schedule: RenderedPlan;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
    planName: string;
    planSource?: string;
}

export const DesignPrototype = ({ schedule, units, paces, planName, planSource }: DesignPrototypeProps) => {
    const [searchParams, setSearchParams] = useSearchParams();

    let design = (searchParams.get('design') || 'A').toUpperCase();
    if (!DESIGN_META.some((m) => m.key === design)) design = 'A';

    const select = (key: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('design', key);
        setSearchParams(next, { replace: true });
    };

    const exit = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('design');
        setSearchParams(next, { replace: true });
    };

    const shared = {
        schedule,
        units,
        paces,
        planName,
        // Raw plan descriptions arrive as '"Title" from "Book" by Author' — drop the quote marks.
        planSource: planSource?.replace(/"/g, ''),
    };

    return (
        <div className="fixed inset-0 z-[11000] overflow-y-auto overscroll-contain bg-slate-950/60 backdrop-blur-sm">
            {design === 'A' && <DesignVariantA {...shared} />}
            {design === 'B' && <DesignVariantB {...shared} />}
            {design === 'C' && <DesignVariantC {...shared} />}
            <DesignSwitcher current={design} onSelect={select} onExit={exit} />
        </div>
    );
};
