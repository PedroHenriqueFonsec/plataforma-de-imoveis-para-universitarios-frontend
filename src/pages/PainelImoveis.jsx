import { useEffect, useState, useContext, useCallback, useMemo } from "react";
import { MdArrowUpward, MdArrowDownward } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { IMaskInput } from "react-imask";
import debounce from "lodash.debounce";
import { AuthContext } from "../contexts/AuthContext";
import api from "../services/api";

const parsePreco = (valor) => {
  return valor
    ? Number(valor.replace("R$ ", "").replace(/\./g, "").replace(",", "."))
    : undefined;
};

function PainelImoveis() {
  const [imoveis, setImoveis] = useState([]);
  const [tipo, setTipo] = useState("");
  const [status, setStatus] = useState("");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [quartos, setQuartos] = useState("");
  const [banheiros, setBanheiros] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState("createdAt");
  const [ordem, setOrdem] = useState("desc");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [estudantes, setEstudantes] = useState([]);
  const [estudanteSelecionado, setEstudanteSelecionado] = useState("");
  const [mostrarListaEstudante, setMostrarListaEstudante] = useState(false);
  const [imovelSelecionado, setImovelSelecionado] = useState(null);
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  const buscarImoveis = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Sessão expirada. Faça login novamente.");
      navigate("/login");
      return;
    }
    try {
      const res = await api.get("/imoveis", {
        params: {
          proprietario: "meus",
          tipo: tipo || undefined,
          status: status || undefined,
          precoMin: parsePreco(precoMin),
          precoMax: parsePreco(precoMax),
          busca: busca || undefined,
          quartos: quartos || undefined,
          banheiros: banheiros || undefined,
          areaMin: areaMin || undefined,
          areaMax: areaMax || undefined,
          ordenarPor,
          ordem,
          pagina,
          limite: 12,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setImoveis(res.data.imoveis || res.data);
      setTotalPaginas(res.data.totalPaginas);
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao carregar imóveis!";
      alert("Erro: " + mensagem);
    }
  }, [
    tipo,
    status,
    precoMin,
    precoMax,
    busca,
    quartos,
    banheiros,
    areaMin,
    areaMax,
    ordenarPor,
    ordem,
    pagina
  ]);

  const debouncedBuscar = useMemo(() => debounce(buscarImoveis, 500), [buscarImoveis]);

  useEffect(() => {
    setPagina(1);
  }, [
    tipo,
    status,
    precoMin,
    precoMax,
    busca,
    quartos,
    banheiros,
    areaMin,
    areaMax,
    ordenarPor,
    ordem,
  ]);

  useEffect(() => {
    document.title = "Meus Imóveis";
    if (!usuario || usuario.tipo !== "proprietario") {
      navigate("/login");
      return;
    }
    debouncedBuscar();
    return () => debouncedBuscar.cancel();
  }, [usuario, navigate, debouncedBuscar]);

  const limparFiltros = () => {
    setBusca("");
    setTipo("");
    setStatus("");
    setPrecoMin("");
    setPrecoMax("");
    setAreaMin("");
    setAreaMax("");
    setQuartos("");
    setBanheiros("");
    setOrdenarPor("createdAt");
    setOrdem("desc");
    setPagina(1);
  };

  const carregarEstudantes = async () => {
    try {
      const res = await api.get("/usuarios/estudantes", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      setEstudantes(res.data);
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao carregar estudantes!";
      alert("Erro: " + mensagem);
    }
  };

  const handleAlugar = async (idImovel) => {
    await carregarEstudantes();
    setImovelSelecionado(idImovel);
    setEstudanteSelecionado("");
    setMostrarListaEstudante(true);
  };

  const confirmarAluguel = async () => {
    if (!estudanteSelecionado) {
      alert("Selecione um estudante.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja iniciar o aluguel com este estudante?")) return;

    try {
      await api.post(`/alugueis/alugar/${imovelSelecionado}`, {
        estudanteId: estudanteSelecionado,
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        },
      });

      alert("Aluguel iniciado com sucesso! Aguardando a confirmação do estudante!");
      setMostrarListaEstudante(false);
      setImovelSelecionado(null);
      debouncedBuscar();
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao iniciar aluguel!";
      alert("Erro: " + mensagem);
    }
  };

  const handleVerDetalhes = (id) => {
    navigate(`/imoveis/${id}`);
  };

  const handleEditar = (id) => {
    navigate(`/editar-imovel/${id}`);
  };

  const handleDeletar = async (id) => {
    const imovel = imoveis.find((imovel) => imovel._id === id);

    if (!imovel) {
      alert("Imóvel não encontrado.");
      return;
    }

    if (imovel.status !== "disponivel" && imovel.status !== "indisponivel") {
      alert("O imóvel só pode ser deletado se o seu status estiver como disponível ou indisponível.");
      return;
    }

    if (!window.confirm("Tem certeza que deseja excluir este imóvel?")) return;

    try {
      await api.delete(`/imoveis/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      debouncedBuscar();
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao excluir o imóvel!";
      alert("Erro: " + mensagem);
    }
  };

  return (
    <div className="painel-container">
      <div className="painel-header">
        <h2>Meus Imóveis</h2>
        <button onClick={() => navigate("/cadastro-imovel")}>
          Cadastrar Novo Imóvel
        </button>
      </div>

      <form className="form-filtro" onSubmit={e => e.preventDefault()}>

        <div className="filtros-principais">
          <input
            type="text"
            name="busca"
            id="busca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Título/descrição/ender.."
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

          <select
            name="status"
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="disponivel">Disponível</option>
            <option value="pendente">Pendente</option>
            <option value="alugado">Alugado</option>
            <option value="indisponivel">Indisponível</option>
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
              type="number"
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
              type="number"
              value={banheiros}
              onAccept={(value, maskRef) => {
                setBanheiros(maskRef.unmaskedValue ? value : "");
              }}
              placeholder="Banheiros"
            />
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
          </select>

          <button
            type="button"
            className="botao-ordenar"
            onClick={() => setOrdem((prev) => (prev === "asc" ? "desc" : "asc"))}
          >
            {ordem === "asc" ? <MdArrowUpward size={24} /> : <MdArrowDownward size={24} />}
          </button>

        </div>
      </form>

      {imoveis.length === 0 ? (
        <p>Você ainda não cadastrou nenhum imóvel.</p>
      ) : (
        <>

          <div className="imoveis-grid">
            {imoveis.map((imovel) => (
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

                <div className="card-conteudo">
                  <div className="card-header">
                    <h3 className="card-titulo">{imovel.titulo}</h3>
                    <span className={`status-badge status-${imovel.status}`}>
                      {imovel.status.charAt(0).toUpperCase() + imovel.status.slice(1)}
                    </span>
                  </div>

                  <p className="card-endereco">{imovel.endereco}</p>

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
                    <span>{imovel.quartos} quarto{imovel.quartos > 1 ? "s" : ""}</span>
                    <span className="separator">|</span>
                    <span>{imovel.banheiros} banheiro{imovel.banheiros > 1 ? "s" : ""}</span>
                  </div>

                  <div className="card-data">
                    Criado em: {new Date(imovel.createdAt).toLocaleDateString("pt-BR")}
                  </div>

                  <div className="painel-botoes">
                    <button className="botao-editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditar(imovel._id);
                      }}
                      style={{
                        visibility: imovel.status === "disponivel" || imovel.status === "indisponivel" ? "visible" : "hidden"
                      }}
                    >
                      Editar
                    </button>
                    {imovel.status === "disponivel" && (
                      <button className="botao-aluga"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAlugar(imovel._id);
                        }}
                      >
                        Alugar
                      </button>
                    )}
                    {(imovel.status === "disponivel" || imovel.status === "indisponivel") && (
                      <button className="botao-deletar"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletar(imovel._id);
                        }}
                      >
                        Deletar
                      </button>
                    )}
                  </div>

                </div>
              </div>
            ))}

          </div>

          {mostrarListaEstudante && (
            <div className="modal-alugar">
              <div className="modal-conteudo">
                <h3>Alugar Imóvel</h3>

                {imovelSelecionado && (
                  <div className="detalhes-imovel-modal">
                    <p className="titulo">{imoveis.find(imovel => imovel._id === imovelSelecionado)?.titulo}</p>

                    <p className="preco">
                      {imoveis.find(imovel => imovel._id === imovelSelecionado)?.preco.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>

                    <p className="endereco">{imoveis.find(imovel => imovel._id === imovelSelecionado)?.endereco}</p>

                    <p className="tipo">
                      Tipo: {imoveis.find(imovel => imovel._id === imovelSelecionado)?.tipo.charAt(0).toUpperCase() + imoveis.find(imovel => imovel._id === imovelSelecionado)?.tipo.slice(1)}
                    </p>
                  </div>
                )}
                <label>Selecione um estudante:</label>
                <select
                  value={estudanteSelecionado}
                  onChange={(e) => setEstudanteSelecionado(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {estudantes.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.nome} ({e.email})
                    </option>
                  ))}
                </select>

                <div className="modal-botoes">
                  <button onClick={confirmarAluguel} disabled={!estudanteSelecionado}>
                    Confirmar
                  </button>
                  <button onClick={() => setMostrarListaEstudante(false)}>Cancelar</button>
                </div>
              </div>
            </div>
          )}

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
      )
      }
    </div >
  );
}

export default PainelImoveis;
