import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { IMaskInput } from "react-imask";
import api from "../services/api";

function Cadastro() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
    telefone: "",
    tipo: "estudante",
  });
  const [foto, setFoto] = useState(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Cadastro";
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validarDados = () => {
    const { nome, email, senha, confirmarSenha, telefone, tipo } = form;

    if (nome.trim().length < 1)
      return "O nome deve ter pelo menos 1 caractere.";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return "E-mail inválido.";

    if (senha.length < 6)
      return "A senha deve ter no mínimo 6 caracteres.";

    if (senha !== confirmarSenha)
      return "As senhas não coincidem";

    if (!/^(\+55)?\s?\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(telefone.trim()))
      return "Telefone inválido. Ex: (21) 98787-8787";

    if (!["estudante", "proprietario"].includes(tipo))
      return "Tipo de usuário inválido.";
    return null;
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    const formatosPermitidos = ["image/jpeg", "image/png", "image/jpg"];
    if (file && !formatosPermitidos.includes(file.type)) {
      alert("Erro: Formato de imagem não suportado. Use JPEG, PNG ou JPG.");
      e.target.value = null;
      setFoto(null);
      return;
    }

    setFoto(file);
  };

  const handleCadastro = async (e) => {
    e.preventDefault();

    const erroValidacao = validarDados();
    if (erroValidacao) {
      alert(erroValidacao);
      return;
    }

    setCarregando(true);
    try {
      const formData = new FormData();
      formData.append("nome", form.nome.trim());
      formData.append("email", form.email.trim().toLowerCase());
      formData.append("senha", form.senha.trim());
      formData.append("telefone", form.telefone.trim());
      formData.append("tipo", form.tipo);

      if (foto) formData.append("foto", foto);

      await api.post("/usuarios/cadastrar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Cadastro realizado com sucesso!");
      navigate("/login");
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao cadastrar!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="cadastro-container">
      <h2>Cadastro</h2>
      <form onSubmit={handleCadastro} encType="multipart/form-data">

        <div className="form-group">
          <label>Foto de perfil</label>
          {foto && (
            <div className="preview-imagens">
              <img
                src={URL.createObjectURL(foto)}
                alt="Prévia da foto"
              />
              <p>Pré-visualização</p>
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
          <label htmlFor="senha">Senha</label>
          <input
            type={mostrarSenha ? "text" : "password"}
            name="senha"
            id="senha"
            value={form.senha}
            onChange={handleChange}
            placeholder="Digite a sua senha"
            required
            disabled={carregando}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmarSenha">Confirmar Senha</label>
          <input
            type={mostrarSenha ? "text" : "password"}
            name="confirmarSenha"
            id="confirmarSenha"
            value={form.confirmarSenha}
            onChange={handleChange}
            placeholder="Confirme a sua senha"
            required
            disabled={carregando}
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((prev) => !prev)}
            disabled={carregando}
            className="show-password-button"
          >
            {mostrarSenha ? "Ocultar as Senhas" : "Mostrar as Senhas"}
          </button>
        </div>

        <div className="form-group">
          <label htmlFor="telefone">Telefone</label>
          <IMaskInput
            mask={[
              "(00) 0000-0000",
              "(00) 00000-0000"
            ]}
            name="telefone"
            id="telefone"
            type="tel"
            value={form.telefone}
            onAccept={(value) => setForm(prev => ({ ...prev, telefone: value }))}
            placeholder="(21) 98787-8787"
            required
            disabled={carregando}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tipo">Tipo de usuário</label>
          <select
            name="tipo"
            id="tipo"
            value={form.tipo}
            onChange={handleChange}
            required
            disabled={carregando}
          >
            <option value="estudante">Estudante</option>
            <option value="proprietario">Proprietário</option>
          </select>
        </div>

        <p>
          Já possui uma conta? <Link to="/login">Faça o login aqui</Link>
        </p>

        <button type="submit" disabled={carregando} className="submit-button">
          {carregando ? "Cadastrando..." : "Cadastrar"}
        </button>

      </form>
    </div>
  );
}

export default Cadastro;
