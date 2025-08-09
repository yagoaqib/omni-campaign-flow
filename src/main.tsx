import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { OpsTabsProvider } from "@/context/OpsTabsContext";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <OpsTabsProvider>
      <App />
    </OpsTabsProvider>
  </BrowserRouter>
);
