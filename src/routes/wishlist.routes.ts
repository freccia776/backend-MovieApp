import { Router } from 'express';
import * as WishlistController from '../controllers/wishlist.controllers';
import { isAuthenticated } from '../middlewares/isAuthenticated'; // Il nostro "buttafuori" per la sicurezza

const router = Router();

// --- ROTTE PROTETTE ---
// Il middleware `isAuthenticated` viene eseguito su tutte queste rotte prima del controller,
// garantendo che solo gli utenti loggati possano usarle.

// Ottiene tutti gli ID dei film e delle serie preferite dell'utente.
// GET /api/wishlist/ids
router.get('/ids', isAuthenticated, WishlistController.handleGetUserFavoriteIds);

// --- GESTIONE FILM ---
// Aggiunge un film alla wishlist.
// POST /api/wishlist/movies
router.post('/movies', isAuthenticated, WishlistController.handleAddMovie);

// Rimuove un film dalla wishlist.
// DELETE /api/wishlist/movies/123 (l'ID del film è nell'URL)
router.delete('/movies/:movieId', isAuthenticated, WishlistController.handleRemoveMovie);

// --- GESTIONE SERIE TV ---
// Aggiunge una serie TV alla wishlist.
// POST /api/wishlist/tvshows
router.post('/tvshows', isAuthenticated, WishlistController.handleAddTvShow);

// Rimuove una serie TV dalla wishlist.
// DELETE /api/wishlist/tvshows/456
router.delete('/tvshows/:tvShowId', isAuthenticated, WishlistController.handleRemoveTvShow);

export default router;

