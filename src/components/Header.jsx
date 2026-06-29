import { CAUSA } from '../config'

export default function Header({ vendedor, onCambiarVendedor }) {
  return (
    <header className="header">
      <div className="header-top">
        <div className="header-titulo">
          <span className="header-emoji">🍰</span>
          <div>
            <h1>Tres Leches</h1>
            <p className="header-causa">{CAUSA}</p>
          </div>
        </div>
        <button className="btn-cambiar" onClick={onCambiarVendedor} title="Cambiar de vendedor">
          <span className="header-vendedor">{vendedor}</span>
          <span className="header-cambiar-txt">cambiar</span>
        </button>
      </div>
    </header>
  )
}
