// Il Controller agisce da intermediario (il "cameriere").
// Riceve la richiesta HTTP (req), la passa al service per l'elaborazione,
// e invia la risposta HTTP (res) al client.

import { Request, Response, NextFunction } from 'express'; // Importiamo i tipi base di Express.
import * as AuthService from '../services/auth.service'; // Importiamo tutte le funzioni dal nostro "chef".
//import { RegisterBody, LoginBody } from '../types/auth.types'; // Importiamo i tipi per il corpo della richiesta.
import { RegisterBody, LoginBody } from '../types/auth.validation';
/**
 * Gestisce la richiesta di registrazione.
 */
export const handleRegister = async (req: Request<{}, {}, RegisterBody>, res: Response, next: NextFunction) => {
  // Usiamo un blocco try...catch per gestire gli errori in modo pulito.
  try {
    // Passiamo il corpo della richiesta (req.body) al nostro service. Non facciamo logica qui.
    const user = await AuthService.registerUser(req.body);
    // Se il service ha successo, inviamo una risposta positiva (status 201 = Creato).
    res.status(201).json({ message: 'Utente registrato con successo!', userId: user.id });
  } catch (error) {
    // Se il service lancia un errore (es. utente già esistente), lo catturiamo qui.
    // `next(error)` passa l'errore al nostro gestore di errori globale definito in index.ts.
    next(error);
  }
};

/**
 * Gestisce la richiesta di login.
 */
export const handleLogin = async (req: Request<{}, {}, LoginBody>, res: Response, next: NextFunction) => {
  try {
    // Chiamiamo il service di login, passando il corpo della richiesta.
    const { token, user } = await AuthService.loginUser(req.body);
    // Se il service ha successo, inviamo una risposta con il token e i dati dell'utente.
    res.json({
      message: 'Login effettuato con successo!',
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (error) {
    // Se il service lancia un errore (es. credenziali errate), lo passiamo al gestore globale.
    next(error);
  }
};

