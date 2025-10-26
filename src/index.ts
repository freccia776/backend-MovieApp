// Questo è il punto di ingresso ("entry point") della nostra applicazione, il "manager del ristorante".
// Configura il server, imposta i middleware globali, collega le rotte e avvia l'ascolto delle richieste.

// Importiamo le librerie necessarie.
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors'; // Per permettere al frontend di comunicare con il backend.
import dotenv from 'dotenv'; // Per caricare le variabili d'ambiente dal file .env.

// Importiamo il nostro "menù" di rotte per l'autenticazione.
import authRoutes from './routes/auth.routes';
import wishlistRoutes from './routes/wishlist.routes';

// Carichiamo le variabili dal file .env (es. DATABASE_URL, JWT_SECRET).
dotenv.config();

// Creiamo l'applicazione Express.
const app = express();
// Definiamo la porta su cui il server ascolterà. La prende dal file .env o usa 3001 come default.
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARE GLOBALI ---
// I middleware sono funzioni che vengono eseguite per OGNI richiesta che arriva al server.

// `cors()`: Abilita il Cross-Origin Resource Sharing. Senza questo, il tuo frontend React Native
// riceverebbe un errore di sicurezza tentando di chiamare il backend.
app.use(cors());

// `express.json()`: Fa il "parsing" del corpo delle richieste in arrivo.
// Trasforma il testo JSON inviato dal frontend in un oggetto JavaScript utilizzabile in `req.body`.
app.use(express.json());

// --- ROTTE ---
// Definiamo gli endpoint della nostra API.

// Rotta di test ("health check") per verificare che il server sia online.
app.get('/api/health', (req, res) => {
  res.json({ status: 'Il server è attivo e funzionante! 🎉' });
});

// Colleghiamo il nostro "menù" di autenticazione.
// Tutte le rotte definite in `auth.routes.ts` saranno ora accessibili con il prefisso `/api/auth`.
// Esempio: la rotta `/register` diventerà `/api/auth/register`.
app.use('/api/auth', authRoutes);

// Colleghiamo il "menù" della wishlist dei film. 
// Tutte le rotte definite in `wishlist.routes.ts` saranno ora accessibili con il prefisso `/api/wishlist`.
// Esempio: la rotta `/addfilm` diventerà `/api/wishlist/addfilm`.
app.use('/api/wishlist', wishlistRoutes); 

// --- GESTORE DI ERRORI GLOBALE (Migliorato) ---
// Questo middleware speciale viene attivato solo quando si chiama `next(error)`.
// Deve essere l'ULTIMO `app.use()` per catturare gli errori da tutte le rotte.
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  // Logghiamo lo stack trace completo per un debug più facile.
  console.error("[ERRORE GLOBALE]:", err.stack || err.message);

  // Determiniamo uno status code appropriato.
  // Se l'errore ha uno status code (es. lanciato da una libreria), usiamolo. Altrimenti, default a 500.
  const statusCode = err.statusCode || err.status || 500;
  
  // Estraiamo il messaggio di errore.
  const message = err.message || 'Errore interno del server.';

  // Inviamo una risposta JSON standardizzata al client.
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
  });
});



// --- AVVIO DEL SERVER ---
// Mettiamo il server in ascolto sulla porta definita, in attesa di richieste.
app.listen(PORT, () => {
  console.log(`✅ Server backend avviato su http://localhost:${PORT}`);
});



/* STRUTTURA

/src
  ├── /controllers  (CAMERIERE)
  │   └── auth.controller.ts
  ├── /middlewares      (MIDDLEWARES)     
  │   └── isAuthenticated.ts
  ├── /routes     (MENÙ)
  │   └── auth.routes.ts
  ├── /services   (CHEF)
  │   └── auth.service.ts
  ├── /types    (INTERFACCIE E TIPI)
  │   └── auth.types.ts
  └── index.ts    (MANAGER DEL RISTORANTE)

  */