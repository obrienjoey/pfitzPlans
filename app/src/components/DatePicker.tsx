import { useState, useRef, useEffect } from 'react';
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
    isSameDay,
    isValid,
    parse
} from 'date-fns';
import clsx from 'clsx';

interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date) => void;
    className?: string;
    placeholder?: string;
}

export const DatePicker = ({ value, onChange, className, placeholder = "Select date..." }: DatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value || new Date());
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            setInputValue(format(value, 'MMM d, yyyy'));
            setCurrentMonth(value);
        } else {
            setInputValue('');
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        // Attempt to parse various formats
        const parsed = parse(val, 'yyyy-MM-dd', new Date());
        const parsedNicer = parse(val, 'MMM d, yyyy', new Date());

        if (isValid(parsed)) {
            onChange(parsed);
            setCurrentMonth(parsed);
        } else if (isValid(parsedNicer)) {
            onChange(parsedNicer);
            setCurrentMonth(parsedNicer);
        }
    };

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const days = eachDayOfInterval({
        start: startOfWeek(startOfMonth(currentMonth)),
        end: endOfWeek(endOfMonth(currentMonth))
    });

    const weeks = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    const isCompact = className?.includes('text-sm');

    return (
        <div className={clsx("relative", className)} ref={containerRef}>
            <div className="relative group">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onClick={() => setIsOpen(true)}
                    placeholder={placeholder}
                    className={clsx(
                        "w-full bg-slate-950 border border-slate-700 group-hover:border-slate-600 rounded-xl pr-4 text-white focus:ring-2 focus:ring-rose-500 outline-none shadow-lg transition-all",
                        isCompact ? 'pl-9 py-2 text-sm' : 'pl-12 py-3 text-lg'
                    )}
                />
                <div className={clsx(
                    "absolute top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none",
                    isCompact ? "left-3" : "left-4"
                )}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={isCompact ? "w-4 h-4" : "w-5 h-5"}>
                        <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 017.5 3v1.5h9V3A.75.75 0 0118 3v1.5h.75a3 3 0 013 3v11.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V7.5a3 3 0 013-3H6V3a.75.75 0 01.75-.75zm-3.75 8.25v9a1.5 1.5 0 001.5 1.5h15a1.5 1.5 0 001.5-1.5v-9h-18z" clipRule="evenodd" />
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 p-4 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 w-[300px] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={prevMonth} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                            </svg>
                        </button>
                        <span className="font-bold text-white">
                            {format(currentMonth, 'MMMM yyyy')}
                        </span>
                        <button onClick={nextMonth} className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                                        "h-8 w-8 text-sm rounded-lg flex items-center justify-center transition-all",
                                        !isCurrentMonth && "text-slate-600",
                                        isCurrentMonth && !isSelected && "text-slate-300 hover:bg-slate-800 hover:text-white",
                                        isSelected && "bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20",
                                        isToday && !isSelected && "ring-1 ring-rose-500/30 text-rose-400"
                                    )}
                                >
                                    {format(day, 'd')}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
