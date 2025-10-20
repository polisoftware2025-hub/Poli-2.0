
"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Check, Loader2, X } from "lucide-react"

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
  nextStep: () => void;
  prevStep: () => void;
  resetSteps: () => void;
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
  steps?: React.ReactNode[]
  setSteps?: React.Dispatch<React.SetStateAction<React.ReactNode[]>>
  activeStep?: number,
  currentStep?: number
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  (
    {
      children,
      className,
      initialStep = 0,
      orientation = "horizontal",
      currentStep,
      ...props
    },
    ref
  ) => {
    const isVertical = orientation === "vertical"
    const [steps, setSteps] = React.useState<React.ReactNode[]>([])
    const [internalActiveStep, setInternalActiveStep] = React.useState(initialStep);

    const activeStep = props.activeStep ?? internalActiveStep;

    const nextStep = () => setInternalActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    const prevStep = () => setInternalActiveStep(prev => Math.max(prev - 1, 0));
    const resetSteps = () => setInternalActiveStep(initialStep);

    return (
      <StepperContext.Provider
        value={{
          ...props,
          steps,
          setSteps,
          isVertical,
          initialStep,
          activeStep,
          nextStep,
          prevStep,
          resetSteps,
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

const StepperItem = React.forwardRef<HTMLDivElement, { children: React.ReactNode, title: string, index: number }>(
  ({ children, index }, ref) => {
    const { steps, setSteps, activeStep } = React.useContext(StepperContext)

    React.useEffect(() => {
      setSteps((prev) => [...prev, children])
    }, [children, setSteps])
    
    if (activeStep !== index) {
        return null;
    }

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

const StepperActions = ({ 
    onGenerate, 
    isGenerating,
    nextStep,
    prevStep,
 }: { 
    onGenerate: () => void;
    isGenerating: boolean;
    nextStep: () => void;
    prevStep: () => void;
 }) => {
    const { activeStep, steps } = useStepper();
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
