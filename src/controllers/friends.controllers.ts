import { Request, Response, NextFunction } from 'express';
import * as FriendService from '../services/friends.service';
import { idParamSchema, sendRequestSchema } from '../types/friends.validation';

export const getFriendsList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId; //prendiamo id dal middleware.

    const page = parseInt(req.query.page as string) || 1;  //problema se qualcuno scrive 0??
    const limit = parseInt(req.query.limit as string) || 20;

    const friends = await FriendService.getFriends(userId, page, limit);
    res.json(friends);
  } catch (error) {
    next(error);
  }
};

// --- METODO INVIA RICHIESTA AGGIORNATO ---
export const sendRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    
    // 1. Validazione
    const validation = sendRequestSchema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues[0].message });
    }
    
    // 2. Estrazione Dati (può esserci ID o Username)
    const { targetUserId, targetUsername } = validation.data;

    // 3. Logica Condizionale
    if (targetUserId) {
        // Caso classico: ho l'ID
        await FriendService.sendFriendRequest(userId, targetUserId);
    } else if (targetUsername) {
        // Caso "Scrivo il nome": ho solo lo username
        await FriendService.sendFriendRequestByUsername(userId, targetUsername);
    }

    res.status(201).json({ message: "Richiesta inviata con successo!" });
  } catch (error) {
    next(error);
  }
};

export const acceptRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    //const { friendshipId } = req.body; // O dai params
    
    // VALIDAZIONE PARAMS CON ZOD (Importato)
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { friendshipId } = validation.data;
    
    await FriendService.acceptFriendRequest(userId, friendshipId);
    res.json({ message: "Amicizia accettata" });
  } catch (error) {
    next(error);
  }
};

export const deleteFriendship = async (req: Request, res: Response, next: NextFunction) => {
  try{
    const userId = req.user!.userId; //! fidati typescript userid non è ne null ne undefined.
    //const {friendshipId} = req.body; // O dai params
        // VALIDAZIONE PARAMS CON ZOD (Importato)
    const validation = idParamSchema.safeParse(req.params);
    if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues[0].message });
    }
    const { friendshipId } = validation.data;
    await FriendService.deleteFriendship(userId, friendshipId);
    res.json({message: "Friendship eliminata"});

  } catch(error){
    next(error);
  }
};

export const getPendingList = async (req: Request, res: Response, next: NextFunction) => {
  try{

    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1; 
    const limit = parseInt(req.query.limit as string) || 20;


    const pendingRequests = await FriendService.getPendingRequests(userId, page, limit);

    res.json(pendingRequests);
  } catch(error){
    next(error);
  }
};



export const getSentList = async (req: Request, res: Response, next: NextFunction) => {
  try{

    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1; 
    const limit = parseInt(req.query.limit as string) || 20;


    const sentRequests = await FriendService.getSentRequests(userId, page, limit);
    

    res.json(sentRequests);
  } catch(error){
    next(error);
  }
};

// VEDI LO STATO DI AMICIZIA
export const checkFriendshipStatus = async (req: Request, res: Response) => {
  try {
    // 1. Ottieni l'ID dell'utente loggato (dal middleware di autenticazione)
    // Nota: adatta 'req.user.id' in base a come è strutturato il tuo middleware (es. req.user?.id)
    const currentUserId = req.user!.userId; 
    
    // 2. Ottieni l'ID dell'utente target dai parametri dell'URL
    const targetUserId = parseInt(req.params.userId);   ///DA CAMBIARE CON ZOD????

    if (isNaN(targetUserId)) {
      return res.status(400).json({ message: 'ID utente non valido' });
    }

    // 3. Chiama il service
    const statusData = await FriendService.getFriendshipStatus(currentUserId, targetUserId);

    // 4. Invia la risposta
    res.json(statusData);

  } catch (error) {
    console.error('Errore nel controllo stato amicizia:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
};
