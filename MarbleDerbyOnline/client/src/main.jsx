import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import LoginPage from "./routes/LoginPage";
import MarbleFootBall from "./games/MarbleFootBall";
import MarbleDropMaze from "./games/MarbleDropMaze";
import SelectionPage from "./routes/SelectionPage";
import { SocketProvider } from "./providers/SocketProvider";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/football" element={<MarbleFootBall />} />
          <Route path="/playground" element={<MarbleDropMaze />} />
          <Route
            path="/*"
            element={<SelectionPage />}
          />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  </StrictMode>
);
