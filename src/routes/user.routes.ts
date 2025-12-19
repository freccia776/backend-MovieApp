import { Router } from 'express';
import multer from 'multer'; //serve per gestire l'upload dei file
import * as UserController from '../controllers/user.controllers';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import { is } from 'zod/v4/locales';

const router = Router();

// --- CONFIGURAZIONE MULTER ---
// Salviamo il file nella RAM (memoryStorage) invece che su disco.
// Questo è più veloce e necessario per piattaforme come Render (che cancellano il disco al riavvio)
// e per passare il buffer direttamente a Sharp/S3.
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { 
        fileSize: 5 * 1024 * 1024 // Limite massimo 5MB per sicurezza
    } 
});

// --- DEFINIZIONE ROTTE ---

// POST /api/user/avatar
// 1. isAuthenticated: Controlla che l'utente sia loggato
// 2. upload.single('avatar'): Cerca un file nel campo del form chiamato 'avatar'
// 3. UserController.uploadAvatar: Esegue la logica
router.post('/avatar', isAuthenticated, upload.single('avatar'), UserController.uploadAvatar);


router.delete('/avatar', isAuthenticated, UserController.removeAvatar);


router.patch('/profile', isAuthenticated, UserController.updateUserProfile); // Rotta per aggiornare i parametri utente (es. username, email)

// GET /api/user/123
router.get('/:id', isAuthenticated, UserController.getProfile);

export default router;