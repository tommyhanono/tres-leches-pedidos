import { formatoMoneda, formatoFecha } from '../lib/utils'

export default function PedidoCard({ pedido, onMarcarEntregado, onRevertir, onVerComprobante }) {
  const entregado = pedido.estado_entrega === 'entregado'

  return (
    <div className={`card ${entregado ? 'card-entregado' : ''}`}>
      <div className="card-fila-top">
        <div className="card-cliente">
          <h3>{pedido.cliente_nombre}</h3>
          <p className="card-direccion">📍 {pedido.direccion}</p>
        </div>
        <span className={`badge ${entregado ? 'badge-entregado' : 'badge-pendiente'}`}>
          {entregado ? '✓ Entregado' : '⏳ Pendiente'}
        </span>
      </div>

      <div className="card-detalles">
        <span className="card-cantidad">
          {pedido.cantidad} {pedido.cantidad === 1 ? 'unidad' : 'unidades'}
        </span>
        <span className="card-monto">{formatoMoneda(pedido.monto)}</span>
      </div>

      {pedido.comprobante_url && (
        <button
          className="card-miniatura"
          onClick={() => onVerComprobante(pedido.comprobante_url)}
          title="Ver comprobante"
        >
          <img src={pedido.comprobante_url} alt="Comprobante" loading="lazy" />
          <span className="card-miniatura-lupa">🔍</span>
        </button>
      )}

      <div className="card-meta">
        <span>Registró: <strong>{pedido.registrado_por}</strong></span>
        <span>{formatoFecha(pedido.created_at)}</span>
      </div>

      {entregado && pedido.entregado_por && (
        <div className="card-meta card-meta-entrega">
          <span>Entregó: <strong>{pedido.entregado_por}</strong></span>
          {pedido.entregado_at && <span>{formatoFecha(pedido.entregado_at)}</span>}
        </div>
      )}

      <div className="card-acciones">
        {entregado ? (
          <button className="btn btn-sec" onClick={() => onRevertir(pedido)}>
            ↩ Revertir a pendiente
          </button>
        ) : (
          <button className="btn btn-ok" onClick={() => onMarcarEntregado(pedido)}>
            ✓ Marcar como entregado
          </button>
        )}
      </div>
    </div>
  )
}
