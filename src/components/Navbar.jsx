import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

function Navbar() {
  const { usuario, logout } = useContext(AuthContext);

  function handleLogout() {
    logout();
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to={usuario ? "/home" : "/login"}>
          Início
        </Link>

        <ul className="navbar-links">
          {usuario ? (
            <><li><Link to="/meus-alugueis">Meus Alugueis</Link></li>
              {usuario.tipo === "proprietario" && (
                <>
                  <li><Link to="/painel-imoveis">Meus Imóveis</Link></li>
                  <li><Link to="/cadastro-imovel">Cadastrar Imóvel</Link></li>
                </>
              )}

              {usuario.tipo === "estudante" && (
                <>
                  <li><Link to="/favoritos">Favoritos</Link></li>
                </>
              )}

              <li className="navbar-user">
                <Link to="/perfil" className="navbar-profile-link">
                  <span className="navbar-username">{usuario.nome}</span>
                  {usuario.foto ? (
                    <img
                      src={usuario.foto}
                      alt="Avatar"
                      className="navbar-avatar"
                    />
                  ) : (
                    <div className="navbar-avatar placeholder">
                      {usuario.nome?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
              </li>

              <li>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="logout-button"
                >
                  Sair
                </button>
              </li>
            </>
          ) : (
            <>
              <li><Link to="/cadastro">Cadastrar</Link></li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}


export default Navbar;
