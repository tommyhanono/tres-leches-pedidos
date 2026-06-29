// ─────────────────────────────────────────────────────────────
//  Utilidades varias
// ─────────────────────────────────────────────────────────────

export function formatoMoneda(monto) {
  const n = Number(monto) || 0
  return '$' + n.toFixed(2)
}

export function formatoFecha(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('es-PA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Escapa un campo para CSV (comillas, comas, saltos de línea).
function campoCSV(valor) {
  const s = valor == null ? '' : String(valor)
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"'
  }
  return s
}

export function exportarCSV(pedidos) {
  const cabeceras = [
    'Fecha',
    'Cliente',
    'Direccion',
    'Cantidad',
    'Monto',
    'Estado',
    'Entregado at',
    'Comprobante URL',
  ]

  const filas = pedidos.map((p) => [
    formatoFecha(p.created_at),
    p.cliente_nombre,
    p.direccion,
    p.cantidad,
    Number(p.monto).toFixed(2),
    p.estado_entrega,
    p.entregado_at ? formatoFecha(p.entregado_at) : '',
    p.comprobante_url || '',
  ])

  const csv = [cabeceras, ...filas]
    .map((fila) => fila.map(campoCSV).join(','))
    .join('\n')

  // BOM para que Excel reconozca los acentos.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const hoy = new Date().toISOString().slice(0, 10)
  a.href = url
  a.download = `tres-leches-pedidos-${hoy}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
