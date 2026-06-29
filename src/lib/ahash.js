// ─────────────────────────────────────────────────────────────
//  aHash (average hash) — hash perceptual de imágenes en el cliente.
//  Sirve para detectar comprobantes (capturas de Yappy) muy parecidos.
// ─────────────────────────────────────────────────────────────

const TAM = 8 // imagen reducida a 8x8 = 64 bits

function cargarImagen(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}

// Devuelve un string de 64 caracteres '0'/'1'. null si no se pudo calcular.
export async function calcularHash(file) {
  try {
    const img = await cargarImagen(file)
    const canvas = document.createElement('canvas')
    canvas.width = TAM
    canvas.height = TAM
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, TAM, TAM)
    const { data } = ctx.getImageData(0, 0, TAM, TAM)

    // Convertir a escala de grises.
    const grises = []
    for (let i = 0; i < data.length; i += 4) {
      grises.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
    }

    const promedio = grises.reduce((a, b) => a + b, 0) / grises.length
    return grises.map((g) => (g >= promedio ? '1' : '0')).join('')
  } catch (e) {
    console.warn('[Tres Leches] No se pudo calcular el hash de la imagen:', e)
    return null
  }
}

// Distancia de Hamming entre dos hashes (cuántos bits difieren).
export function distanciaHamming(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity
  let d = 0
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) d++
  }
  return d
}
