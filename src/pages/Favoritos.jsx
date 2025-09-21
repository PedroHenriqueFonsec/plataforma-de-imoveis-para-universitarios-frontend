import { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MdFavoriteBorder, MdArrowUpward, MdArrowDownward } from "react-icons/md";
import { IMaskInput } from "react-imask";
import debounce from "lodash.debounce";
import api from "../services/api";
import { AuthContext } from "../contexts/AuthContext";

const parsePreco = (valor) => {
  return valor
    ? Number(valor.replace("R$ ", "").replace(/\./g, "").replace(",", "."))
    : undefined;
};

function Favoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [tipo, setTipo] = useState("");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [quartos, setQuartos] = useState("");
  const [banheiros, setBanheiros] = useState("");
  const [mobiliado, setMobiliado] = useState("");
  const [permitidoPet, setPermitidoPet] = useState("");
  const [garagem, setGaragem] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState("createdAt");
  const [ordem, setOrdem] = useState("desc");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  const buscarFavoritos = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      navigate("/login");
      return;
    }
    try {
      if (precoMin && precoMax && parsePreco(precoMin) > parsePreco(precoMax)) {
        alert("O aluguel mínimo não pode ser maior que o máximo.");
        return;
      }

      if (areaMin && areaMax && Number(areaMin) > Number(areaMax)) {
        alert("A área mínima não pode ser maior que a máxima.");
        return;
      }

      const res = await api.get("/usuarios/favoritos", {
        params: {
          status: "disponivel",
          tipo: tipo || undefined,
          precoMin: parsePreco(precoMin),
          precoMax: parsePreco(precoMax),
          busca: busca || undefined,
          quartos: quartos || undefined,
          banheiros: banheiros || undefined,
          mobiliado: mobiliado || undefined,
          permitidoPet: permitidoPet || undefined,
          garagem: garagem || undefined,
          areaMin: areaMin || undefined,
          areaMax: areaMax || undefined,
          ordenarPor,
          ordem,
          pagina,
          limite: 12,
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavoritos(res.data.imoveis);
      setTotalPaginas(res.data.totalPaginas);
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao buscar favoritos!";
      alert("Erro: " + mensagem);
    }
  }, [
    tipo,
    precoMin,
    precoMax,
    busca,
    quartos,
    banheiros,
    mobiliado,
    permitidoPet,
    garagem,
    areaMin,
    areaMax,
    ordenarPor,
    ordem,
    pagina,
  ]);

  const debouncedFavoritar = useMemo(() => debounce(buscarFavoritos, 500), [buscarFavoritos]);

  useEffect(() => {
    setPagina(1);
  }, [
    tipo,
    precoMin,
    precoMax,
    busca,
    quartos,
    banheiros,
    mobiliado,
    permitidoPet,
    garagem,
    areaMin,
    areaMax,
    ordenarPor,
    ordem,
  ]);

  useEffect(() => {
    document.title = "Meus Favoritos";
    if (!usuario || usuario.tipo !== "estudante") {
      navigate("/login");
      return;
    }
    debouncedFavoritar();
    return () => debouncedFavoritar.cancel();
  }, [usuario, navigate, debouncedFavoritar]);

  const handleVerDetalhes = (id) => {
    navigate(`/imoveis/${id}`);
  };

  const favoritarImovel = async (id) => {
    try {
      await api.post(`/usuarios/favoritos/${id}`);
      setFavoritos((prev) =>
        prev.filter((imovel) => imovel._id !== id)
      );
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao favoritar imóvel!";
      alert("Erro: " + mensagem);
    }
  };

  const limparFiltros = () => {
    setTipo("");
    setPrecoMin("");
    setPrecoMax("");
    setQuartos("");
    setBanheiros("");
    setMobiliado("");
    setPermitidoPet("");
    setGaragem("");
    setAreaMin("");
    setAreaMax("");
    setBusca("");
    setOrdenarPor("createdAt");
    setPagina(1);
  };

  return (
    <div className="home-container">
      <h2>Imóveis Favoritos</h2>
      <form className="form-filtro" onSubmit={(e) => { e.preventDefault(); buscarFavoritos(); }}>

        <div className="filtros-principais">
          <input
            type="text"
            name="busca"
            id="busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Título/descrição/endereço"
          />

          <select
            name="tipo"
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="">Todos os Tipos</option>
            <option value="casa">Casa</option>
            <option value="apartamento">Apartamento</option>
            <option value="kitnet">Kitnet</option>
          </select>

          <IMaskInput
            mask="R$ num"
            blocks={{
              num: {
                mask: Number,
                min: 0,
                thousandsSeparator: ".",
                radix: ",",
                scale: 2,
                signed: false,
                normalizeZeros: true,
                padFractionalZeros: false,
              },
            }}
            name="precoMin"
            id="precoMin"
            value={precoMin}
            onAccept={(value, maskRef) => {
              setPrecoMin(maskRef.unmaskedValue ? value : "");
            }}
            placeholder="R$ Aluguel mínimo"
          />

          <IMaskInput
            mask="R$ num"
            blocks={{
              num: {
                mask: Number,
                min: 0,
                thousandsSeparator: ".",
                radix: ",",
                scale: 2,
                signed: false,
                normalizeZeros: true,
                padFractionalZeros: false,
              },
            }}
            name="precoMax"
            id="precoMax"
            value={precoMax}
            onAccept={(value, maskRef) => {
              setPrecoMax(maskRef.unmaskedValue ? value : "");
            }}
            placeholder="R$ Aluguel máximo"
          />
        </div>

        <div className="mais-filtros-toggle">
          <button type="button" className="mais-filtros-button" onClick={() => setMostrarFiltros(!mostrarFiltros)}>
            {mostrarFiltros ? "Esconder filtros" : "Mostrar mais filtros"}
          </button>
        </div>

        {mostrarFiltros && (
          <div className="mais-filtros">
            <IMaskInput
              mask="num m²"
              blocks={{
                num: {
                  min: 1,
                  mask: Number,
                  thousandsSeparator: ".",
                },
              }}
              name="areaMin"
              id="areaMin"
              value={areaMin}
              onAccept={(value, maskRef) => {
                setAreaMin(maskRef.unmaskedValue ? value : "");
              }}
              placeholder="Área mínima (m²)"
            />

            <IMaskInput
              mask="num m²"
              blocks={{
                num: {
                  min: 1,
                  mask: Number,
                  thousandsSeparator: ".",
                },
              }}
              name="areaMax"
              id="areaMax"
              value={areaMax}
              onAccept={(value, maskRef) => {
                setAreaMax(maskRef.unmaskedValue ? value : "");
              }}
              placeholder="Área máxima (m²)"
            />

            <IMaskInput
              mask="num"
              blocks={{
                num: {
                  mask: Number,
                  min: 1,
                },
              }}
              name="quartos"
              id="quartos"
              value={quartos}
              onAccept={(value, maskRef) => {
                setQuartos(maskRef.unmaskedValue ? value : "");
              }}
              placeholder="Quartos"
            />

            <IMaskInput
              mask="num"
              blocks={{
                num: {
                  mask: Number,
                  min: 1,
                },
              }}
              name="banheiros"
              id="banheiros"
              value={banheiros}
              onAccept={(value, maskRef) => {
                setBanheiros(maskRef.unmaskedValue ? value : "");
              }}
              placeholder="Banheiros"
            />

            <select
              name="mobiliado"
              id="mobiliado"
              value={mobiliado}
              onChange={(e) => setMobiliado(e.target.value)}
            >
              <option value="">Mobiliado ?</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>

            <select
              name="permitidoPet"
              id="permitidoPet"
              value={permitidoPet}
              onChange={(e) => setPermitidoPet(e.target.value)}
            >
              <option value="">Permite Pet ?</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>

            <select
              name="garagem"
              id="garagem"
              value={garagem}
              onChange={(e) => setGaragem(e.target.value)}
            >
              <option value="">Garagem ?</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>

          </div>
        )}

        <div className="ordenacao-container">

          <button
            type="button"
            className="botao-limpar-filtros"
            onClick={limparFiltros}
          >
            Limpar filtros
          </button>

          <label htmlFor="ordenarPor">Ordenar por: </label>
          <select id="ordenarPor" value={ordenarPor} onChange={(e) => setOrdenarPor(e.target.value)}>
            <option value="createdAt">Mais recentes</option>
            <option value="preco">Aluguel</option>
            <option value="area">Área</option>
            <option value="quartos">Quartos</option>
            <option value="banheiros">Banheiros</option>
            <option value="proximidadeUnifesoSede">Distância da Sede</option>
            <option value="proximidadeUnifesoQuinta">Distância da Quinta</option>
          </select>

          <button
            type="button"
            className="botao-ordenar"
            onClick={() => setOrdem((prev) => (prev === "asc" ? "desc" : "asc"))}
          >
            {ordem === "asc" ? <MdArrowUpward size={24} /> : <MdArrowDownward size={24} />}
          </button>

        </div>

      </form >
      {favoritos.length === 0 ? (
        <p>Você ainda não favoritou nenhum imóvel ou não há imóveis com os filtros aplicados.</p>
      ) : (
        <>
          <div className="imoveis-grid">
            {favoritos.map((imovel) => (
              <div
                className="card-imovel"
                key={imovel._id}
                tabIndex={0}
                onClick={() => handleVerDetalhes(imovel._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleVerDetalhes(imovel._id);
                }}
              >
                {imovel.imagens?.length > 0 && (
                  <img
                    src={imovel.imagens[0]}
                    alt="Imagem do imóvel"
                    className="card-imagem"
                  />
                )}

                <div
                  className="favorito-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    favoritarImovel(imovel._id);
                  }}
                >
                  <MdFavoriteBorder
                    size={24}
                    color="#f50057"
                  />
                </div>

                <div className="card-conteudo">
                  <div className="card-header">
                    <h3 className="card-titulo">{imovel.titulo}</h3>
                  </div>

                  <div className="card-proximidade">
                    <p>{imovel.endereco}</p>
                    <p>({imovel.proximidadeUnifesoSede} km da sede,{" "} {imovel.proximidadeUnifesoQuinta} km da quinta)</p>
                  </div>

                  <div className="card-preco">
                    {imovel.preco.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </div>

                  <div className="card-detalhes">
                    <span style={{ textTransform: "capitalize" }}>{imovel.tipo}</span>
                    <span className="separator">|</span>
                    <span>{imovel.area} m²</span>
                    <span className="separator">|</span>
                    <span>
                      {imovel.quartos} quarto{imovel.quartos > 1 ? "s" : ""}
                    </span>
                    <span className="separator">|</span>
                    <span>
                      {imovel.banheiros} banheiro{imovel.banheiros > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPaginas > 1 && (
            <div className="paginacao">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina((p) => p - 1)}
              >
                Anterior
              </button>
              <span>Página {pagina} de {totalPaginas}</span>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div >
  );

}

export default Favoritos;