import { useState } from 'react'
import { supabase, BUCKET } from '../supabaseClient'
import { PRECIO_UNITARIO, YAPPY_NOMBRE, YAPPY_NUMERO, UMBRAL_DUPLICADO } from '../config'
import { calcularHash, distanciaHamming } from '../lib/ahash'
import { formatoMoneda } from '../lib/utils'

export default function NuevoPedido({ pedidos, onCerrar, onCreado }) {
  const [cliente, setCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [monto, setMonto] = useState(PRECIO_UNITARIO)
  const [montoEditado, setMontoEditado] = useState(false)
  const [metodoPago, setMetodoPago] = useState('yappy') // 'yappy' | 'efectivo'

  const [archivo, setArchivo] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [hash, setHash] = useState(null)
  const [aviso, setAviso] = useState(null) // {nombre} si parece duplicado

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // Cantidad cambia → recalcular monto salvo que el usuario lo haya editado a mano.
  function cambiarCantidad(valor) {
    const n = Math.max(1, parseInt(valor || '1', 10) || 1)
    setCantidad(n)
    if (!montoEditado) setMonto(n * PRECIO_UNITARIO)
  }

  function cambiarMonto(valor) {
    setMontoEditado(true)
    setMonto(valor)
  }

  async function cambiarArchivo(e) {
    const file = e.target.files?.[0]
    setAviso(null)
    if (!file) {
      setArchivo(null)
      setPreviewUrl(null)
      setHash(null)
      return
    }
    setArchivo(file)
    setPreviewUrl(URL.createObjectURL(file))

    // Calcular hash perceptual y comparar con los ya registrados.
    const h = await calcularHash(file)
    setHash(h)
    if (h) {
      let parecido = null
      for (const p of pedidos) {
        if (!p.comprobante_hash) continue
        const d = distanciaHamming(h, p.comprobante_hash)
        if (d <= UMBRAL_DUPLICADO) {
          parecido = p
          break
        }
      }
      if (parecido) setAviso({ nombre: parecido.cliente_nombre })
    }
  }

  function quitarFoto() {
    setArchivo(null)
    setPreviewUrl(null)
    setHash(null)
    setAviso(null)
  }

  async function guardar(e) {
    e.preventDefault()
    setError(null)

    if (!cliente.trim() || !direccion.trim()) {
      setError('El nombre del cliente y la dirección son obligatorios.')
      return
    }

    setGuardando(true)
    try {
      let comprobante_url = null

      if (archivo) {
        const ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase()
        const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
        const { error: errUp } = await supabase.storage
          .from(BUCKET)
          .upload(nombre, archivo, { cacheControl: '3600', upsert: false })
        if (errUp) throw errUp
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre)
        comprobante_url = data.publicUrl
      }

      const { error: errIns } = await supabase.from('pedidos').insert({
        cliente_nombre: cliente.trim(),
        direccion: direccion.trim(),
        cantidad,
        monto: Number(monto) || 0,
        comprobante_url,
        comprobante_hash: archivo ? hash : null,
        estado_entrega: 'pendiente',
        metodo_pago: metodoPago,
      })
      if (errIns) throw errIns

      onCreado()
    } catch (err) {
      console.error(err)
      setError('No se pudo guardar el pedido: ' + (err.message || err))
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-form-header">
          <h2>Nuevo pedido</h2>
          <button className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <form onSubmit={guardar} className="form">
          <div className="campo">
            <span>Forma de pago</span>
            <div className="metodo-selector">
              <button
                type="button"
                className={`metodo-btn ${metodoPago === 'yappy' ? 'metodo-activo' : ''}`}
                onClick={() => setMetodoPago('yappy')}
              >
                📱 Yappy
              </button>
              <button
                type="button"
                className={`metodo-btn ${metodoPago === 'efectivo' ? 'metodo-activo' : ''}`}
                onClick={() => setMetodoPago('efectivo')}
              >
                💵 Efectivo
              </button>
            </div>
          </div>

          {metodoPago === 'yappy' ? (
            <p className="pago-info">
              Pago por <strong>Yappy</strong> a {YAPPY_NOMBRE} · {YAPPY_NUMERO}
            </p>
          ) : (
            <p className="pago-info">
              Cobro en <strong>efectivo</strong> 💵
            </p>
          )}

          <label className="campo">
            <span>Nombre del cliente *</span>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: María Pérez"
              autoFocus
            />
          </label>

          <label className="campo">
            <span>Dirección de entrega *</span>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: Calle 50, edificio..."
            />
          </label>

          <div className="campo-fila">
            <label className="campo">
              <span>Cantidad</span>
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={cantidad}
                onChange={(e) => cambiarCantidad(e.target.value)}
              />
            </label>

            <label className="campo">
              <span>Monto ($)</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={monto}
                onChange={(e) => cambiarMonto(e.target.value)}
              />
            </label>
          </div>
          <p className="hint">
            Sugerido: {cantidad} × {formatoMoneda(PRECIO_UNITARIO)} ={' '}
            {formatoMoneda(cantidad * PRECIO_UNITARIO)}
          </p>

          <div className="campo">
            <span>Comprobante (opcional)</span>
            {!previewUrl ? (
              <div className="upload-botones">
                <label className="upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={cambiarArchivo}
                    hidden
                  />
                  <span className="upload-icono">📷</span>
                  <span>Tomar foto</span>
                </label>
                <label className="upload-btn">
                  <input type="file" accept="image/*" onChange={cambiarArchivo} hidden />
                  <span className="upload-icono">🖼️</span>
                  <span>Elegir de galería</span>
                </label>
              </div>
            ) : (
              <div className="upload-preview">
                <img src={previewUrl} alt="Vista previa del comprobante" />
                <button type="button" className="btn btn-sec" onClick={quitarFoto}>
                  Quitar foto
                </button>
              </div>
            )}
          </div>

          {aviso && (
            <div className="aviso-duplicado">
              ⚠️ Este comprobante se parece a uno ya registrado de{' '}
              <strong>{aviso.nombre}</strong>. Puedes continuar igual.
            </div>
          )}

          {error && <div className="error-box">{error}</div>}

          <div className="form-acciones">
            <button type="button" className="btn btn-sec" onClick={onCerrar} disabled={guardando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-ok" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar pedido'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
