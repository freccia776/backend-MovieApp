import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z.string()
    .min(3, { message: "L'username deve avere almeno 3 caratteri." })
    .max(20, { message: "L'username non può superare i 20 caratteri." })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "L'username può contenere solo lettere, numeri e underscore." })
    .optional(), 
  
  firstName: z.string().min(1, { message: "Il nome non può essere vuoto." }).optional(),
  lastName: z.string().min(1, { message: "Il cognome non può essere vuoto." }).optional(),
  
  // Aggiungiamo la validazione per l'età
  age: z.number().int()
    .min(14, { message: "Devi avere almeno 14 anni." })
    .max(99, { message: "Età non valida." })
    .optional(),

  bio: z.string()
    .max(300, { message: "La bio non può superare i 300 caratteri." })
    .optional(),
});

export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;