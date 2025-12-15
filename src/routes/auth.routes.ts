// Il file delle rotte è come il "menù" del nostro ristorante.
// Il suo unico scopo è associare un percorso URL (es. /register) e un metodo HTTP (es. POST)
// a una specifica funzione del controller (il "cameriere" che gestirà l'ordine).

import { Router } from 'express'; // Importiamo il Router di Express per creare un gruppo di rotte.
import * as AuthController from '../controllers/auth.controllers'; // Importiamo tutte le funzioni dal nostro "cameriere".

// Creiamo una nuova istanza del Router.
const router = Router();

// Definiamo la rotta per la registrazione:
// Quando arriva una richiesta POST all'URL /register, Express chiamerà la funzione `handleRegister` dal nostro controller.
router.post('/register', AuthController.handleRegister);

// Definiamo la rotta per il login:
// Quando arriva una richiesta POST all'URL /login, Express chiamerà la funzione `handleLogin` dal nostro controller.
router.post('/login', AuthController.handleLogin);

router.post('/refresh', AuthController.handleRefreshToken);

// Esportiamo il router per poterlo usare nel nostro file principale (index.ts).
export default router;

