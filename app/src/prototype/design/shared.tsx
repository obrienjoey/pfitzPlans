import { KM_PER_MILE } from '../../lib/constants';
import { formatTime } from '../../lib/paceCalculator';
import type { TrainingPaces, PaceZone } from '../../lib/paceCalculator';
import { zoneColor } from './tokens';

/** PROTOTYPE pace read-out for a zone: "7:31–7:39" in the zone's color. */
export const PaceText = ({
    zone,
    paces,
    units,
    className = '',
}: {
    zone: PaceZone | null;
    paces?: TrainingPaces;
    units: 'mi' | 'km';
    className?: string;
}) => {
    if (!zone || !paces || !paces[zone]) return null;
    const range = paces[zone]!;
    const conv = (s: number) => (units === 'km' ? s : s * KM_PER_MILE);
    const pace =
        zone === 'Recovery'
            ? `> ${formatTime(conv(range.min))}`
            : range.min === range.max
                ? formatTime(conv(range.min))
                : `${formatTime(conv(range.min))}–${formatTime(conv(range.max))}`;
    const color = zoneColor(zone) ?? 'var(--dp-pencil)';
    return (
        <span className={`dp-data text-xs whitespace-nowrap ${className}`} style={{ color }}>
            {pace}/{units}
        </span>
    );
};
