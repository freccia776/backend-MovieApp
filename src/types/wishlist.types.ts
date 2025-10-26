// Questo file definisce i "contratti" per i dati che il frontend invia.
// Nota: l'ID dell'utente non viene mai richiesto, perché lo otteniamo in modo sicuro dal token JWT.

/**
 * Definisce il corpo della richiesta per aggiungere un film ai preferiti.
 * Ci aspettiamo solo l'ID del film.
 */
export interface AddMoviePayload {
  movieId: number;
}

/**
 * Definisce il corpo della richiesta per aggiungere una serie TV ai preferiti.
 */
export interface AddTvShowPayload {
  tvShowId: number;
}

