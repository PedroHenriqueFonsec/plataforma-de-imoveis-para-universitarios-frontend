import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AlugueisEstudante() {
  const [alugueisPendentes, setAlugueisPendentes] = useState([]);
  const [alugueisAlugados, setAlugueisAlugados] = useState([]);
  const [alugueisPassados, setAlugueisPassados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const { usuario } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Meus Aluguéis";
    if (!usuario) {
      navigate("/login");
      return;
    }
    buscarAlugueis();
  }, [usuario, navigate]);

  const buscarAlugueis = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login");
        return;
      }
      if (usuario.tipo === "estudante") {
        const res = await api.get("/alugueis/estudante", {
          headers: { Authorization: `Bearer ${token}`, },
        });
        setAlugueisPendentes(res.data?.alugueisPendentes || []);
        setAlugueisAlugados(res.data?.alugueisAlugados || []);
        setAlugueisPassados(res.data?.alugueisPassados || []);
      }
      if (usuario.tipo === "proprietario") {
        const res = await api.get("/alugueis/proprietario", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlugueisPendentes(res.data?.alugueisPendentes || []);
        setAlugueisAlugados(res.data?.alugueisAlugados || []);
        setAlugueisPassados(res.data?.alugueisPassados || []);
      }
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao buscar aluguéis!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const confirmarAluguel = async (aluguelId) => {
    try {
      setCarregando(true);
      const token = localStorage.getItem("token");
      const res = await api.post("/alugueis/confirmar", {
        aluguelId: aluguelId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Aluguel confirmado com sucesso!");
      navigate("/meus-alugueis");
      setAlugueisPendentes((prevAlugueis) =>
        prevAlugueis.filter((aluguel) => aluguel._id !== aluguelId)
      );
      setAlugueisAlugados((prevAlugueis) => [...prevAlugueis, res.data.aluguel]);
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao confirmar aluguel!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const cancelarAluguel = async (aluguelId) => {
    try {
      setCarregando(true);
      const token = localStorage.getItem("token");
      await api.post(`/alugueis/cancelar/${aluguelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Aluguel cancelado com sucesso!");
      setAlugueisPendentes((prevAlugueis) =>
        prevAlugueis.filter((aluguel) => aluguel._id !== aluguelId)
      );
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao cancelar aluguel!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  const finalizarAluguel = async (aluguelId) => {
    try {
      setCarregando(true);
      const token = localStorage.getItem("token");
      await api.post(`/alugueis/finalizar/${aluguelId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Aluguel finalizado com sucesso!");
      setAlugueisAlugados((prevAlugueis) =>
        prevAlugueis.filter((aluguel) => aluguel._id !== aluguelId)
      );
    } catch (err) {
      const mensagem = err.response?.data?.mensagem || "Erro ao finalizar aluguel!";
      alert("Erro: " + mensagem);
    } finally {
      setCarregando(false);
    }
  };

  if (!usuario) {
    return <p>Carregando...</p>;
  }
  return (
    <div className="alugueis-estudante-container">
      <h2>Meus Aluguéis</h2>

      {alugueisPendentes.length > 0 && (
        <section className="aluguel-pendente">
          <h3>Aluguel Pendente</h3>
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Endereço</th>
                <th>Tipo</th>
                <th>Área</th>
                <th>Quartos</th>
                <th>Preço</th>
                {usuario.tipo === "proprietario" && <th>Locatário</th>}
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {alugueisPendentes.map((aluguel) => (
                <tr key={aluguel._id} onClick={() => navigate(`/imoveis/${aluguel.imovel._id}`)}>
                  <td>{aluguel.imovel.titulo}</td>
                  <td>{aluguel.imovel.endereco}</td>
                  <td style={{ textTransform: "capitalize" }}>{aluguel.imovel.tipo}</td>
                  <td>{aluguel.imovel.area} m²</td>
                  <td>{aluguel.imovel.quartos} quartos</td>
                  <td>R$ {aluguel.imovel.preco.toLocaleString("pt-BR")}</td>
                  {usuario.tipo === "proprietario" && <td>{aluguel.locatario ? aluguel.locatario.nome : "N/A"}</td>}
                  <td>
                    <div className="botoes-container">
                      {usuario.tipo === "estudante" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmarAluguel(aluguel._id);
                          }}
                          disabled={carregando}
                        >
                          {carregando ? "Confirmando..." : "Confirmar Aluguel"}
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelarAluguel(aluguel._id, e);
                        }}
                        disabled={carregando}
                      >
                        {carregando ? "Cancelando..." : "Cancelar Aluguel"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {alugueisAlugados.length > 0 && (
        <section className="aluguel-ativo">
          <h3>Aluguéis Ativos</h3>
          <table>
            <thead>
              <tr>
                <th>Título</th>
                <th>Endereço</th>
                <th>Início</th>
                {usuario.tipo === "proprietario" && <th>Locatário</th>}
                {usuario.tipo === "proprietario" && <th>Ação</th>}
              </tr>
            </thead>
            <tbody>
              {alugueisAlugados.map((aluguel) => (
                <tr key={aluguel._id} onClick={() => navigate(`/imoveis/${aluguel.imovel._id}`)}>
                  <td>{aluguel.imovel.titulo}</td>
                  <td>{aluguel.imovel.endereco}</td>
                  <td>{new Date(aluguel.dataInicio).toLocaleDateString("pt-BR")}</td>
                  {usuario.tipo === "proprietario" && <td>{aluguel.locatario ? aluguel.locatario.nome : "N/A"}</td>}
                  {usuario.tipo === "proprietario" && <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        finalizarAluguel(aluguel._id, e);
                      }}
                      disabled={carregando}
                    >
                      {carregando ? "Finalizando..." : "Finalizar"}
                    </button>
                  </td>}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      )}

      {alugueisPassados.length > 0 && (
        <section className="alugueis-passados">
          <h3>Histórico de Aluguéis</h3>
          {alugueisPassados.length === 0 ? (
            <p>Nenhum aluguel anterior.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Data Início</th>
                  <th>Status</th>
                  {usuario.tipo === "proprietario" && <th>Locatário</th>}
                  <th>Data Fim</th>
                </tr>
              </thead>
              <tbody>
                {alugueisPassados.map((aluguel) => (
                  <tr key={aluguel._id}
                    onClick={usuario.tipo === "proprietario" ? () => navigate(`/imoveis/${aluguel.imovel._id}`) : undefined}>
                    <td>{aluguel.imovel.titulo}</td>
                    <td>{new Date(aluguel.dataInicio).toLocaleDateString("pt-BR")}</td>
                    <td style={{ textTransform: "capitalize" }}>{aluguel.status}</td>
                    {usuario.tipo === "proprietario" && <td>{aluguel.locatario ? aluguel.locatario.nome : "N/A"}</td>}
                    <td>
                      {aluguel.dataFim ? new Date(aluguel.dataFim).toLocaleDateString("pt-BR") : "Ainda em andamento"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </div>
  );
}

export default AlugueisEstudante;
