import { useSearchParams } from 'react-router-dom';
import type { RenderedPlan } from '../../types';
import type { TrainingPaces } from '../../lib/paceCalculator';
import { EXPAND_META } from './meta';
import { VariantA } from './variantA';
import { VariantB } from './variantB';
import { VariantC } from './variantC';
import { ExpandSwitcher } from './ExpandSwitcher';

/**
 * PROTOTYPE host — replaces the weeks list on the plan route to prototype
 * three tap-to-reveal mechanics for mobile day pace (?expand=A|B|C).
 * Dev builds only. Read-only (no drag) — the question is how pace reveals.
 */
export const ExpandPrototype = ({
    schedule,
    units,
    paces,
}: {
    schedule: RenderedPlan;
    units: 'mi' | 'km';
    paces?: TrainingPaces;
}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    let expand = (searchParams.get('expand') || 'A').toUpperCase();
    if (!EXPAND_META.some((m) => m.key === expand)) expand = 'A';

    const select = (key: string) => {
        const next = new URLSearchParams(searchParams);
        next.set('expand', key);
        setSearchParams(next, { replace: true });
    };

    const exit = () => {
        const next = new URLSearchParams(searchParams);
        next.delete('expand');
        setSearchParams(next, { replace: true });
    };

    const shared = { schedule, units, paces };

    return (
        <>
            <div className="space-y-5">
                {expand === 'A' && <VariantA {...shared} />}
                {expand === 'B' && <VariantB {...shared} />}
                {expand === 'C' && <VariantC {...shared} />}
            </div>
            <ExpandSwitcher current={expand} onSelect={select} onExit={exit} />
        </>
    );
};
