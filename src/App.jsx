import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Cadastro from "./pages/Cadastro.jsx";
import Home from "./pages/Home.jsx";
import DetalhesImovel from "./pages/DetalhesImovel.jsx";
import Favoritos from "./pages/Favoritos.jsx";
import Perfil from "./pages/Perfil.jsx";
import PainelImoveis from "./pages/PainelImoveis.jsx";
import CadastroImovel from "./pages/CadastroImovel.jsx";
import EditarImovel from "./pages/EditarImovel.jsx";
import MeusAlugueis from "./pages/MeusAlugueis.jsx";
import Navbar from "./components/Navbar.jsx";
import ContainerView from "./components/ContainerView.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <Navbar />
      <div style={{ flex: 1 }}>
        <ContainerView>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/home" element={<Home />} />
            <Route path="/imoveis/:id" element={<DetalhesImovel />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/painel-imoveis" element={<PainelImoveis />} />
            <Route path="/cadastro-imovel" element={<CadastroImovel />} />
            <Route path="/editar-imovel/:id" element={<EditarImovel />} />
            <Route path="/meus-alugueis" element={<MeusAlugueis />} />
            <Route path="*" element={<h2>Página não encontrada</h2>} />
          </Routes>
        </ContainerView>
      </div>
      <Footer />
    </div>
  );
}


export default App;
