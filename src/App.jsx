import { useCallback, useEffect, useState } from 'react'
import { supabase, supabaseConfigurado } from './supabaseClient'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import PedidoForm from './components/PedidoForm'
import VerComprobante from './components/VerComprobante'

export default function App() {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  const [formAbierto, setFormAbierto] = useState(false)
  const [pedidoEditar, setPedidoEditar] = useState(null) // null = nuevo
  const [comprobanteVer, setComprobanteVer] = useState(null)

  function abrirNuevo() {
    setPedidoEditar(null)
    setFormAbierto(true)
  }

  function abrirEditar(pedido) {
    setPedidoEditar(pedido)
    setFormAbierto(true)
  }

  function cerrarForm() {
    setFormAbierto(false)
    setPedidoEditar(null)
  }

  const cargarPedidos = useCallback(async () => {
    if (!supabaseConfigurado) return
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error(error)
      setErrorCarga(error.message)
    } else {
      setPedidos(data || [])
      setErrorCarga(null)
    }
    setCargando(false)
  }, [])

  // Carga inicial + suscripción Realtime.
  useEffect(() => {
    if (!supabaseConfigurado) return

    cargarPedidos()

    const canal = supabase
      .channel('pedidos-cambios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        // Cualquier cambio (insert/update/delete) → recargar.
        cargarPedidos()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [cargarPedidos])

  async function marcarEntregado(pedido) {
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado_entrega: 'entregado',
        entregado_at: new Date().toISOString(),
      })
      .eq('id', pedido.id)
    if (error) {
      alert('No se pudo actualizar: ' + error.message)
    } else {
      cargarPedidos()
    }
  }

  async function revertirPedido(pedido) {
    const { error } = await supabase
      .from('pedidos')
      .update({ estado_entrega: 'pendiente', entregado_at: null })
      .eq('id', pedido.id)
    if (error) {
      alert('No se pudo actualizar: ' + error.message)
    } else {
      cargarPedidos()
    }
  }

  // ── Pantalla de configuración faltante ──────────────────────
  if (!supabaseConfigurado) {
    return (
      <div className="config-faltante">
        <div className="config-card">
          <h1>🍰 Tres Leches</h1>
          <h2>Falta conectar Supabase</h2>
          <p>
            Crea un archivo <code>.env</code> en la raíz del proyecto (puedes copiar{' '}
            <code>.env.example</code>) con tus claves:
          </p>
          <pre>
{`VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-public-key`}
          </pre>
          <p>Luego reinicia el servidor de desarrollo.</p>
        </div>
      </div>
    )
  }

  // ── App principal ───────────────────────────────────────────
  return (
    <div className="app">
      <Header />

      {errorCarga && (
        <div className="error-box error-carga">
          Error al cargar: {errorCarga}
        </div>
      )}

      <Dashboard
        pedidos={pedidos}
        cargando={cargando}
        onMarcarEntregado={marcarEntregado}
        onRevertir={revertirPedido}
        onEditar={abrirEditar}
        onVerComprobante={setComprobanteVer}
      />

      <button className="fab" onClick={abrirNuevo}>
        + Agregar
      </button>

      {formAbierto && (
        <PedidoForm
          pedido={pedidoEditar}
          pedidos={pedidos}
          onCerrar={cerrarForm}
          onGuardado={() => {
            cerrarForm()
            cargarPedidos()
          }}
        />
      )}

      <VerComprobante url={comprobanteVer} onCerrar={() => setComprobanteVer(null)} />
    </div>
  )
}
