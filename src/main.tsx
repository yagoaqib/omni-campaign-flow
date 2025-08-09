import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { OpsTabsProvider } from "@/context/OpsTabsContext";

createRoot(document.getElementById("root")!).render(
  <OpsTabsProvider>
    <App />
  </OpsTabsProvider>
);
