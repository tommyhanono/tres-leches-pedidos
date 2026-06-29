import { CAUSA, PRODUCTO, PRECIO_UNITARIO } from '../config'
import { formatoMoneda } from '../lib/utils'

export default function Header() {
  return (
    <header className="header">
      <div className="header-top">
        <div className="header-titulo">
          <span className="header-emoji">🍰</span>
          <div>
            <h1>Tres Leches</h1>
            <p className="header-sub">
              {PRODUCTO} · {formatoMoneda(PRECIO_UNITARIO)} c/u
            </p>
          </div>
        </div>
      </div>
      <p className="header-causa">{CAUSA}</p>
    </header>
  )
}
