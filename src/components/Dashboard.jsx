import { useMemo, useState } from 'react'
import PedidoCard from './PedidoCard'
import { formatoMoneda, exportarCSV } from '../lib/utils'
import { COSTO_UNITARIO } from '../config'

export default function Dashboard({
  pedidos,
  cargando,
  onMarcarEntregado,
  onRevertir,
  onEditar,
  onVerComprobante,
}) {
  const [filtro, setFiltro] = useState('pendiente') // 'pendiente' | 'entregado' | 'todos'
  const [busqueda, setBusqueda] = useState('')

  const totales = useMemo(() => {
    const total = pedidos.length
    const recaudado = pedidos.reduce((s, p) => s + (Number(p.monto) || 0), 0)
    const unidades = pedidos.reduce((s, p) => s + (Number(p.cantidad) || 0), 0)
    const costos = unidades * COSTO_UNITARIO
    const ganancia = recaudado - costos
    const pendientes = pedidos.filter((p) => p.estado_entrega !== 'entregado').length
    const entregados = total - pendientes
    return { total, recaudado, costos, ganancia, pendientes, entregados }
  }, [pedidos])

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return pedidos.filter((p) => {
      if (filtro === 'pendiente' && p.estado_entrega === 'entregado') return false
      if (filtro === 'entregado' && p.estado_entrega !== 'entregado') return false
      if (q && !p.cliente_nombre.toLowerCase().includes(q)) return false
      return true
    })
  }, [pedidos, filtro, busqueda])

  return (
    <div className="dashboard">
      <section className="contadores">
        <div className="contador">
          <span className="contador-num">{totales.total}</span>
          <span className="contador-lbl">Pedidos</span>
        </div>
        <div className="contador">
          <span className="contador-num">{totales.pendientes}</span>
          <span className="contador-lbl">Pendientes</span>
        </div>
        <div className="contador">
          <span className="contador-num">{totales.entregados}</span>
          <span className="contador-lbl">Entregados</span>
        </div>
        <div className="contador contador-dinero">
          <span className="contador-num">{formatoMoneda(totales.recaudado)}</span>
          <span className="contador-lbl">Recaudado</span>
        </div>
        <div className="contador">
          <span className="contador-num">{formatoMoneda(totales.costos)}</span>
          <span className="contador-lbl">Costos</span>
        </div>
        <div className="contador contador-ganancia">
          <span className="contador-num">{formatoMoneda(totales.ganancia)}</span>
          <span className="contador-lbl">Ganancia</span>
        </div>
      </section>

      <div className="controles">
        <input
          type="search"
          className="buscador"
          placeholder="🔎 Buscar por cliente…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="filtros">
          <button
            className={`chip ${filtro === 'pendiente' ? 'chip-activo' : ''}`}
            onClick={() => setFiltro('pendiente')}
          >
            Pendientes
          </button>
          <button
            className={`chip ${filtro === 'entregado' ? 'chip-activo' : ''}`}
            onClick={() => setFiltro('entregado')}
          >
            Entregados
          </button>
          <button
            className={`chip ${filtro === 'todos' ? 'chip-activo' : ''}`}
            onClick={() => setFiltro('todos')}
          >
            Todos
          </button>
        </div>

        <button
          className="btn btn-export"
          onClick={() => exportarCSV(pedidos)}
          disabled={pedidos.length === 0}
        >
          ⬇ Exportar CSV
        </button>
      </div>

      <section className="lista">
        {cargando ? (
          <p className="vacio">Cargando pedidos…</p>
        ) : visibles.length === 0 ? (
          <p className="vacio">
            {pedidos.length === 0
              ? 'Todavía no hay pedidos. Toca “+ Agregar” para crear el primero.'
              : 'No hay pedidos que coincidan con el filtro.'}
          </p>
        ) : (
          visibles.map((p) => (
            <PedidoCard
              key={p.id}
              pedido={p}
              onMarcarEntregado={onMarcarEntregado}
              onRevertir={onRevertir}
              onEditar={onEditar}
              onVerComprobante={onVerComprobante}
            />
          ))
        )}
      </section>
    </div>
  )
}
