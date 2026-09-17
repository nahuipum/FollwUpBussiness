export type WorkflowStep = Readonly<{
  label: string;
  state?: "complete" | "current" | "pending";
}>;

export function WorkflowStepper({ label, steps }: { label: string; steps: readonly WorkflowStep[] }) {
  return <nav className={`route-stepper route-stepper--${steps.length}`} aria-label={label}>
    {steps.map((step, index) => <Fragment key={step.label}><span className={`route-stepper__step${step.state === "current" ? " active" : step.state === "complete" ? " done" : ""}`} aria-current={step.state === "current" ? "step" : undefined}>
      <b>{index + 1}</b>{step.label}
    </span>{index < steps.length - 1 && <i className="route-stepper__connector" aria-hidden="true" />}</Fragment>)}
  </nav>;
}
import { Fragment } from "react";
