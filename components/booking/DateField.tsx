"use client";

import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateFieldProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  /** Disable dates before this one (defaults to today — no past dates). */
  minDate?: Date;
  /** Optional hard maximum. */
  fromDate?: Date;
  invalid?: boolean;
}

export function DateField({
  value,
  onChange,
  placeholder = "Select a date",
  minDate,
  invalid,
}: DateFieldProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const disabledBefore = minDate ?? today;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-12 w-full justify-start rounded-xl border-2 px-4 text-left text-base font-medium",
            !value && "text-slate-400",
            invalid
              ? "border-destructive"
              : "border-slate-200 hover:border-brand-purple-300"
          )}
        >
          <CalendarIcon className="mr-2 h-5 w-5 text-brand-purple-500" />
          {value ? formatDate(value) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          disabled={{ before: disabledBefore }}
          defaultMonth={value ?? disabledBefore}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
