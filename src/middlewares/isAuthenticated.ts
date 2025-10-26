// Questo è un middleware, una funzione che si mette "in mezzo" tra la richiesta del client e il controller.
// Il suo scopo è proteggere le rotte, assicurandosi che solo gli utenti autenticati possano accedervi.

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Recuperiamo la chiave segreta per verificare il token.
const JWT_SECRET = process.env.JWT_SECRET || 'DEFAULT_SECRET_CAMBIAMI_SUBITO';

// Questa è una "magia" di TypeScript per estendere il tipo `Request` di Express.
// Stiamo dicendo a TypeScript che, dopo questo middleware, l'oggetto `req`
// potrebbe avere una proprietà `user` che conterrà i dati dal nostro token.
declare global {
  namespace Express {
    interface Request {
      user?: { userId: number; username: string };
    }
  }
}

/**
 * Middleware per verificare l'autenticazione tramite token JWT.
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  // 1. Controlla se l'header "Authorization" esiste.
  // Il token viene solitamente inviato come: "Bearer eyJhbGciOiJIUzI1NiIsIn..."
  const authHeader = req.headers.authorization;

  // Se l'header non c'è o non inizia con "Bearer ", blocca la richiesta.
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accesso negato. Token non fornito o malformato.' });
  }

  // 2. Estrae il token vero e proprio dalla stringa "Bearer ...".
  const token = authHeader.split(' ')[1];

  try {
    // 3. Verifica il token.
    // `jwt.verify` controlla se il token è valido (non è stato manomesso) e se non è scaduto.
    // Se la verifica fallisce, lancia un errore che viene catturato dal blocco catch.
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; username: string };

    // 4. Se il token è valido, aggiungiamo il suo contenuto (il payload) all'oggetto `req`.
    // In questo modo, il controller che verrà eseguito dopo questo middleware
    // saprà chi è l'utente che ha fatto la richiesta.
    req.user = payload;

    // 5. Chiama `next()` per passare il controllo al prossimo middleware o alla funzione del controller.
    next();
  } catch (error) {
    // Se `jwt.verify` fallisce, significa che il token non è valido o è scaduto.
    return res.status(401).json({ error: 'Token non valido o scaduto.' });
  }
};

/*
```

---
### Come lo Userai in Futuro

Immagina di creare le rotte per le recensioni dei film (`reviews.routes.ts`). Alcune rotte dovranno essere protette.

Ecco come useresti il middleware `isAuthenticated`:

```typescript
// Esempio di un futuro file 'reviews.routes.ts'

import { Router } from 'express';
import * as ReviewController from '../controllers/review.controller';
import { isAuthenticated } from '../middlewares/isAuthenticated'; // <-- IMPORTI IL TUO MIDDLEWARE

const router = Router();

// Per creare una nuova recensione, l'utente DEVE essere loggato.
// Quindi, mettiamo il middleware `isAuthenticated` PRIMA della funzione del controller.
router.post('/', isAuthenticated, ReviewController.createReview);

// Per vedere tutte le recensioni di un film, non serve essere loggati.
// Quindi, NON mettiamo il middleware.
router.get('/movie/:movieId', ReviewController.getReviewsForMovie);

export default router;

*/