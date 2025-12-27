import { z } from 'zod'; // Importiamo la libreria zod

//quello che arriva nei params è una stringa bisogna trasformarla in int
export const idParamSchema = z.object({
  friendshipId: z.string().transform((val) => parseInt(val, 10)).refine((val) => !isNaN(val) && val > 0, {
    message: "ID amicizia non valido",
  }),
});

// --- SCHEMA AGGIORNATO ---
// Accetta sia targetUserId (numero) che targetUsername (stringa)
export const sendRequestSchema = z.object({
  targetUserId: z.number().int().positive().optional(),
  targetUsername: z.string().min(3, { message: "L'username deve avere almeno 3 caratteri." }).optional(),
}).refine(data => data.targetUserId || data.targetUsername, {
    message: "Devi specificare un ID utente o uno username."
});


