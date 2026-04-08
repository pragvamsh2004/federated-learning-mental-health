import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";
import DassForm from "./pages/DassForm";
import ResultPage from "./pages/ResultPage";
import HistoryPage from "./pages/HistoryPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dassform" element={<DassForm />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  );
}

export default App;
