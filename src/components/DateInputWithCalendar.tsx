import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseDateSafe, formatDateForDB } from '@/utils/dateUtils';

interface DateInputWithCalendarProps {
  value: string; // YYYY-MM-DD format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DateInputWithCalendar({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  className,
  disabled = false,
}: DateInputWithCalendarProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Sync display value when external value changes
  useEffect(() => {
    if (value) {
      const parsed = parseDateSafe(value);
      if (parsed) {
        const day = String(parsed.getDate()).padStart(2, '0');
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const year = parsed.getFullYear();
        setDisplayValue(`${day}/${month}/${year}`);
      } else {
        setDisplayValue('');
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  // Format input as DD/MM/AAAA while typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Limit to 8 digits
    if (input.length > 8) {
      input = input.slice(0, 8);
    }

    // Apply mask
    let formatted = '';
    if (input.length > 0) {
      formatted = input.slice(0, 2);
      if (input.length > 2) {
        formatted += '/' + input.slice(2, 4);
        if (input.length > 4) {
          formatted += '/' + input.slice(4, 8);
        }
      }
    }

    setDisplayValue(formatted);

    // Only update the actual value when we have a complete date
    if (input.length === 8) {
      const day = parseInt(input.slice(0, 2), 10);
      const month = parseInt(input.slice(2, 4), 10);
      const year = parseInt(input.slice(4, 8), 10);

      // Basic validation
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // Verify the date is valid
        const testDate = new Date(year, month - 1, day);
        if (
          testDate.getDate() === day &&
          testDate.getMonth() === month - 1 &&
          testDate.getFullYear() === year
        ) {
          onChange(dateStr);
        }
      }
    }
  };

  // Handle blur - clear invalid partial input
  const handleBlur = () => {
    if (displayValue && displayValue.length !== 10) {
      // Incomplete date - reset to current value or empty
      if (value) {
        const parsed = parseDateSafe(value);
        if (parsed) {
          const day = String(parsed.getDate()).padStart(2, '0');
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const year = parsed.getFullYear();
          setDisplayValue(`${day}/${month}/${year}`);
        }
      } else {
        setDisplayValue('');
      }
    }
  };

  // Handle calendar selection
  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const formatted = formatDateForDB(date);
      if (formatted) {
        onChange(formatted);
      }
    } else {
      onChange('');
    }
    setIsCalendarOpen(false);
  };

  return (
    <div className={cn('flex gap-2', className)}>
      <Input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
        className="flex-1"
      />
      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            className="shrink-0"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={parseDateSafe(value) || undefined}
            onSelect={handleCalendarSelect}
            initialFocus
            className="pointer-events-auto"
            fromYear={1900}
            toYear={2100}
            captionLayout="dropdown-buttons"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
