import { useContext, useState, useEffect, useRef } from "react";
import api from "../services/api";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useNavigate, useParams } from "react-router-dom";
import "leaflet/dist/leaflet.css";
import { AuthContext } from "../contexts/AuthContext";

function EditarImovel() {
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    preco: 0,
    tipo: "kitnet",
    area: 1,
    latitude: null,
    longitude: null,
    endereco: "",
    quartos: 1,
    banheiros: 1,
    mobiliado: false,
    permitidoPet: false,
    garagem: false,
    status: "disponivel"
  });
  const [imovel, setImovel] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [imagensAntigas, setImagensAntigas] = useState([]);
  const [imagensNovas, setImagensNovas] = useState({});
  const [coordenadasAtuais, setCoordenadasAtuais] = useState(null);
  const { id } = useParams();
  const { usuario, carregandoAuth } = useContext(AuthContext);
  const [estudantes, setEstudantes] = useState([]);
  const [locatario, setLocatario] = useState(null);
  const [acesso, setAcesso] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const inputRefs = useRef([]);
  const edicaoDesabilitada = form.status === "pendente" || form.status === "alugado" || carregando;

  useEffect(() => {
    if (!carregandoAuth) {
      if (!usuario || usuario.tipo !== "proprietario") {
        navigate("/login");
        return;
      }
      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }
    }
    document.title = "Editar Imóvel";
    carregarImovel();
    carregarLocatario();
    carregarEstudantes();
  }, [usuario, navigate, token, carregandoAuth]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const carregarImovel = async () => {
    setCarregando(true);

    try {
      const res = await api.get(`/imoveis/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const imovelData = res.data;
      if (imovelData.status !== "disponivel" && usuario._id !== imovelData.proprietario?._id) {
        alert("Você não tem permissão para editar este imóvel.");
        navigate("/painel-imoveis");
        return;
      }

      setAcesso(true);
      setImovel(imovelData);
      setForm({
        titulo: imovelData.titulo,
        descricao: imovelData.descricao,
        preco: imovelData.preco,
        tipo: imovelData.tipo,
        area: imovelData.area,
        latitude: imovelData.latitude,
        longitude: imovelData.longitude,
        endereco: imovelData.endereco,
        quartos: imovelData.quartos,
        banheiros: imovelData.banheiros,
        mobiliado: imovelData.mobiliado,
        permitidoPet: imovelData.permitidoPet,
        garagem: imovelData.garagem,
        status: imovelData.status,
      });
      setImagensAntigas(imovelData.imagens || []);
      setCoordenadasAtuais({ lat: imovelData.latitude, lng: imovelData.longitude });
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao carregar imóvel!";
      alert("Erro: " + mensagem);
      navigate("/painel-imoveis");
    } finally {
      setCarregando(false);
    }
  };

  const carregarEstudantes = async () => {
    try {
      const res = await api.get("/usuarios/estudantes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEstudantes(res.data);
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao carregar estudantes!";
      alert("Erro: " + mensagem);
    }
  };

  const buscarEndereco = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "Plataforma-Imoveis/1.0" } }
      );
      const data = await res.json();
      if (data?.display_name) {
        setForm((prev) => ({ ...prev, endereco: data.display_name }));
      }
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao buscar o endereço no mapa!";
      alert("Erro: " + mensagem);
    }
  };

  function MapaClickHandler() {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        setForm(prev => ({ ...prev, latitude: lat, longitude: lng }));
        buscarEndereco(lat, lng);
      },
    });
    return null;
  }

  const carregarLocatario = async () => {
    try {
      const res = await api.get(`/alugueis/imovel/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.locatario) {
        setLocatario(res.data.locatario);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        alert("Erro ao buscar locatário.");
        console.error(err);
      }
    }
  };

  const handleTrocarImagem = (slotIndex, event) => {
    const file = event.target.files?.[0];
    const formatosPermitidos = ["image/jpeg", "image/png", "image/jpg"];

    if (file) {
      if (!formatosPermitidos.includes(file.type)) {
        alert("Erro: Formato de imagem não suportado. Use JPEG, PNG ou JPG.");
        event.target.value = null;
        return;
      }

      setImagensNovas((prev) => ({ ...prev, [slotIndex]: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    if (form.titulo.trim().length < 1) {
      alert("O título deve ter pelo menos 1 caractere.");
      setCarregando(false);
      return;
    }

    if (form.preco <= 0) {
      alert("O aluguel deve ser maior que zero.");
      setCarregando(false);
      return;
    }

    if (form.area <= 0) {
      alert("A área deve ser maior que zero.");
      setCarregando(false);
      return;
    }

    if (form.quartos <= 0) {
      alert("O número de quartos deve ser maior que zero.");
      setCarregando(false);
      return;
    }

    if (form.banheiros <= 0) {
      alert("O número de banheiros deve ser maior que zero.");
      setCarregando(false);
      return;
    }

    if (!["apartamento", "casa", "kitnet"].includes(form.tipo)) {
      alert("Tipo de imóvel inválido.");
      setCarregando(false);
      return;
    }

    if (imagensAntigas.length === 0 && Object.keys(imagensNovas).length === 0) {
      alert("Selecione pelo menos uma imagem.");
      setCarregando(false);
      return;
    }

    if (Object.keys(imagensNovas).length > 8) {
      alert("Você só pode enviar no máximo 8 imagens.");
      setCarregando(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("titulo", form.titulo.trim());
      formData.append("descricao", form.descricao.trim());
      formData.append("preco", Number(form.preco));
      formData.append("tipo", form.tipo);
      if (form.latitude && form.longitude) {
        formData.append("latitude", form.latitude);
        formData.append("longitude", form.longitude);
      }
      formData.append("endereco", form.endereco.trim());
      formData.append("quartos", Number(form.quartos));
      formData.append("banheiros", Number(form.banheiros));
      formData.append("area", Number(form.area));
      formData.append("mobiliado", form.mobiliado);
      formData.append("permitidoPet", form.permitidoPet);
      formData.append("garagem", form.garagem);
      formData.append("status", form.status);
      Object.entries(imagensNovas).forEach(([slot, file]) => {
        formData.append("imagens", file);
        formData.append("slots", slot);
      });

      await api.put(`/imoveis/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Imóvel atualizado com sucesso!");
      navigate("/painel-imoveis");
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao editar imóvel!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  if (carregando || !usuario) return <p>Carregando imóvel...</p>;

  if (!acesso) { return null; }

  return (
    <div className="cadastro-container">

      <h2>Editar Imóvel</h2>
      {locatario ? (
        <p><strong>Locatário:</strong> {locatario.nome} ({locatario.email})</p>
      ) : (
        <p><strong>Locatário:</strong> Nenhum locatário ainda</p>
      )}
      <form onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="titulo">Título</label>
          <input
            type="text"
            name="titulo"
            id="titulo"
            value={form.titulo}
            onChange={handleChange}
            placeholder="Digite o título do imóvel"
            required
            disabled={edicaoDesabilitada}
          />
        </div>

        <div className="form-group">
          <label htmlFor="descricao">Descrição</label>
          <textarea
            type="text"
            name="descricao"
            id="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descreva o imóvel"
            disabled={edicaoDesabilitada}
          />
        </div>

        <div className="form-group">
          <label>Selecione a nova localização no mapa:</label>
          <MapContainer
            center={[-22.4338, -42.9791]}
            zoom={15}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {!edicaoDesabilitada && <MapaClickHandler />}
            {form.latitude && form.longitude && <Marker position={[form.latitude, form.longitude]} />}
          </MapContainer>

          {form.latitude && form.longitude && (
            <p>Coordenadas: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</p>
          )}
          {form.endereco && (
            <p>
              <strong>
                {coordenadasAtuais &&
                  (form.latitude !== coordenadasAtuais.lat || form.longitude !== coordenadasAtuais.lng)
                  ? "Novo Endereço"
                  : "Endereço Atual"
                }:
              </strong> {form.endereco}
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="preco">Aluguel</label>
          <input
            type="number"
            name="preco"
            id="preco"
            value={form.preco}
            min="0"
            onChange={handleChange}
            placeholder="Digite o valor do aluguel"
            required
            disabled={edicaoDesabilitada}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tipo">Tipo</label>
          <select
            name="tipo"
            id="tipo"
            value={form.tipo}
            onChange={handleChange}
            required
            disabled={edicaoDesabilitada}
          >
            <option value="apartamento">Apartamento</option>
            <option value="casa">Casa</option>
            <option value="kitnet">Kitnet</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="status">Status do Imóvel</label>
          <select
            name="status"
            id="status"
            value={form.status}
            onChange={handleChange}
            disabled={carregando || form.status === "pendente" || form.status === "alugado"}
            required
          >
            {["disponivel", "indisponivel"].map((status) => (
              <option key={status} value={status}>
                {status === "disponivel" ? "Disponível" : "Indisponível"}
              </option>
            ))}

            {["pendente", "alugado"].includes(form.status) && (
              <option value={form.status}>
                {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
              </option>
            )}
          </select>

          {["pendente", "alugado"].includes(form.status) && (
            <p style={{ fontSize: "0.9rem", color: "gray", marginTop: "0.3rem" }}>
              O imóvel está {form.status}.
            </p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="area">Área (m²)</label>
          <input
            type="number"
            id="area"
            name="area"
            value={form.area}
            onChange={handleChange}
            min="1"
            required
            disabled={edicaoDesabilitada}
          />
        </div>

        <div className="form-group">
          <label htmlFor="quartos">Quartos</label>
          <input
            type="number"
            id="quartos"
            name="quartos"
            value={form.quartos}
            onChange={handleChange}
            min="1"
            required
            disabled={edicaoDesabilitada}
          />
        </div>

        <div className="form-group">
          <label htmlFor="banheiros">Banheiros</label>
          <input
            type="number"
            id="banheiros"
            name="banheiros"
            value={form.banheiros}
            onChange={handleChange}
            min="1"
            required
            disabled={edicaoDesabilitada}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              id="mobiliado"
              name="mobiliado"
              checked={form.mobiliado}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.checked,
                }))
              }
              disabled={edicaoDesabilitada}
            />
            Imóvel mobiliado
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              id="permitidoPet"
              name="permitidoPet"
              checked={form.permitidoPet}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.checked,
                }))
              }
              disabled={edicaoDesabilitada}
            />
            Permite pets
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              id="garagem"
              name="garagem"
              checked={form.garagem}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  [e.target.name]: e.target.checked,
                }))
              }
              disabled={edicaoDesabilitada}
            />
            Possui garagem
          </label>
        </div>

        <div className="form-group">
          <label>Imagens do imóvel</label>
          <div className="preview-new-imagens">
            {[...Array(8)].map((_, idx) => {
              const urlAntiga = imagensAntigas[idx];
              const novaImg = imagensNovas[idx];
              return (
                <div key={idx} className="imagem-wrapper">
                  {urlAntiga || novaImg ? (
                    <img
                      className="imagem-atual"
                      src={novaImg ? URL.createObjectURL(novaImg) : urlAntiga}
                      alt={`Imagem ${idx + 1}`}
                      onClick={() => inputRefs.current[idx]?.click()}
                    />
                  ) : (
                    <button
                      className="botao-adicionar-imagem"
                      type="button"
                      disabled={edicaoDesabilitada}
                      onClick={() => inputRefs.current[idx]?.click()}
                      style={{ width: "200px", height: "200px", border: "2px dashed gray", borderRadius: "8px", transition: "all 0.3s ease" }}
                    >
                      + Adicionar Imagem
                    </button>
                  )}

                  <input
                    type="file"
                    id="imagem"
                    name="imagens"
                    accept="image/jpeg, image/png, image/jpg"
                    style={{ display: "none" }}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    onChange={(e) => handleTrocarImagem(idx, e)}
                    disabled={edicaoDesabilitada}
                  />
                </div>
              );
            })}
          </div>

        </div>

        <button type="submit" disabled={edicaoDesabilitada}>
          {carregando ? "Salvando..." : "Salvar Alterações"}
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="exit-button"
        >
          Cancelar
        </button>

      </form>
    </div>
  );
}

export default EditarImovel;
