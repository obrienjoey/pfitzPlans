export const formatPlanLabel = (text: string, units: 'mi' | 'km'): string => {
    // Pattern: {mi_range:km_range} e.g. {8-9:13-14}
    return text.replace(/\{([0-9.-]+):([0-9.-]+)\}/g, (_, mi, km) => {
        return units === 'mi' ? mi : km;
    });
};
