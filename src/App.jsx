import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, supabaseConfigurado } from './supabaseClient'
import SelectorVendedor from './components/SelectorVendedor'
import Header from './components/Header'
import Dashboard from './components/Dashboard'
import NuevoPedido from './components/NuevoPedido'
import VerComprobante from './components/VerComprobante'

const LS_VENDEDOR = 'tl_vendedor'

export default function App() {
  const [vendedor, setVendedor] = useState(() => localStorage.getItem(LS_VENDEDOR) || null)
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorCarga, setErrorCarga] = useState(null)

  const [mostrarNuevo, setMostrarNuevo] = useState(false)
  const [comprobanteVer, setComprobanteVer] = useState(null)

  const pedidosRef = useRef(pedidos)
  pedidosRef.current = pedidos

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
    if (!supabaseConfigurado || !vendedor) return

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
  }, [vendedor, cargarPedidos])

  function elegirVendedor(nombre) {
    localStorage.setItem(LS_VENDEDOR, nombre)
    setVendedor(nombre)
  }

  function cambiarVendedor() {
    localStorage.removeItem(LS_VENDEDOR)
    setVendedor(null)
  }

  async function marcarEntregado(pedido) {
    const { error } = await supabase
      .from('pedidos')
      .update({
        estado_entrega: 'entregado',
        entregado_por: vendedor,
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
      .update({ estado_entrega: 'pendiente', entregado_por: null, entregado_at: null })
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

  // ── Selector de vendedor ────────────────────────────────────
  if (!vendedor) {
    return <SelectorVendedor onSeleccionar={elegirVendedor} />
  }

  // ── App principal ───────────────────────────────────────────
  return (
    <div className="app">
      <Header vendedor={vendedor} onCambiarVendedor={cambiarVendedor} />

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
        onVerComprobante={setComprobanteVer}
      />

      <button className="fab" onClick={() => setMostrarNuevo(true)}>
        + Agregar
      </button>

      {mostrarNuevo && (
        <NuevoPedido
          vendedor={vendedor}
          pedidos={pedidos}
          onCerrar={() => setMostrarNuevo(false)}
          onCreado={() => {
            setMostrarNuevo(false)
            cargarPedidos()
          }}
        />
      )}

      <VerComprobante url={comprobanteVer} onCerrar={() => setComprobanteVer(null)} />
    </div>
  )
}
