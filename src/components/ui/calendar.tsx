"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={es} // calendario en español
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown" // selector intuitivo de mes y año
      fromYear={1950}
      toYear={2050}
      className={`p-4 bg-white dark:bg-gray-900 rounded-xl shadow border ${className}`}
      classNames={{
        months: "flex flex-col sm:flex-row gap-6",
        month: "space-y-4",
        caption: "flex justify-center items-center gap-2 relative",
        caption_label: "text-sm font-semibold text-gray-700 dark:text-gray-200",
        nav: "flex items-center gap-1",
        nav_button:
          "h-8 w-8 flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        dropdown:
          "border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md px-2 py-1 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-gray-500 dark:text-gray-400 w-9 font-medium text-[0.8rem] text-center",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm relative",
        day: "h-9 w-9 flex items-center justify-center rounded-md text-gray-800 dark:text-gray-200 hover:bg-blue-100 dark:hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500",
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700 rounded-md",
        day_today:
          "bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 font-bold rounded-md border border-blue-500",
        day_outside:
          "text-gray-400 dark:text-gray-600 aria-selected:bg-blue-200 aria-selected:text-gray-600",
        day_disabled:
          "text-gray-300 dark:text-gray-600 line-through opacity-50",
        day_range_middle: "bg-blue-200 dark:bg-blue-700 text-blue-900",
        day_hidden: "invisible",
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft
            className={`h-5 w-5 ${className}`}
            {...props}
          />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight
            className={`h-5 w-5 ${className}`}
            {...props}
          />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }