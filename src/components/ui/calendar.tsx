"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"
import { addYears, format, getYear, setMonth, setYear } from "date-fns"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Button } from "./button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const [view, setView] = React.useState<"day" | "month" | "year">("day")
  const [currentDate, setCurrentDate] = React.useState(props.month || new Date())
  const [yearRange, setYearRange] = React.useState(() => {
    const start = Math.floor(getYear(currentDate) / 12) * 12
    return { start, end: start + 11 }
  })
  
  const handleHeaderClick = () => {
    if (view === "day") {
      setView("month")
    } else if (view === "month") {
      const start = Math.floor(getYear(currentDate) / 12) * 12
      setYearRange({ start, end: start + 11 })
      setView("year")
    }
  }

  const handleMonthSelect = (monthIndex: number) => {
    setCurrentDate(setMonth(currentDate, monthIndex))
    setView("day")
  }

  const handleYearSelect = (year: number) => {
    setCurrentDate(setYear(currentDate, year))
    setView("month")
  }

  const handlePrevClick = () => {
    if (view === "day") {
      const newDate = addYears(currentDate, -1)
      setCurrentDate(newDate)
    }
    if (view === "year") {
      setYearRange((prev) => ({ start: prev.start - 12, end: prev.end - 12 }))
    }
  }

  const handleNextClick = () => {
    if (view === "day") {
      const newDate = addYears(currentDate, 1)
      setCurrentDate(newDate)
    }
    if (view === "year") {
      setYearRange((prev) => ({ start: prev.start + 12, end: prev.end + 12 }))
    }
  }

  const renderMonthView = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = setMonth(new Date(), i)
      return {
        name: format(monthDate, "MMM", { locale: es }),
        index: i,
      }
    })

    return (
      <div className="grid grid-cols-3 gap-2 p-4">
        {months.map((month) => (
          <Button
            key={month.index}
            variant="ghost"
            onClick={() => handleMonthSelect(month.index)}
            className="h-14 text-sm"
          >
            {month.name.charAt(0).toUpperCase() + month.name.slice(1)}
          </Button>
        ))}
      </div>
    )
  }

  const renderYearView = () => {
    const years = Array.from(
      { length: yearRange.end - yearRange.start + 1 },
      (_, i) => yearRange.start + i
    )

    return (
      <div className="grid grid-cols-4 gap-2 p-4">
        {years.map((year) => (
          <Button
            key={year}
            variant="ghost"
            onClick={() => handleYearSelect(year)}
            className="h-12 text-sm"
          >
            {year}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <div
      className={cn("p-3 bg-card rounded-md border w-full", className)}
    >
      <div className="flex justify-between items-center mb-2">
        {(view === "year" || view === "day") && (
          <Button variant="outline" size="icon" onClick={handlePrevClick} className="h-7 w-7">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" onClick={handleHeaderClick} className="flex-1 text-center font-semibold">
           {view === "day" && format(currentDate, "MMMM yyyy", { locale: es })}
           {view === "month" && format(currentDate, "yyyy", { locale: es })}
           {view === "year" && `${yearRange.start} - ${yearRange.end}`}
        </Button>
        {(view === "year" || view === "day") && (
          <Button variant="outline" size="icon" onClick={handleNextClick} className="h-7 w-7">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {view === "day" && (
        <DayPicker
          locale={es}
          month={currentDate}
          onMonthChange={setCurrentDate}
          showOutsideDays={showOutsideDays}
          className="p-0"
          classNames={{
            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "hidden",
            nav: "hidden",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              buttonVariants({ variant: "ghost" }),
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
            ),
            day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground",
            day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
            ...classNames,
          }}
          {...props}
        />
      )}
      {view === "month" && renderMonthView()}
      {view === "year" && renderYearView()}
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
