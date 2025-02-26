import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { BrowserRouter, Route, Routes } from 'react-router';

import Host from './Host';
import App from './App';
import PlayerGame from './PlayerGame';
import PlayerLobby from './PlayerLobby';

createRoot(document.getElementById('root')!).render(
  <div className="bg-slate-700 w-full h-screen text-yellow-50">
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/host" element={<Host />} />
        <Route path="/lobby" element={<PlayerLobby />} />
        <Route path="/player/:roomId" element={<PlayerGame />} />
      </Routes>
    </BrowserRouter>
  </div>
);
