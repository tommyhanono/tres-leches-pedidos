export default function VerComprobante({ url, onCerrar }) {
  if (!url) return null
  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-imagen" onClick={(e) => e.stopPropagation()}>
        <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
          ✕
        </button>
        <img src={url} alt="Comprobante completo" />
        <a className="btn btn-sec modal-abrir" href={url} target="_blank" rel="noreferrer">
          Abrir en pestaña nueva ↗
        </a>
      </div>
    </div>
  )
}
