import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  disabled?: boolean;
}

export function DateRangePicker({ startDate, endDate, onRangeChange, disabled }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    if (preset === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === 'this_week') {
      const first = now.getDate() - now.getDay();
      start.setDate(first);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === 'this_year') {
      start = new Date(now.getFullYear(), 0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (preset === 'all_time') {
      start = new Date(0);
      end.setHours(23, 59, 59, 999);
    }

    const formatLocalDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    onRangeChange(formatLocalDate(start), formatLocalDate(end));
    setIsOpen(false);
  };

  // Helper to format display date safely
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const startDisplay = formatDisplayDate(startDate) || 'Start Date';
  const endDisplay = formatDisplayDate(endDate) || 'End Date';

  return (
    <div className="relative inline-block text-left w-full sm:w-auto">
      <div 
        className={cn(
          "relative flex items-center justify-between bg-card border border-border/50 rounded-xl p-2 px-3 shadow-xl cursor-pointer hover:border-primary/50 transition-colors",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 mr-4">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">
            {startDisplay} - {endDisplay}
          </span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-border/50 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col space-y-4">
            {/* Custom Range */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Custom Range</label>
              <div className="flex flex-col gap-2">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => onRangeChange(e.target.value, endDate)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => onRangeChange(startDate, e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <hr className="border-border/40" />

            {/* Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Quick Select</label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePresetClick('today')}>Today</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePresetClick('this_week')}>This Week</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePresetClick('this_month')}>This Month</Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => handlePresetClick('this_year')}>This Year</Button>
                <Button variant="outline" size="sm" className="text-xs col-span-2" onClick={() => handlePresetClick('all_time')}>All Time</Button>
              </div>
            </div>
            
            <div className="pt-2">
              <Button className="w-full" onClick={() => setIsOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Invisible backdrop to close the popup when clicking outside */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
      )}
    </div>
  );
}
