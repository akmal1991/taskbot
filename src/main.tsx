import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initializeTelegram } from './utils/telegramSdk';

void initializeTelegram().then(() => createRoot(document.getElementById('root')!).render(<App />));
