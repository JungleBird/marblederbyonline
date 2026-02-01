// Create a loading component
export function LoadingScreen() {
  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#111",
      color: "#fff",
      fontSize: "24px",
    }}>
      <div>
        <div>Loading Game...</div>
        <div style={{ marginTop: "20px", fontSize: "16px" }}>Rendering canvas scene...</div>
      </div>
    </div>
  );
}