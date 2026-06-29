import { useState } from 'react'
import { supabase, BUCKET } from '../supabaseClient'
import { PRECIO_UNITARIO, YAPPY_NOMBRE, YAPPY_NUMERO, UMBRAL_DUPLICADO } from '../config'
import { calcularHash, distanciaHamming } from '../lib/ahash'
import { formatoMoneda } from '../lib/utils'

// `pedido` presente = modo edición. Ausente = nuevo pedido.
export default function PedidoForm({ pedido, pedidos, onCerrar, onGuardado }) {
  const editando = Boolean(pedido)

  const [cliente, setCliente] = useState(pedido?.cliente_nombre || '')
  const [direccion, setDireccion] = useState(pedido?.direccion || '')
  const [cantidad, setCantidad] = useState(pedido?.cantidad ?? 1)
  const [monto, setMonto] = useState(pedido ? pedido.monto : PRECIO_UNITARIO)
  // En edición no recalculamos el monto solo: respetamos lo que ya estaba.
  const [montoEditado, setMontoEditado] = useState(editando)
  const [metodoPago, setMetodoPago] = useState(pedido?.metodo_pago || 'yappy')

  const [archivo, setArchivo] = useState(null) // nuevo archivo elegido
  const [previewUrl, setPreviewUrl] = useState(null) // preview del nuevo archivo
  const [hash, setHash] = useState(null)
  // Comprobante ya guardado que conservamos (solo en edición).
  const [comprobanteActual, setComprobanteActual] = useState(pedido?.comprobante_url || null)
  const [aviso, setAviso] = useState(null) // {nombre} si parece duplicado

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const mostrarPreview = previewUrl || comprobanteActual

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
    if (!file) return
    setArchivo(file)
    setPreviewUrl(URL.createObjectURL(file))

    // Hash perceptual y comparación con los demás pedidos (excluye el actual).
    const h = await calcularHash(file)
    setHash(h)
    if (h) {
      let parecido = null
      for (const p of pedidos) {
        if (editando && p.id === pedido.id) continue
        if (!p.comprobante_hash) continue
        if (distanciaHamming(h, p.comprobante_hash) <= UMBRAL_DUPLICADO) {
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
    setComprobanteActual(null)
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
      let comprobante_hash = null

      if (archivo) {
        // Subir el nuevo archivo.
        const ext = (archivo.name.split('.').pop() || 'jpg').toLowerCase()
        const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
        const { error: errUp } = await supabase.storage
          .from(BUCKET)
          .upload(nombre, archivo, { cacheControl: '3600', upsert: false })
        if (errUp) throw errUp
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre)
        comprobante_url = data.publicUrl
        comprobante_hash = hash
      } else if (comprobanteActual) {
        // Conservar el comprobante que ya tenía.
        comprobante_url = comprobanteActual
        comprobante_hash = editando ? pedido.comprobante_hash : null
      }

      const payload = {
        cliente_nombre: cliente.trim(),
        direccion: direccion.trim(),
        cantidad,
        monto: Number(monto) || 0,
        comprobante_url,
        comprobante_hash,
        metodo_pago: metodoPago,
      }

      if (editando) {
        const { error: errUpd } = await supabase
          .from('pedidos')
          .update(payload)
          .eq('id', pedido.id)
        if (errUpd) throw errUpd
      } else {
        const { error: errIns } = await supabase
          .from('pedidos')
          .insert({ ...payload, estado_entrega: 'pendiente' })
        if (errIns) throw errIns
      }

      onGuardado()
    } catch (err) {
      console.error(err)
      setError('No se pudo guardar: ' + (err.message || err))
      setGuardando(false)
    }
  }

  async function borrar() {
    const ok = window.confirm(
      `¿Eliminar el pedido de "${pedido.cliente_nombre}"?\nEsta acción no se puede deshacer.`
    )
    if (!ok) return
    setError(null)
    setGuardando(true)
    try {
      const { error: errDel } = await supabase.from('pedidos').delete().eq('id', pedido.id)
      if (errDel) throw errDel
      onGuardado()
    } catch (err) {
      console.error(err)
      setError('No se pudo eliminar: ' + (err.message || err))
      setGuardando(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-form" onClick={(e) => e.stopPropagation()}>
        <div className="modal-form-header">
          <h2>{editando ? 'Editar pedido' : 'Nuevo pedido'}</h2>
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
              autoFocus={!editando}
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
            {!mostrarPreview ? (
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
                <img src={previewUrl || comprobanteActual} alt="Comprobante" />
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
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar pedido'}
            </button>
          </div>

          {editando && (
            <button
              type="button"
              className="btn btn-eliminar"
              onClick={borrar}
              disabled={guardando}
            >
              🗑 Eliminar pedido
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
