import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// --- LOGICA PER I FILM ---

export const addMovieToWishlist = async (userId: number, movieId: number) => {
  try {
    return await prisma.favoriteMovie.create({
      data: { userId, movieId },
    });
  } catch (error) {
    // Gestione specifica dell'errore di Prisma per "record duplicato"
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('Film già presente nella wishlist.');
    }
    throw error; // Rilancia qualsiasi altro errore
  }
};


export const removeMovieFromWishlist = async (userId: number, movieId: number) => {
  try {
    return await prisma.favoriteMovie.delete({
      where: {
        // Usiamo l'identificatore unico combinato generato da Prisma per il vincolo @@unique
        userId_movieId: { userId, movieId },
      },
    });
  } catch (error) {
    // Gestione specifica dell'errore di Prisma per "record da cancellare non trovato"
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       throw new Error('Film non trovato nella wishlist.');
    }
    throw error;
  }
};


// --- LOGICA PER LE SERIE TV (simile a quella dei film) ---

export const addTvShowToWishlist = async (userId: number, tvShowId: number) => {
  try {
    return await prisma.favoriteTvShow.create({
      data: { userId, tvShowId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new Error('Serie TV già presente nella wishlist.');
    }
    throw error;
  }
};

export const removeTvShowFromWishlist = async (userId: number, tvShowId: number) => {
  try {
    return await prisma.favoriteTvShow.delete({
      where: {
        userId_tvShowId: { userId, tvShowId },
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
       throw new Error('Serie TV non trovata nella wishlist.');
    }
    throw error;
  }
};


// --- LOGICA PER IL CHECK EFFICIENTE ---

/**
 * Recupera solo gli ID dei film e delle serie TV preferite di un utente.
 * Questa è la funzione che il frontend chiamerà una volta per aggiornare lo stato di tutti i pulsanti.
 */
export const getUserFavoriteIds = async (userId: number) => {
  // Eseguiamo le due query in parallelo per la massima efficienza
  const [favoriteMovies, favoriteTvShows] = await Promise.all([
    prisma.favoriteMovie.findMany({
      where: { userId },
      select: { movieId: true }, // Seleziona solo il campo movieId
    }),
    prisma.favoriteTvShow.findMany({
      where: { userId },
      select: { tvShowId: true }, // Seleziona solo il campo tvShowId
    }),
  ]);

  // Trasformiamo l'array di oggetti [ { movieId: 123 }, ... ] in un semplice array di numeri [ 123, ... ]
  const movieIds = favoriteMovies.map(fav => fav.movieId);
  const tvShowIds = favoriteTvShows.map(fav => fav.tvShowId);

  return { movieIds, tvShowIds };
};

