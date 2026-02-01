import { useNavigate } from "react-router-dom";
import "../styles/SelectionPage.css";

export default function SelectionPage() {
  const navigate = useNavigate();

  const handlePlaygroundClick = () => {
    navigate("/playground");
  };

  const handleFootballClick = () => {
    navigate("/football");
  };

  return (
    <div className="selection-page-container">
      <div className="selection-page-content">
        <h1 className="selection-title">Select Game Mode</h1>
        <div className="game-modes-grid">
          <div className="game-mode-pane" onClick={handlePlaygroundClick}>
            <div className="game-mode-content">
              <h2>Playground Mode</h2>
              <p>Explore and experiment freely</p>
            </div>
          </div>
          <div className="game-mode-pane" onClick={handleFootballClick}>
            <div className="game-mode-content">
              <h2>Football Mode</h2>
              <p>Play competitive football</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
