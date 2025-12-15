import { z } from 'zod'; // Importiamo la libreria zod
import dotenv from 'dotenv'
// --- SCHEMA PER LA REGISTRAZIONE ---
// Definiamo un "oggetto" zod che rappresenta la struttura attesa del req.body per /register
export const registerSchema = z.object({
  // Campo email: deve essere una stringa e rispettare il formato email.
  
  email: z.email({error: "Formato email non valido"}),

  
  // Campo username: stringa, con lunghezza minima e massima, e caratteri specifici permessi.
  username: z.string()
    .min(3, { error: "L'username deve avere almeno 3 caratteri." })
    .max(20, { error: "L'username non può superare i 20 caratteri." })
    .regex(/^[a-zA-Z0-9_]+$/, { error: "L'username può contenere solo lettere, numeri e underscore (_)." }),
    
  // Campo password: stringa, con lunghezza minima e regole di complessità (minuscola, maiuscola, numero).
  password: z.string()
    .min(8, { error: "La password deve avere almeno 8 caratteri." })
    .regex(/[a-z]/, { error: "La password deve contenere almeno una lettera minuscola."})
    .regex(/[A-Z]/, { error: "La password deve contenere almeno una lettera maiuscola."})
    .regex(/[0-9]/, { error: "La password deve contenere almeno un numero."})
    .regex(/[^a-zA-Z0-9]/, { error: "La password deve contenere almeno un carattere speciale."}), // Puoi decommentare questa riga se vuoi richiedere caratteri speciali

  // Campo firstName: stringa non vuota.
  firstName: z.string().min(1, { error: "Il nome è obbligatorio."}),
  
  // Campo lastName: stringa non vuota.
  lastName: z.string().min(1, { error: "Il cognome è obbligatorio."}),
  
  // Campo age: numero intero, compreso tra 14 e 99.
  age: z.number().int().min(14, { error: "Devi avere almeno 14 anni."}).max(99, { error: "Età non valida."}),
  
  // Campo profileImageUrl: stringa che deve essere un URL valido.
  // È anche .nullable() (può essere null) e .optional() (può mancare del tutto).
  profileImageUrl: z.url({ error: "URL immagine non valido." }).nullable().optional(), 
});

// --- SCHEMA PER IL LOGIN ---
// Definiamo la struttura attesa del req.body per /login
export const loginSchema = z.object({
  // Campo emailorusername: stringa non vuota.
  emailorusername: z.string().min(1, { error: "Email o username richiesto."}),
  // Campo password: stringa non vuota.
  password: z.string().min(1, { error: "Password richiesta."}),
});



// --- NUOVO SCHEMA PER IL REFRESH ---
// Definisce cosa ci aspettiamo nel corpo della richiesta per il refresh.
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, { message: "Refresh token richiesto."}),
});



// Nuovo tipo inferito per il refresh
export type RefreshBody = z.infer<typeof refreshSchema>; 

// --- TIPI TYPESCRIPT INFERITI ---
// Questa è la magia di Zod: crea automaticamente i tipi TypeScript
// basandosi sugli schemi che abbiamo appena definito.
// Non dobbiamo più scrivere le `interface RegisterBody` e `LoginBody` a mano!
export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;

