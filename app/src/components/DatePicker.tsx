import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay
} from 'date-fns';
import clsx from 'clsx';

interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date) => void;
    className?: string;
    placeholder?: string;
}

const POPUP_WIDTH = 300;
const POPUP_GAP = 8;
// Estimate used to decide whether to flip the popup above instead of below the input when
// there is not enough room on screen for the (fixed) calendar.
const POPUP_ESTIMATED_HEIGHT = 340;

export const DatePicker = ({ value, onChange, className, placeholder = "Select date..." }: DatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value || new Date());
    const [prevValue, setPrevValue] = useState<Date | null>(value);
    const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    // Keep the browsed month in sync with an externally-changed value. This is React's
    // documented "adjusting state during render" pattern (legal for a component's own state,
    // and not an effect), so it avoids the react-hooks/set-state-in-effect rule.
    if (value !== prevValue) {
        setPrevValue(value);
        if (value) {
            setCurrentMonth(value);
        }
    }

    const inputValue = value ? format(value, 'MMM d, yyyy') : '';

    // The popup is portaled to <body> and `position: fixed`, so it must be positioned from the
    // input's viewport rect and kept on-screen. This also escapes the mobile settings drawer,
    // whose sheet carries a persistent `transform` (from `animate-sheet-slide-up`) that would
    // otherwise become the containing block and misplace a fixed popup.
    const computeCoords = () => {
        const input = containerRef.current;
        if (!input) return;
        const rect = input.getBoundingClientRect();

        let left = rect.left;
        if (left + POPUP_WIDTH > window.innerWidth - POPUP_GAP) {
            left = Math.max(POPUP_GAP, window.innerWidth - POPUP_WIDTH - POPUP_GAP);
        }

        let top = rect.bottom + POPUP_GAP;
        if (top + POPUP_ESTIMATED_HEIGHT > window.innerHeight - POPUP_GAP) {
            top = Math.max(POPUP_GAP, rect.top - POPUP_ESTIMATED_HEIGHT - POPUP_GAP);
        }

        setCoords({ top, left });
    };

    const openPicker = () => {
        computeCoords();
        setIsOpen(true);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (containerRef.current?.contains(target)) return;
            if (popupRef.current?.contains(target)) return;
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Reposition the fixed popup whenever the page or the drawer's scroll container scrolls
    // or the viewport resizes while the popup is open.
    useEffect(() => {
        if (!isOpen) return;
        const reposition = () => computeCoords();
        window.addEventListener('scroll', reposition, true);
        window.addEventListener('resize', reposition);
        return () => {
            window.removeEventListener('scroll', reposition, true);
            window.removeEventListener('resize', reposition);
        };
    }, [isOpen]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 }),
        end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 })
    });

    const weeks = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    const isCompact = className?.includes('text-sm');

    return (
        <div className={clsx("relative", className)} ref={containerRef}>
            <div className="relative group">
                <input
                    type="text"
                    readOnly
                    inputMode="none"
                    autoComplete="off"
                    value={inputValue}
                    onFocus={openPicker}
                    onClick={openPicker}
                    placeholder={placeholder}
                    aria-expanded={isOpen}
                    aria-haspopup="dialog"
                    className={clsx(
                        "w-full bg-card border border-rule hover:border-pencil/60 rounded-none pr-4 text-ink font-data focus:ring-2 focus:ring-marker/60 outline-none transition-colors cursor-pointer",
                        isCompact ? 'pl-9 py-2 text-sm' : 'pl-12 py-3 text-lg'
                    )}
                />
                <div className={clsx(
                    "absolute top-1/2 -translate-y-1/2 text-pencil pointer-events-none",
                    isCompact ? "left-3" : "left-4"
                )}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={isCompact ? "w-4 h-4" : "w-5 h-5"}>
                        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm-3.75 8.25v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-9h-18z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>

            {isOpen && createPortal(
                <div
                    ref={popupRef}
                    role="dialog"
                    aria-label="Choose a date"
                    className="animate-in fade-in zoom-in-95 duration-200 fixed p-4 bg-card border border-rule shadow-2xl z-[300] w-[300px]"
                    style={{ top: coords?.top ?? 0, left: coords?.left ?? 0 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} aria-label="Previous month" className="p-1 hover:bg-paper text-pencil hover:text-ink transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <span className="font-bold text-ink font-data">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button onClick={nextMonth} aria-label="Next month" className="p-1 hover:bg-paper text-pencil hover:text-ink transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-pencil uppercase tracking-wider font-data">
                        {weeks.map(day => <div key={day}>{day}</div>)}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, i) => {
                            const isSelected = value && isSameDay(day, value);
                            const isCurrentMonth = isSameMonth(day, currentMonth);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={i}
                                    onClick={() => {
                                        onChange(day);
                                        setIsOpen(false);
                                    }}
                                    className={clsx(
                                        "h-8 w-8 text-sm rounded-none flex items-center justify-center transition-colors font-data",
                                        !isCurrentMonth && "text-pencil/40",
                                        isCurrentMonth && !isSelected && "text-ink hover:bg-paper hover:text-marker",
                                        isSelected && "bg-marker text-paper font-bold",
                                        isToday && !isSelected && "ring-1 ring-marker/50 text-marker"
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
