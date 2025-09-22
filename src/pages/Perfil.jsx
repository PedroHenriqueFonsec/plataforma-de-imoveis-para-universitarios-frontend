import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IMaskInput } from "react-imask";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

function Perfil() {
  const { usuario, logout, atualizarUsuario, carregandoAuth } = useContext(AuthContext);
  const [perfil, setPerfil] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senhaAtual: "",
    novaSenha: "",
    telefone: "",
  });
  const [foto, setFoto] = useState(null);
  const [previewFoto, setPreviewFoto] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [editando, setEditando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Meu Perfil";
    if (!carregandoAuth) {
      if (!usuario) {
        navigate("/login");
        return;
      }
    }
    carregarPerfil();
  }, [usuario, navigate, carregandoAuth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const carregarPerfil = async () => {
    setCarregando(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }
      const res = await api.get("/usuarios/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPerfil(res.data);
      setForm({
        nome: res.data.nome || "",
        email: res.data.email || "",
        senhaAtual: "",
        novaSenha: "",
        telefone: res.data.telefone || "",
      });
      setPreviewFoto(res.data.foto || null);
      setFoto(null);
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao carregar perfil!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const validarDados = () => {
    const { nome, email, senhaAtual, novaSenha, telefone } = form;
    if (nome.trim().length < 1)
      return "O nome deve ter pelo menos 1 caractere.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "E-mail inválido.";

    if (!senhaAtual.trim())
      return "Digite a senha atual para atualizar o perfil.";

    if (novaSenha.trim()) {
      if (novaSenha.trim().length < 6)
        return "A nova senha deve ter no mínimo 6 caracteres.";
      if (novaSenha.trim() === senhaAtual.trim())
        return "A nova senha deve ser diferente da atual.";
    }

    if (!/^(\+55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(telefone.trim()))
      return "Telefone inválido. Ex: (21) 98787-8787";
    return null;
  };

  const handleFotoChange = (e) => {
    const formatosPermitidos = ["image/jpeg", "image/png", "image/jpg"];
    const file = e.target.files[0];
    if (file && !formatosPermitidos.includes(file.type)) {
      alert("Erro: Formato de imagem não suportado. Use JPEG, PNG ou JPG.");
      e.target.value = null;
      setFoto(null);
      return;
    }

    setFoto(file);
  };

  const handleAtualizar = async (e) => {
    e.preventDefault();

    const erroValidacao = validarDados();
    if (erroValidacao) {
      alert(erroValidacao);
      return;
    }

    setCarregando(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("nome", form.nome.trim());
      formData.append("email", form.email.trim().toLowerCase());
      formData.append("senhaAtual", form.senhaAtual.trim());
      formData.append("telefone", form.telefone.trim());

      if (form.novaSenha.trim()) {
        formData.append("novaSenha", form.novaSenha.trim());
      }

      if (foto) formData.append("foto", foto);

      await api.put("/usuarios/perfil", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const res = await api.get("/usuarios/perfil", {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPerfil(res.data);
      atualizarUsuario(res.data);
      alert("Perfil atualizado com sucesso!");
      setEditando(false);
      setForm((prev) => ({ ...prev, senhaAtual: "", novaSenha: "" }));
      setFoto(null);
      setPreviewFoto(null);
      carregarPerfil();
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao atualizar perfil!";
      alert("Erro: " + mensagem);
    }
    finally {
      setCarregando(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (carregando || !usuario) return <p>Carregando perfil...</p>;

  if (!usuario || !perfil) return <p>Não foi possível carregar os dados do perfil.</p>;

  return (
    <div className="perfil-container">
      <h2>{editando ? "Editar Perfil" : "Perfil"}</h2>
      {!editando ? (
        <>
          <div className="preview-imagens">
            {previewFoto ? (
              <>
                <img src={previewFoto} alt="Foto de perfil" />
                <p><strong>Foto de Perfil</strong></p>
              </>
            ) : usuario.foto ? (
              <>
                <img src={usuario.foto} alt="Avatar" className="navbar-avatar" />
                <p><strong>Foto de Perfil</strong></p>
              </>
            ) : (
              <div className="avatar-placeholder">
                {usuario.nome?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <p><strong>Nome:</strong> {perfil.nome}</p>
          <p><strong>Email:</strong> {perfil.email}</p>
          <p><strong>Telefone:</strong> {perfil.telefone}</p>
          <p><strong>Tipo de Usuário:</strong> {perfil.tipo === "estudante" ? "Estudante" : "Proprietário"}</p>

          <button onClick={() => setEditando(true)} className="submit-button" disabled={carregando}>Editar Perfil</button>
          <button onClick={handleLogout} className="exit-button" disabled={carregando}>Sair</button>
        </>
      ) : (
        <form onSubmit={handleAtualizar}>

          <div className="form-group">
            <label>Foto de perfil</label>
            {foto ? (
              <div className="preview-imagens">
                <img
                  src={URL.createObjectURL(foto)}
                  alt="Prévia da nova foto"
                />
                <p>Pré-visualização</p>
              </div>
            ) : previewFoto ? (
              <div className="preview-imagens">
                <img src={previewFoto} alt="Foto atual" />
                <p><strong>Foto atual</strong></p>
              </div>
            ) : (
              <div className="avatar-placeholder">
                {usuario.nome?.charAt(0).toUpperCase()}
              </div>
            )}
            <input
              type="file"
              name="foto"
              id="foto"
              accept="image/jpeg, image/png, image/jpg"
              onChange={handleFotoChange}
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="nome">Nome</label>
            <input
              type="text"
              name="nome"
              id="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Digite o seu nome"
              required
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Digite o seu email"
              required
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="telefone">Telefone</label>
            <IMaskInput
              mask={[
                "(00) 0000-0000",
                "(00) 00000-0000"
              ]}
              value={form.telefone}
              onAccept={(value) => setForm(prev => ({ ...prev, telefone: value }))}
              disabled={carregando}
              placeholder="(21) 98787-8787"
              name="telefone"
              id="telefone"
              type="tel"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senhaAtual">Senha atual</label>
            <input
              type={mostrarSenha ? "text" : "password"}
              name="senhaAtual"
              id="senhaAtual"
              value={form.senhaAtual}
              onChange={handleChange}
              placeholder="Digite a sua senha atual"
              required
              disabled={carregando}
            />
          </div>

          <div className="form-group">
            <label htmlFor="novaSenha">Nova senha</label>
            <input
              type={mostrarSenha ? "text" : "password"}
              name="novaSenha"
              id="novaSenha"
              value={form.novaSenha}
              onChange={handleChange}
              placeholder="Digite a sua nova senha"
              disabled={carregando}
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((prev) => !prev)}
              className="show-password-button"
              disabled={carregando}
            >
              {mostrarSenha ? "Ocultar Senhas" : "Mostrar Senhas"}
            </button>
          </div>

          <button type="submit" disabled={carregando} className="submit-button">
            {carregando ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditando(false);
              setForm({
                nome: perfil.nome || "",
                email: perfil.email || "",
                telefone: perfil.telefone || "",
                senhaAtual: "",
                novaSenha: "",
              });
              setFoto(null);
              setPreviewFoto(perfil.foto || null);
            }}
            className="exit-button"
            disabled={carregando}
          >
            Cancelar
          </button>

        </form>
      )}
    </div>
  );
}

export default Perfil;
