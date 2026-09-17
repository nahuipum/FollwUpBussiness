import type { AssignmentStep } from "../hooks/assignmentFlow";

const steps = [
  { id: "configure", title: "Configurar", description: "Responsables y vigencia" },
  { id: "clients", title: "Agregar clientes", description: "Busca y construye el lote" },
  { id: "review", title: "Revisar", description: "Compara y confirma" },
] as const;

export function AssignmentStepper({ step, selectedCount }: { step: AssignmentStep; selectedCount: number }) {
  const activeIndex = steps.findIndex((item) => item.id === step);
  return (
    <ol className="customer-assignment__steps" aria-label="Progreso de la asignación">
      {steps.map((item, index) => (
        <li key={item.id} className={`customer-assignment__step${index < activeIndex ? " customer-assignment__step--done" : ""}${index === activeIndex ? " customer-assignment__step--active" : ""}`} aria-current={index === activeIndex ? "step" : undefined}>
          <span className="customer-assignment__step-index" aria-hidden="true">{index + 1}</span>
          <span><strong>{item.title}</strong><small>{item.id === "clients" && step === "review" ? `${selectedCount} cliente${selectedCount === 1 ? "" : "s"}` : item.description}</small></span>
        </li>
      ))}
    </ol>
  );
}
