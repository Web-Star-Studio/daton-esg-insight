import React, { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseDateSafe, formatDateForDB } from '@/utils/dateUtils';

interface DateInputWithCalendarFormProps {
  value: Date | null | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * Date input with manual typing (DD/MM/AAAA mask) + calendar picker.
 * Compatible with react-hook-form (accepts Date | null, emits Date | undefined).
 */
export function DateInputWithCalendarForm({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  className,
  disabled = false,
}: DateInputWithCalendarFormProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Sync display value when external value changes
  useEffect(() => {
    if (value && !isNaN(value.getTime())) {
      const day = String(value.getDate()).padStart(2, '0');
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const year = value.getFullYear();
      setDisplayValue(`${day}/${month}/${year}`);
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 8) input = input.slice(0, 8);

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

    if (input.length === 8) {
      const day = parseInt(input.slice(0, 2), 10);
      const month = parseInt(input.slice(2, 4), 10);
      const year = parseInt(input.slice(4, 8), 10);

      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const testDate = new Date(year, month - 1, day);
        if (
          testDate.getDate() === day &&
          testDate.getMonth() === month - 1 &&
          testDate.getFullYear() === year
        ) {
          onChange(testDate);
        }
      }
    }
  };

  const handleBlur = () => {
    if (displayValue && displayValue.length !== 10) {
      if (value && !isNaN(value.getTime())) {
        const day = String(value.getDate()).padStart(2, '0');
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const year = value.getFullYear();
        setDisplayValue(`${day}/${month}/${year}`);
      } else {
        setDisplayValue('');
      }
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    onChange(date);
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
            selected={value || undefined}
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
