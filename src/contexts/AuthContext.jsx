import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const navigate = useNavigate();

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expiry = payload.exp * 1000;
      return Date.now() > expiry;
    } catch {
      return true;
    }
  };

  function login(usuario, token) {
    setUsuario(usuario);
    localStorage.setItem("usuario", JSON.stringify(usuario));
    localStorage.setItem("token", token);
  }

  function logout() {
    setUsuario(null);
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    navigate("/login");
  }

  const atualizarUsuario = (novoUsuario) => {
    setUsuario(novoUsuario);
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if ((event.key === "token" || event.key === "usuario") && event.newValue === null) {
        logout();
        window.location.href = "/login";
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("usuario");
    if (!token || isTokenExpired(token)) {
      logout();
      return;
    }
    if (userData) {
      setUsuario(JSON.parse(userData));
    }
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, login, logout, atualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;
