import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/Global.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const { login, usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login";
    if (usuario) {
      navigate("/home");
    }
  }, [usuario, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !senha.trim()) {
      alert("Preencha todos os campos.");
      return;
    }

    setCarregando(true);

    try {
      const res = await api.post("/usuarios/login", {
        email: email.trim().toLowerCase(),
        senha: senha.trim(),
      });

      login(res.data.usuario, res.data.token);
      navigate("/home");
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao fazer login!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Digite o seu Email"
            required
            disabled={carregando}
          />
        </div>

        <div className="form-group">
          <label htmlFor="senha">Senha</label>
          <input
            type={mostrarSenha ? "text" : "password"}
            name="senha"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Digite a sua Senha"
            required
            disabled={carregando}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((prev) => !prev)}
            disabled={carregando}
            className="show-password-button"
          >
            {mostrarSenha ? "Ocultar a Senha" : "Mostrar a Senha"}
          </button>
        </div>

        <p>
          Não tem uma conta? <Link to="/cadastro">Cadastre-se Aqui</Link>
        </p>

        <button type="submit" disabled={carregando} className="submit-button">
          {carregando ? "Entrando..." : "Entrar"}
        </button>

      </form>
    </div>
  );
}

export default Login;
