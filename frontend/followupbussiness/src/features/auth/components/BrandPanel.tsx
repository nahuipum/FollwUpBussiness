import { ChartNoAxesCombined } from 'lucide-react'

export function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><ChartNoAxesCombined /></span>
}

export function BrandPanel() {
  return <section className="brand-panel" aria-label="FollowUpBusiness">
    <div className="brand"><BrandMark />FollowUpBusiness</div>
    <div className="hero">
      <p className="eyebrow">Gestión comercial en campo</p>
      <h1>Tu operación, organizada desde el primer contacto.</h1>
      <p>Accede al panel para gestionar clientes, seguimiento y rutas de trabajo desde un solo lugar.</p>
      <div className="route-preview" aria-hidden="true">
        <div className="route-top"><i /><i /><i /></div>
        <div className="route-line" /><span /><span /><span />
        <div className="visit-card"><b>Próxima visita</b><i /><i /></div>
      </div>
    </div>
    <p className="brand-foot">Plataforma de uso interno · Acceso protegido</p>
  </section>
}
