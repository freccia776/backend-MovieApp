// Il Service è il cuore della logica di business ("business logic").
// Non si preoccupa di come arrivano i dati (req) o di come vengono inviati (res).
// Il suo unico compito è eseguire le operazioni e restituire un risultato o lanciare un errore.

// Importiamo gli strumenti necessari.
import { PrismaClient, Prisma } from '@prisma/client'; // Il client per parlare con il database.
import bcrypt from 'bcryptjs'; // Per crittografare e confrontare le password.
import jwt, {Secret, SignOptions} from 'jsonwebtoken'; // Per creare i token di sessione.

//import { LoginBody } from '../types/auth.types'; // Importiamo i "contratti" per i dati.
//import { RegisterBody } from '../types/auth.types';
import {registerSchema, loginSchema, refreshSchema, RefreshBody, RegisterBody, LoginBody,} from '../types/auth.validation';
import crypto from 'crypto';
// Creiamo un'istanza di Prisma Client per poter interagire con il database.
const prisma = new PrismaClient();

//CARICO LE VARIABILI D'AMBIENTE.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '15m'; 
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d'; 

//CONTROLLO JWT
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error("ERRORE FATALE: JWT_SECRET o JWT_REFRESH_SECRET non definite nel file .env");
  process.exit(1);
}

//CREO L'INTERFACCIA TOKENS
interface Tokens {
  accessToken: string;
  refreshToken: string;
}

//FUNZIONE PER GENERARE I TOKEN
const generateTokens = (user: {id: number, username: string}): Tokens => {
  // Definisci le opzioni direttamente con il cast

  //genera access token
  const accessToken = jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET as Secret,
    { expiresIn: JWT_EXPIRY as SignOptions['expiresIn'] }
  );
  //genera refresh token
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_REFRESH_SECRET as Secret,
    { expiresIn: JWT_REFRESH_EXPIRY as SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
};


/**
 * Funzione per registrare un nuovo utente.
 * @param userData I dati dell'utente provenienti dal controller.
 * @returns L'oggetto utente appena creato.
 * @throws Lancia un errore (che verrà catturato dal controller) se l'utente esiste già.
 */

//FUNZIONE DI REGISTRAZIONE
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

//FUNZIONE DI LOGIN
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
  //CONFRONTO PASSWORD
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Credenziali non valide.');
  }
  //BANNATO?
   if (user.isBanned) {
    throw new Error('Questo account è stato bannato.');
  }

  // Se le credenziali sono corrette, creiamo il token JWT.
  
  const { accessToken, refreshToken } = generateTokens(user);

  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  //SALVA IL REFRESHTOKEN NEL DB (SCRITTURA)
  try {
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: hashedRefreshToken } 
    });
  } catch(updateError) {
      console.error("Errore nell'aggiornamento del refresh token:", updateError);
      throw new Error("Errore durante il salvataggio della sessione.");
  }

  return { accessToken, refreshToken, user };
};


//REFRESH FUNCTION
export const refreshAccessToken = async (rawRefreshData: unknown) =>{
   const validationResult = refreshSchema.safeParse(rawRefreshData);
    if (!validationResult.success) {
      throw new Error('Refresh token mancante o malformato.');
  }
  // Estraiamo il refresh token dai dati validati.
  const { refreshToken: oldRefreshToken } = validationResult.data;

  
  let payload: { userId: number };
  try {
      // Usiamo il casting esplicito anche per jwt.verify
      const refreshSecret: Secret = JWT_REFRESH_SECRET!; 
      // Verifichiamo e decodifichiamo il refresh token.
      payload = jwt.verify(oldRefreshToken, refreshSecret) as { userId: number };
  } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
          throw new Error('Refresh token scaduto. Effettua nuovamente il login.');
      }
      throw new Error('Refresh token non valido.'); 
  }

  const hashedOldToken = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
  // user è l'utente associato al token.
  //payload è il contenuto del token decodificato.
  const user = await prisma.user.findUnique({
      where: { id: payload.userId }
  });

  if (!user || user.refreshToken !== hashedOldToken) {
      throw new Error('Refresh token non valido o già utilizzato (REUSE DETECTOR).');
  }

  //GENERIAMO I NUOVI TOKENS
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
  // Aggiorniamo il refresh token nel database.
  const hashedNewToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
 
  //aggiorno il refreshtoken
  await prisma.user.update({ 
    where: { id: user.id },
    data: { refreshToken: hashedNewToken }


  });

  return { accessToken, refreshToken: newRefreshToken };
};

