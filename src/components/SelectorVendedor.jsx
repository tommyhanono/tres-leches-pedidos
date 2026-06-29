import { VENDEDORES, PRODUCTO, PRECIO_UNITARIO, CAUSA } from '../config'
import { formatoMoneda } from '../lib/utils'

export default function SelectorVendedor({ onSeleccionar }) {
  return (
    <div className="selector">
      <div className="selector-card">
        <div className="logo">🍰</div>
        <h1>Tres Leches</h1>
        <p className="selector-sub">
          {PRODUCTO} · {formatoMoneda(PRECIO_UNITARIO)} c/u
        </p>
        <p className="causa">{CAUSA}</p>

        <h2 className="selector-pregunta">¿Quién eres?</h2>
        <div className="selector-botones">
          {VENDEDORES.map((nombre) => (
            <button
              key={nombre}
              className="btn btn-grande btn-vendedor"
              onClick={() => onSeleccionar(nombre)}
            >
              {nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
