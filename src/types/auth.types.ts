// Questo file è come un "contratto" che definisce la forma esatta dei dati
// che ci aspettiamo di ricevere dal frontend per le operazioni di autenticazione.
// Centralizzare i tipi qui li rende riutilizzabili e mantiene il codice coerente.

// NON MI SERVONO GIA DEFINITA IN VALIDATION CON ZOD
// Definisce la struttura dell'oggetto `req.body` per la rotta di registrazione.
export interface RegisterBody {
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  age: number;
}

// NON MI SERVONO GIA DEFINITA IN VALIDATION CON ZOD
// Definisce la struttura dell'oggetto `req.body` per la rotta di login.
export interface LoginBody {
  emailorusername: string;
  password: string;
}


