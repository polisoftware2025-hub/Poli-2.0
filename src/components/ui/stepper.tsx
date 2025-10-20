
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "./button"

interface StepperContextValue extends StepperProps {
  clickable?: boolean
  isError?: boolean
  isLoading?: boolean
  isVertical?: boolean
  stepCount?: number
  expandVerticalSteps?: boolean
  activeStep: number
  initialStep: number;
}

const StepperContext = React.createContext<
  StepperContextValue & {
    steps: {
      index: number
      title: string
    }[]
    setSteps: React.Dispatch<React.SetStateAction<{ index: number; title: string }[]>>
    nextStep: () => void;
    prevStep: () => void;
    resetSteps: () => void;
  }
>({
  steps: [],
  setSteps: () => {},
  initialStep: 0,
  activeStep: 0,
  nextStep: () => {},
  prevStep: () => {},
  resetSteps: () => {},
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
    const [steps, setSteps] = React.useState<{ index: number; title: string }[]>([])
    const [activeStep, setActiveStep] = React.useState(initialStep)

    const nextStep = () => {
      setActiveStep((prev) => Math.min(prev + 1, steps.length -1))
    }
    const prevStep = () => {
      setActiveStep((prev) => Math.max(prev - 1, 0))
    }
    const resetSteps = () => {
      setActiveStep(initialStep)
    }

    const contextValue = React.useMemo(
      () => ({
        ...props,
        steps,
        setSteps,
        isVertical,
        initialStep,
        activeStep,
        nextStep,
        prevStep,
        resetSteps,
        orientation,
      }),
      [props, steps, isVertical, initialStep, activeStep, orientation]
    );

    return (
      <StepperContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(
            "stepper__main-container flex flex-col w-full",
            className
          )}
          {...props}
        >
          <div className={cn(
            "stepper__header-container",
            stepperVariants({ orientation }),
          )}>
            <div className="flex w-full items-center justify-center p-4 border-b">
                {steps.map((step, index) => (
                  <Step
                    key={step.title}
                    index={index}
                    label={step.title}
                    isCurrent={index === activeStep}
                    isCompleted={index < activeStep}
                    isLast={index === steps.length - 1}
                  />
                ))}
            </div>
          </div>
         {React.Children.toArray(children)[activeStep]}
        </div>
      </StepperContext.Provider>
    )
  }
)

Stepper.displayName = "Stepper"

const StepperItem = React.forwardRef<HTMLDivElement, { children: React.ReactNode; title: string; index: number }>(
  ({ title, index, children }, ref) => {
    const { setSteps } = React.useContext(StepperContext)

    React.useEffect(() => {
      setSteps((prev) => {
        const existing = prev.find(s => s.index === index);
        if (existing) return prev;
        return [...prev, { index, title }].sort((a,b) => a.index - b.index);
      })
    }, [index, title, setSteps])
    
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

  return (
    <div
      ref={ref}
      className={cn("stepper__step", stepVariants({ isLast }))}
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
      {!isLast && <div className="flex-1 w-full h-0.5 bg-border mx-4" />}
    </div>
  )
})

Step.displayName = "Step"

const useStepper = () => {
  return React.useContext(StepperContext)
}

const StepperActions = ({ 
    onGenerate, 
    isGenerating,
 }: { 
    onGenerate: () => void;
    isGenerating: boolean;
 }) => {
    const { activeStep, steps, prevStep, nextStep } = useStepper();
    const isLastStep = activeStep === steps.length - 1;

    return (
        <div className="flex justify-between w-full">
            <Button variant="outline" onClick={prevStep} disabled={activeStep === 0}>
                Anterior
            </Button>
             {isLastStep ? (
                <Button onClick={onGenerate} disabled={isGenerating}>
                    {isGenerating ? "Generando..." : "Generar Horario"}
                </Button>
            ) : (
                <Button onClick={nextStep}>Siguiente</Button>
            )}
        </div>
    );
};


export { Stepper, StepperItem, Step, useStepper, stepVariants, StepperActions }
