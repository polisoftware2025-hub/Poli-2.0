
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

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
  children: React.ReactNode[]
  initialStep?: number
  orientation?: "vertical" | "horizontal"
  activeStep: number,
  setActiveStep: React.Dispatch<React.SetStateAction<number>>,
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ children, className, initialStep = 0, orientation = "horizontal", activeStep, setActiveStep, ...rest }, ref) => {
    const steps = React.Children.toArray(children) as React.ReactElement<StepperItemProps>[];

    const childrenWithProps = React.Children.map(steps, (child, index) => {
      if (index === activeStep) {
        return React.cloneElement(child, { activeStep, setActiveStep });
      }
      return null;
    });

    return (
      <div ref={ref} className={cn("stepper__main-container flex flex-col w-full", className)} {...rest}>
        <div className={cn("stepper__header-container", stepperVariants({ orientation }))}>
          <div className="flex flex-col lg:flex-row w-full items-center justify-center p-4 border-b gap-4 lg:gap-0">
            {steps.map((step, index) => (
              <Step
                key={step.props.title}
                index={index}
                label={step.props.title}
                isCurrent={index === activeStep}
                isCompleted={index < activeStep}
                isLast={index === steps.length - 1}
              />
            ))}
          </div>
        </div>
        {childrenWithProps}
      </div>
    )
  }
)
Stepper.displayName = "Stepper"

interface StepperItemProps {
  children: React.ReactNode
  title: string
  index?: number;
  activeStep?: number;
  setActiveStep?: React.Dispatch<React.SetStateAction<number>>;
}

const StepperItem = React.forwardRef<HTMLDivElement, StepperItemProps>(
  ({ children }, ref) => {
    return <div ref={ref}>{children}</div>
  }
)
StepperItem.displayName = "StepperItem"

const stepVariants = cva("flex items-center w-full lg:w-auto", {
  variants: {
    isLast: {
      true: "flex-[0_0_auto]",
      false: "flex-[1_0_auto]",
    },
  },
  defaultVariants: {
    isLast: false,
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
  return (
    <div ref={ref} className={cn("stepper__step", stepVariants({ isLast }))}>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-x-2">
          <div
            className={cn(
              "stepper__step-icon-container",
              "flex items-center justify-center rounded-full text-xs font-medium w-8 h-8",
              isCompleted ? "bg-primary text-primary-foreground" : isCurrent ? "border-2 border-primary" : "bg-muted text-muted-foreground"
            )}
          >
            {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
          </div>
          <div className="stepper__step-label text-sm font-medium">{label}</div>
        </div>
      </div>
      {!isLast && <div className="flex-1 w-full h-0.5 bg-border mx-4 hidden lg:block" />}
    </div>
  )
})
Step.displayName = "Step"

export { Stepper, StepperItem }
