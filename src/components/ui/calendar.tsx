"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, useNavigation } from "react-day-picker"
import { es } from "date-fns/locale"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        caption_dropdowns: "flex justify-center gap-2",
        nav: "space-x-1 flex items-center",
        nav_button:
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        Dropdown: (dropdownProps) => {
          const { fromDate, fromMonth, fromYear, toDate, toMonth, toYear } = useDayPicker();
          const { goToMonth, month } = useNavigation();
        
          if (dropdownProps.name === "months") {
            const months = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1));
            return (
              <Select
                onValueChange={(value) => {
                  const newDate = new Date(month);
                  newDate.setMonth(parseInt(value));
                  goToMonth(newDate);
                }}
                value={month.getMonth().toString()}
              >
                <SelectTrigger className="w-[120px] text-sm py-1 h-8 focus:ring-0 focus:ring-offset-0 border-none shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m, i) => (
                     <SelectItem key={i} value={i.toString()}>
                      {format(m, "MMMM", { locale: es })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
        
          if (dropdownProps.name === "years") {
            const startYear = fromYear || new Date().getFullYear() - 100;
            const endYear = toYear || new Date().getFullYear();
            const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
            
            return (
              <Select
                onValueChange={(value) => {
                  const newDate = new Date(month);
                  newDate.setFullYear(parseInt(value));
                  goToMonth(newDate);
                }}
                value={month.getFullYear().toString()}
              >
                 <SelectTrigger className="w-[80px] text-sm py-1 h-8 focus:ring-0 focus:ring-offset-0 border-none shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );
          }
        
          return null;
        }
        
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
