import { Router } from 'express';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import * as FriendController from '../controllers/friends.controllers';

const router = Router();

router.get('/', isAuthenticated, FriendController.getFriendsList); // GET /api/friends?page=1
router.get('/pending', isAuthenticated, FriendController.getPendingList);
router.get('/sent', isAuthenticated, FriendController.getSentList);

// Verifica lo stato dell'amicizia con un utente specifico
router.get('/status/:userId', isAuthenticated, FriendController.checkFriendshipStatus);
// Invia una richiesta di amicizia
// POST /api/friends/request
// Body: { targetUserId: 123 }
router.post('/request', isAuthenticated, FriendController.sendRequest); // POST /api/friends/request

// Accetta una richiesta di amicizia
// PATCH /api/friends/:friendshipId/accept
// Esempio: PATCH /api/friends/45/accept
// Nota: Usiamo PATCH perché stiamo modificando lo stato di una risorsa esistente
router.patch('/:friendshipId/accept', isAuthenticated, FriendController.acceptRequest);

// Rifiuta o Cancella un'amicizia
// DELETE /api/friends/:friendshipId
// Esempio: DELETE /api/friends/45
// Nota: Usiamo DELETE perché stiamo rimuovendo la risorsa
router.delete('/:friendshipId', isAuthenticated, FriendController.deleteFriendship);





export default router;