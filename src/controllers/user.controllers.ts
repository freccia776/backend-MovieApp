import { Request, Response, NextFunction } from 'express';
import * as UserService from '../services/user.service';

/**
 * Gestisce l'upload dell'avatar utente.
 */
export const uploadAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Multer mette il file caricato dentro l'oggetto `req.file`
    if (!req.file) { 
      return res.status(400).json({ error: 'Nessun file caricato. Assicurati di inviare un campo "avatar".' });
    }

    // L'ID utente viene dal token JWT (grazie al middleware isAuthenticated)
    // Se TS si lamenta di 'user', è perché dobbiamo estendere l'interfaccia Request (lo abbiamo fatto nel middleware)

    const userId = req.user!.userId; //lo prendiamo da req.user settato da isAuthenticated
    
    // Chiamiamo il servizio che hai appena creato per caricare su S3 e aggiornare il DB
    const updatedUser = await UserService.updateUserProfileImage(userId, req.file);

    res.json({ 
      message: 'Foto profilo aggiornata con successo!', 
      profileImageUrl: updatedUser.profileImageUrl 
    });
  } catch (error) {
    next(error);
  }
};

// --- NUOVO: Remove Avatar ---
export const removeAvatar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    // Chiama il servizio per cancellare file e aggiornare DB
    const updatedUser = await UserService.deleteUserProfileImage(userId);

    res.json({ 
      message: 'Foto profilo rimossa.', 
      profileImageUrl: null // Restituiamo null così il frontend sa di mostrare il placeholder
    });
  } catch (error) {
    next(error);
  }
};


export const updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {

  try{
    
    const userId = req.user!.userId;

    const updatedUser = await UserService.updateUserProfileData(userId, req.body);
      

    res.json({
      message: 'Profilo utente aggiornato con successo',
      user: updatedUser
    });
    


  } catch(error){

    next(error);

  }


};