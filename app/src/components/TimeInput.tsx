import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

interface TimeInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export const TimeInput = ({ value, onChange, className }: TimeInputProps) => {
    const [displayValue, setDisplayValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Sync internal state if external value changes (e.g. initial load)
        setDisplayValue(value);
    }, [value]);



    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;

        // Allow backspace to work naturally by not forcing format strictly on every char if deletion
        // But for simplicity, let's just strip non-valid chars
        val = val.replace(/[^0-9:]/g, '');

        setDisplayValue(val);
    };

    const handleBlur = () => {
        // On blur, try to strictly format whatever is there to H:MM:SS or MM:SS
        const digits = displayValue.replace(/\D/g, '');
        if (!digits) return;

        // Interpret "330" as 3:30 (3 mins 30s) or 3:30:00?
        // Marathon times are usually H:MM:SS.
        // If length is small (3 digits), assume H:MM. e.g. 300 -> 3:00 (3 hours). 
        // Wait, standard convention:
        // 3 digits: HMM e.g. 330 = 3:30 (3h 30m).
        // 4 digits: HHMM e.g. 1200 = 12:00.
        // 5 digits: HMMSS e.g. 33000 = 3:30:00
        // 6 digits: HHMMSS

        let seconds = 0;

        if (digits.length <= 2) {
            // likely minutes? unlikely for marathon plan. Let's assume hours if single digit? 
            // "3" -> 3:00:00.
            seconds = parseInt(digits) * 3600;
        } else if (digits.length === 3) {
            // "330" -> 3 hours 30 mins
            const h = parseInt(digits[0]);
            const m = parseInt(digits.slice(1));
            seconds = h * 3600 + m * 60;
        } else if (digits.length === 4) {
            // "0330" -> 3h 30m
            const h = parseInt(digits.slice(0, 2));
            const m = parseInt(digits.slice(2));
            seconds = h * 3600 + m * 60;
        } else {
            // 5 or 6 digits, includes seconds
            // 33000 -> 3:30:00
            const sec = parseInt(digits.slice(-2));
            const min = parseInt(digits.slice(-4, -2));
            const hour = parseInt(digits.slice(0, -4));
            seconds = hour * 3600 + min * 60 + sec;
        }



        // Wait, our formatTime utility returns M:SS (e.g. 350 -> 5:50). This isn't right for marathon total time.
        // We need a proper formatter for total time (H:MM:SS).

        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;

        const formatted = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        setDisplayValue(formatted);
        onChange(formatted);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            inputRef.current?.blur();
        }
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Goal (H:MM)"
            className={clsx(className, "text-center tracking-wider")}
        />
    );
};
