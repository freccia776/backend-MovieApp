import { Request, Response, NextFunction } from 'express';
import * as WishlistService from '../services/wishlist.service';
import { AddMoviePayload, AddTvShowPayload } from '../types/wishlist.types';

// --- CONTROLLER PER I FILM ---

export const handleAddMovie = async (req: Request<{}, {}, AddMoviePayload>, res: Response, next: NextFunction) => {
  try {
    // Il punto esclamativo ! è il non-null assertion operator di TypeScript. FIDATI CHE req.user NON SARÀ MAI undefined QUI.
    // L'ID dell'utente viene preso dal token JWT (grazie al middleware isAuthenticated), non dal body!
    const userId = req.user!.userId; //prendo userid da req.user settato da isAuthenticated
    const { movieId } = req.body;

    const newFavorite = await WishlistService.addMovieToWishlist(userId, movieId);
    res.status(201).json(newFavorite);
  } catch (error) {
    next(error);
  }
};

export const handleRemoveMovie = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId; 
    // L'ID del film viene preso dai parametri dell'URL (es. /movies/123)
    const movieId = parseInt(req.params.movieId, 10);

    await WishlistService.removeMovieFromWishlist(userId, movieId);
    res.status(204).send(); // 204 No Content: la risposta standard per un DELETE riuscito
  } catch (error) {
    next(error);
  }
};


// --- CONTROLLER PER LE SERIE TV ---

export const handleAddTvShow = async (req: Request<{}, {}, AddTvShowPayload>, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { tvShowId } = req.body;
    const newFavorite = await WishlistService.addTvShowToWishlist(userId, tvShowId);
    res.status(201).json(newFavorite);
  } catch (error) {
    next(error);
  }
};

export const handleRemoveTvShow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const tvShowId = parseInt(req.params.tvShowId, 10);
    await WishlistService.removeTvShowFromWishlist(userId, tvShowId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};


// --- CONTROLLER PER IL CHECK DEGLI ID ---

export const handleGetUserFavoriteIds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const favoriteIds = await WishlistService.getUserFavoriteIds(userId);
    res.json(favoriteIds); 
  } catch (error) {
    next(error);
  }
};

