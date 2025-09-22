import { useEffect, useState, useContext, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { MdFavorite, MdFavoriteBorder, MdArrowBack, MdEditSquare, MdDelete } from "react-icons/md";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function DetalhesImovel() {
  const [imovel, setImovel] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [imagemAtual, setImagemAtual] = useState(0);
  const [coordenadas, setCoordenadas] = useState(null);
  const [locatario, setLocatario] = useState(null);
  const [acesso, setAcesso] = useState(false);
  const { id } = useParams();
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Detalhes do Imóvel";
    if (!usuario) {
      navigate("/login");
      return;
    }
    buscarImovel();
    buscarLocatario();
  }, [id, usuario, navigate]);

  const buscarImovel = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }

      const res = await api.get(`/imoveis/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const imovelData = res.data;
      if (imovelData.status !== "disponivel" && (usuario._id !== imovelData.proprietario?._id && usuario.tipo !== "estudante")
      ) {
        alert("Você não tem acesso a este imóvel.");
        navigate("/");
        return;
      }

      setAcesso(true);
      setImovel(imovelData);

      const geoRes = await api.get(`/geocode`, {
        params: { endereco: imovelData.endereco }
      });

      if (geoRes.data) {
        const { lat, lon } = geoRes.data;
        setCoordenadas({ lat: parseFloat(lat), lon: parseFloat(lon) });
      }
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao carregar o imóvel.";
      alert("Erro: " + mensagem);
      navigate("/");
    } finally {
      setCarregando(false);
    }
  }, [id, usuario, navigate]);

  const buscarLocatario = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/alugueis/imovel/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.locatario) {
        setLocatario(res.data.locatario);
      }
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error("Erro ao buscar locatário:", err);
      }
    }
  }, [id]);

  const favoritar = async () => {
    try {
      const token = localStorage.getItem("token");
      await api.post(`/usuarios/favoritos/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setImovel((prev) => ({
        ...prev,
        favoritado: !prev.favoritado,
      }));
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao favoritar!";
      alert("Erro: " + mensagem);
    }
  };

  const proximaImagem = () => {
    setImagemAtual((prev) => (prev + 1) % imovel.imagens.length);
  };

  const imagemAnterior = () => {
    setImagemAtual((prev) => (prev - 1 + imovel.imagens.length) % imovel.imagens.length);
  };

  const handleEditar = () => {
    navigate(`/editar-imovel/${id}`);
  };

  const handleDeletar = async () => {
    if (imovel.status !== "disponivel" && imovel.status !== "indisponivel") {
      alert("O imóvel só pode ser deletado se o seu status estiver como disponível ou indisponível.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir este imóvel?")) return;
    try {
      const token = localStorage.getItem("token");
      await api.delete(`/imoveis/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Imóvel deletado com sucesso!");
      navigate("/painel-imoveis");
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao excluir o imóvel!";
      alert("Erro: " + mensagem);
    }
  };

  const handleContato = (numero, nomeContato, mensagemExtra = "") => {
    if (!numero) return;
    let numeros = numero.replace(/\D/g, "");
    if (!numeros.startsWith("55")) numeros = "55" + numeros;
    const mensagem = encodeURIComponent(`Olá ${nomeContato}, ${mensagemExtra}`);
    const url = `https://wa.me/${numeros}?text=${mensagem}`;
    window.open(url, "_blank");
  };

  if (carregando) return <p>Carregando detalhes...</p>;

  if (!imovel) return <p>Imóvel não encontrado.</p>;

  if (!acesso) { return null; }

  return (
    <div className="detalhes-container">
      <div className="detalhes-header">

        <button onClick={() => navigate(-1)} className="voltar-btn" disabled={carregando}>
          <MdArrowBack size={24} style={{ marginRight: "8px" }} />
          Voltar
        </button>
        <h2>{imovel.titulo}</h2>

        {usuario?.tipo === "estudante" && (
          <button onClick={favoritar} className="favoritar-btn" disabled={carregando}>
            {imovel.favoritado ? <MdFavorite size={24} color="#f50057" /> : <MdFavoriteBorder size={24} />}
            {imovel.favoritado ? "Remover dos favoritos" : "Favoritar"}
          </button>
        )}
      </div>

      {imovel.imagens?.length > 0 && (
        <div className="galeria">
          <img
            src={imovel.imagens[imagemAtual]}
            alt={`Imagem ${imagemAtual + 1}`}
            className="imagem"
          />
          {imovel.imagens.length > 1 && (
            <div className="galeria-controles">
              <button onClick={imagemAnterior} disabled={carregando}>◀</button>
              <span>{imagemAtual + 1} / {imovel.imagens.length}</span>
              <button onClick={proximaImagem} disabled={carregando}>▶</button>
            </div>
          )}
        </div>
      )}

      <div className="detalhes-info">
        <p><strong>Descrição:</strong> {imovel.descricao || "Sem descrição."}</p>
        <p style={{ textTransform: "capitalize" }}><strong>Status:</strong> {imovel.status}</p>
        {locatario ? (
          <p><strong>Locatário:</strong> {locatario.nome} ({locatario.email} | {locatario.telefone})</p>
        ) : (
          <p><strong>Locatário:</strong> Sem locatário</p>
        )}
        <p style={{ textTransform: "capitalize" }}><strong>Tipo:</strong> {imovel.tipo}</p>
        <p><strong>Endereço:</strong> {imovel.endereco}</p>
        <p><strong>Aluguel:</strong> {imovel.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
        <p><strong>Área:</strong> {imovel.area} m²</p>
        <p><strong>Quartos:</strong> {imovel.quartos}</p>
        <p><strong>Banheiros:</strong> {imovel.banheiros}</p>
        <p><strong>Garagem:</strong> {imovel.garagem ? "Sim" : "Não"}</p>
        <p><strong>Mobiliado:</strong> {imovel.mobiliado ? "Sim" : "Não"}</p>
        <p><strong>Permite Pet:</strong> {imovel.permitidoPet ? "Sim" : "Não"}</p>
        <p><strong>Distância até o Campus Unifeso - Sede:</strong> {imovel.proximidadeUnifesoSede} km</p>
        <p><strong>Distância até o Campus Unifeso - Quinta:</strong> {imovel.proximidadeUnifesoQuinta} km</p>
        <p><strong>Proprietário:</strong> {imovel.proprietario?.nome} ({imovel.proprietario?.email})</p>
        <p><strong>Telefone:</strong> {imovel.proprietario?.telefone}</p>
        <p><strong>Criado em:</strong> {new Date(imovel.createdAt).toLocaleDateString("pt-BR")}</p>

        {usuario?.tipo === "estudante" && (
          <button
            type="button"
            onClick={() =>
              handleContato(
                imovel.proprietario.telefone,
                imovel.proprietario.nome,
                `estou interessado no imóvel ${imovel.titulo}`)
            }
          >
            Falar com o proprietário via WhatsApp
          </button>
        )}

        {usuario?.tipo === "proprietario" && usuario._id === imovel.proprietario?._id && locatario && (
          <button
            type="button"
            onClick={() =>
              handleContato(
                locatario.telefone,
                locatario.nome,
                `sobre o imóvel ${imovel.titulo}`
              )
            }
          >
            Falar com o locatário via WhatsApp
          </button>
        )}

        {usuario?.tipo === "proprietario" && usuario._id === imovel.proprietario?._id && (
          <div className="botoes-proprietarios">
            <button onClick={handleEditar} disabled={carregando}>
              <MdEditSquare style={{ fontSize: 24 }} />
              Editar Imóvel
            </button>
            {(imovel.status === "disponivel" || imovel.status === "indisponivel") && (
              <button onClick={handleDeletar} className="delete-button" disabled={carregando}>
                <MdDelete style={{ fontSize: 24 }} />
                Deletar Imóvel
              </button>
            )}
          </div>
        )}

      </div>

      {coordenadas && (
        <div className="mapa">
          <h3>Localização no Mapa:</h3>
          <MapContainer
            center={[coordenadas.lat, coordenadas.lon]}
            zoom={16}
            scrollWheelZoom={false}
            style={{ height: "300px", width: "100%", marginTop: "1rem", borderRadius: "8px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[coordenadas.lat, coordenadas.lon]}>
              <Popup>{imovel.titulo}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}
    </div>
  );
}

export default DetalhesImovel;
