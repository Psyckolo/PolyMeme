import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress MetaMask authorization errors from error overlay
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('has not been authorized yet')) {
    // MetaMask authorization error - ignore for error overlay
    event.preventDefault();
    console.log('MetaMask authorization pending (this is normal on first connection)');
  }
});

createRoot(document.getElementById("root")!).render(<App />);
