// Il Service è il cuore della logica di business ("business logic").
// Non si preoccupa di come arrivano i dati (req) o di come vengono inviati (res).
// Il suo unico compito è eseguire le operazioni e restituire un risultato o lanciare un errore.

// Importiamo gli strumenti necessari.
import { PrismaClient, Prisma } from '@prisma/client'; // Il client per parlare con il database.
import bcrypt from 'bcryptjs'; // Per crittografare e confrontare le password.
import jwt from 'jsonwebtoken'; // Per creare i token di sessione.
//import { LoginBody } from '../types/auth.types'; // Importiamo i "contratti" per i dati.
//import { RegisterBody } from '../types/auth.types';
import {registerSchema, loginSchema, RegisterBody, LoginBody } from '../types/auth.validation';

// Creiamo un'istanza di Prisma Client per poter interagire con il database.
const prisma = new PrismaClient();
// Recuperiamo la chiave segreta per i token JWT dal file .env, con un valore di fallback per sicurezza.
const JWT_SECRET = process.env.JWT_SECRET;

// CONTROLLO CRITICO: Se la chiave segreta non è definita, il server non deve partire.
// Questo previene che l'applicazione giri in uno stato insicuro.
if (!JWT_SECRET) {
  console.error("ERRORE FATALE: La variabile d'ambiente JWT_SECRET non è stata definita");
  process.exit(1); // Ferma l'applicazione immediatamente.
}
/**
 * Funzione per registrare un nuovo utente.
 * @param userData I dati dell'utente provenienti dal controller.
 * @returns L'oggetto utente appena creato.
 * @throws Lancia un errore (che verrà catturato dal controller) se l'utente esiste già.
 */
export const registerUser = async (registerData: unknown) => {
  // Estraiamo i dati dall'oggetto in input.

  const validationResult = registerSchema.safeParse(registerData);

  if(!validationResult.success){
        const firstError = validationResult.error.issues[0];

    throw new Error(`Validazione fallita: ${firstError.path.join('.')} - ${firstError.message}`);
  }

  const userData = validationResult.data;
  
  const { email, username, password, firstName, lastName, age, profileImageUrl } = userData;

  // Controlliamo se nel database esiste già un utente con la stessa email o lo stesso username.
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  // Se troviamo un utente, lanciamo un errore. Il controller lo prenderà e invierà una risposta 400.
  if (existingUser) {
    throw new Error('Email o username già registrati.');
  }

  // Crittografiamo la password dell'utente. Il "10" è il "costo" dell'hashing (più è alto, più è sicuro e lento).
  const hashedPassword = await bcrypt.hash(password, 10);

  //creiamo l'utente
 try {
    const user = await prisma.user.create({
      data: { 
        email, 
        username, 
        password: hashedPassword, 
        firstName, 
        lastName, 
        age, 
        profileImageUrl: profileImageUrl || null 
      },
    });
    return user;
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error("Errore Prisma durante la creazione utente:", error.code);
     }
     throw new Error('Errore durante la creazione dell\'utente nel database.');
  }
};


export const loginUser = async (loginData: unknown) => {
  // Estraiamo i dati.
  const validationResult = loginSchema.safeParse(loginData);

  if(!validationResult.success){
    const firstError = validationResult.error.issues[0];

    throw new Error(`Validazione fallita: ${firstError.path.join('.')} - ${firstError.message}`);
  }

  const userData = validationResult.data;
  const { emailorusername, password } = userData;

  // Cerchiamo l'utente nel database tramite email o username.
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: emailorusername }, { username: emailorusername }] },
  });

  // Se non troviamo l'utente, o se la password inviata (dopo il confronto) non corrisponde a quella salvata (crittografata), lanciamo un errore.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Credenziali non valide.');
  }
  //BANNATO
   if (user.isBanned) {
    throw new Error('Questo account è stato bannato.');
  }
  // Se le credenziali sono corrette, creiamo il token JWT.
  const token = jwt.sign(
    { userId: user.id, username: user.username }, // "Payload": i dati che vogliamo inserire nel token.
    JWT_SECRET, // La chiave segreta per firmare il token.
    { expiresIn: '7d' } // Opzioni: diciamo al token di scadere tra 7 giorni.
  );

  // Restituiamo il token e l'utente al controller.
  return { token, user };
};

