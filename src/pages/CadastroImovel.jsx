import { useContext, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

function CadastroImovel() {
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
  });
  const [carregando, setCarregando] = useState(false);
  const [imagens, setImagens] = useState({});
  const inputRefs = useRef([]);
  const { usuario } = useContext(AuthContext);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!usuario || usuario.tipo !== "proprietario") {
      navigate("/login");
      return;
    }

    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      navigate("/login");
      return;
    }

    document.title = "Cadastro de Imóvel";
  }, [usuario, navigate, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImagemChange = (slotIndex, event) => {
    const file = event.target.files?.[0];
    const formatosPermitidos = ["image/jpeg", "image/png", "image/jpg"];

    if (file) {
      if (!formatosPermitidos.includes(file.type)) {
        alert("Erro: Formato de imagem não suportado. Use JPEG, PNG ou JPG.");
        event.target.value = null;
        return;
      }
      setImagens((prev) => ({ ...prev, [slotIndex]: file }));
    }
  };

  const buscarEndereco = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "Plataforma-Imoveis/1.0" } }
      );
      const data = await res.json();
      if (data?.display_name) {
        setForm((prev) => ({ ...prev, endereco: data.display_name, }));
      }
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao buscar o endereço no mapa!";
      alert("Erro: " + mensagem);
    }
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCarregando(true);

    if (form.titulo.trim().length < 1) {
      alert("O título deve ter pelo menos 1 caractere.");
      setCarregando(false);
      return;
    }

    if (!form.latitude || !form.longitude || isNaN(form.latitude) || isNaN(form.longitude)) {
      alert("Selecione uma localização no mapa.");
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

    if (Object.keys(imagens).length === 0) {
      alert("Selecione pelo menos uma imagem.");
      setCarregando(false);
      return;
    }

    if (Object.keys(imagens).length > 8) {
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
      formData.append("latitude", form.latitude);
      formData.append("longitude", form.longitude);
      formData.append("endereco", form.endereco.trim());
      formData.append("quartos", Number(form.quartos));
      formData.append("banheiros", Number(form.banheiros));
      formData.append("area", Number(form.area));
      formData.append("mobiliado", form.mobiliado);
      formData.append("permitidoPet", form.permitidoPet);
      formData.append("garagem", form.garagem);
      Object.entries(imagens).forEach(([slot, file]) => {
        formData.append("imagens", file);
        formData.append("slots", slot);
      });

      await api.post("/imoveis", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Imóvel cadastrado com sucesso!");
      navigate("/painel-imoveis");
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao cadastrar imóvel!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="cadastro-container">
      <h2>Cadastrar Novo Imóvel</h2>
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
            disabled={carregando}
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
            disabled={carregando}
          />
        </div>

        <div className="form-group">
          <label>Selecione a localização no mapa:</label>
          <MapContainer
            center={[-22.4338, -42.9791]}
            zoom={15}
            style={{ height: "300px", width: "100%" }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapaClickHandler />
            {form.latitude && form.longitude && <Marker position={[form.latitude, form.longitude]} />}
          </MapContainer>

          {form.latitude && form.longitude && (
            <p>Coordenadas: {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}</p>
          )}
          {form.endereco && (
            <p><strong>Endereço:</strong> {form.endereco}</p>
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
            disabled={carregando}
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
            disabled={carregando}
          >
            <option value="apartamento">Apartamento</option>
            <option value="casa">Casa</option>
            <option value="kitnet">Kitnet</option>
          </select>
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
            disabled={carregando}
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
            disabled={carregando}
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
            disabled={carregando}
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
              disabled={carregando}
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
              disabled={carregando}
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
              disabled={carregando}
            />
            Possui garagem
          </label>
        </div>

        <div className="form-group">
          <label>Imagens do imóvel</label>
          <div className="preview-new-imagens">
            {[...Array(8)].map((_, idx) => {
              const imagemAtual = imagens[idx];
              return (
                <div key={idx} className="imagem-wrapper">
                  {imagemAtual ? (
                    <img
                      className="imagem-atual"
                      src={URL.createObjectURL(imagemAtual)}
                      alt={`Imagem ${idx + 1}`}
                      onClick={() => inputRefs.current[idx]?.click()}
                    />
                  ) : (
                    <button
                      className="botao-adicionar-imagem"
                      type="button"
                      onClick={() => inputRefs.current[idx]?.click()}
                      disabled={carregando}
                      style={{
                        width: "200px",
                        height: "200px",
                        border: "2px dashed gray",
                        borderRadius: "8px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      + Adicionar Imagem
                    </button>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/jpg"
                    style={{ display: "none" }}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    onChange={(e) => handleImagemChange(idx, e)}
                    disabled={carregando}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <button type="submit" disabled={carregando}>
          {carregando ? "Cadastrando..." : "Cadastrar"}
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
};

export default CadastroImovel;
