
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"

interface StepperContextValue extends StepperProps {
  clickable?: boolean
  isError?: boolean
  isLoading?: boolean
  isVertical?: boolean
  stepCount?: number
  expandVerticalSteps?: boolean
  activeStep: number
  initialStep: number
}

const StepperContext = React.createContext<
  StepperContextValue & {
    steps: React.ReactNode[]
    setSteps: React.Dispatch<React.SetStateAction<React.ReactNode[]>>
  }
>({
  steps: [],
  setSteps: () => {},
  initialStep: 0,
  activeStep: 0,
})

const stepperVariants = cva("flex w-full", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
})

interface StepperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  initialStep?: number
  orientation?: "vertical" | "horizontal"
  steps?: React.ReactNode[]
  setSteps?: React.Dispatch<React.SetStateAction<React.ReactNode[]>>
  activeStep?: number
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      children,
      className,
      initialStep = 0,
      orientation = "horizontal",
      ...props
    },
    ref
  ) => {
    const isVertical = orientation === "vertical"
    const [steps, setSteps] = React.useState<React.ReactNode[]>([])

    const activeStep = props.activeStep ?? initialStep

    return (
      <StepperContext.Provider
        value={{
          ...props,
          steps,
          setSteps,
          isVertical,
          initialStep,
          activeStep,
        }}
      >
        <div
          ref={ref}
          className={cn(
            "stepper__main-container",
            stepperVariants({ orientation }),
            className
          )}
          {...props}
        >
          {children}
        </div>
      </StepperContext.Provider>
    )
  }
)

Stepper.displayName = "Stepper"

const StepperItem = React.forwardRef<HTMLDivElement, { children: React.ReactNode }>(
  ({ children }, ref) => {
    const { setSteps } = React.useContext(StepperContext)

    React.useEffect(() => {
      setSteps((prev) => [...prev, children])
    }, [children, setSteps])

    return <div ref={ref}>{children}</div>
  }
)

StepperItem.displayName = "StepperItem"

const stepVariants = cva("flex items-center", {
  variants: {
    isLast: {
      true: "flex-[0_0_auto]",
      false: "flex-[1_0_auto]",
    },
    isVertical: {
      true: "flex-col",
      false: "flex-row",
    },
  },
  defaultVariants: {
    isLast: false,
    isVertical: false,
  },
})

const Step = React.forwardRef<
  HTMLDivElement,
  {
    label: string
    index: number
    isCompleted: boolean
    isCurrent: boolean
    isLast: boolean
  } & VariantProps<typeof stepVariants>
>(({ label, index, isCompleted, isCurrent, isLast }, ref) => {
  const { isVertical } = React.useContext(StepperContext)

  return (
    <div
      ref={ref}
      className={cn("stepper__step", stepVariants({ isLast, isVertical }))}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-x-2">
          <div
            className={cn(
              "stepper__step-icon-container",
              "flex items-center justify-center rounded-full text-xs font-medium w-8 h-8",
              isCompleted
                ? "bg-primary text-primary-foreground"
                : isCurrent
                  ? "border-2 border-primary"
                  : "bg-muted text-muted-foreground"
            )}
          >
            {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          <div className="stepper__step-label text-sm font-medium">{label}</div>
        </div>
      </div>
      {!isLast && <div className="flex-1 w-full h-0.5 bg-border mt-4" />}
    </div>
  )
})

Step.displayName = "Step"

const useStepper = () => {
  return React.useContext(StepperContext)
}

export { Stepper, StepperItem, Step, useStepper, stepVariants }
