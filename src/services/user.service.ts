import { PrismaClient } from '@prisma/client';
import s3Client from '../utils/s3';
// Importiamo anche DeleteObjectCommand
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import sharp from 'sharp';

// IMPORTIAMO LO SCHEMA DI VALIDAZIONE
 import { updateProfileSchema, UpdateProfileBody } from '../types/user.validation';

const prisma = new PrismaClient();
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;
const AWS_REGION = process.env.AWS_REGION;



// --- FUNZIONE HELPER PRIVATA ---
// Serve a cancellare un file da S3 dato il suo URL completo.
const deleteFromS3 = async (fileUrl: string) => {
  if (!fileUrl.includes('.amazonaws.com/')) return;

  try {
    const urlParts = fileUrl.split('.amazonaws.com/');
    const key = urlParts[1]; // Estrae "avatars/nomefile.webp"

    // CONTROLLO SICUREZZA: Cancelliamo solo se è nella cartella avatars/
    if (key && key.startsWith('avatars/')) {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      }));
      console.log(`Immagine eliminata da S3: ${key}`);
    }
  } catch (error) {
    console.error("Errore cancellazione S3:", error);
    // Non lanciamo errore qui per non bloccare il flusso principale
  }
};

export const updateUserProfileImage = async (userId: number, file: Express.Multer.File) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileImageUrl: true } 
  });

  if (!currentUser) throw new Error("Utente non trovato");

  // 1. Se c'era una vecchia foto, cancellala (se non è il placeholder)
  if (currentUser.profileImageUrl) {
    await deleteFromS3(currentUser.profileImageUrl);
  }

  // 2. Prepara e Carica la nuova foto
  const randomString = crypto.randomBytes(8).toString('hex');
  const fileName = `avatars/user-${userId}-${randomString}.webp`;

  const optimizedBuffer = await sharp(file.buffer)
    .resize({ width: 400, height: 400, fit: 'cover' })
    .webp({ quality: 80 })
    .toBuffer();

  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: optimizedBuffer,
    ContentType: 'image/webp',
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  const imageUrl = `https://${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com/${fileName}`;

  // 3. Aggiorna DB
  return await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: imageUrl },
  });
};



/**
 * --- NUOVA FUNZIONE ---
 * Rimuove completamente la foto profilo (torna al default).
 */
export const deleteUserProfileImage = async (userId: number) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { profileImageUrl: true } 
  });

  if (!currentUser) throw new Error("Utente non trovato");

  // 1. Cancella il file da S3
  if (currentUser.profileImageUrl) {
    await deleteFromS3(currentUser.profileImageUrl);
  }

  // 2. Imposta l'URL a NULL nel database
  return await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: null }, // Torna al placeholder di default
  });
};



// --- NUOVA FUNZIONE: Aggiorna Dati Profilo (Testo) ---
export const updateUserProfileData = async (userId: number, rawData: unknown) => {
  // 1. Validazione con Zod
  const validationResult = updateProfileSchema.safeParse(rawData);
  
  if (!validationResult.success) {
     const firstError = validationResult.error.issues[0];
     throw new Error(`Validazione fallita: ${firstError.path.join('.')} - ${firstError.message}`);
  }
  
  const data = validationResult.data; // Dati validati

  // 2. Se l'utente sta cambiando username, controlliamo che non sia già preso
  if (data.username) {
    const existingUser = await prisma.user.findFirst({
      where: {
        username: data.username,
        NOT: { id: userId } // Importante: esclude se stesso dal controllo!
      }
    });

    if (existingUser) {
      throw new Error('Questo username è già in uso.');
    }
  }

  // 3. Aggiorniamo il database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...data // Passiamo tutti i campi validati (username, bio, firstName, ecc.)
    }
  });

  return updatedUser;
};


export const getUserById = async (userId: number) => {
  const user = await prisma.user.findUnique({
      where: { id: userId },
      // SELEZIONIAMO SOLO I DATI PUBBLICI
      // Non restituiamo MAI la password o il refresh token!
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        age: true,
        profileImageUrl: true,
        bio: true,
        createdAt: true,
        
        //I CAMPI IN PIÙ CHE NON SONO RICHIESTI NEL FRONTEND VENGONO SEMPLICEMENTE IGNORATI.
      }
    });

    if (!user) {
      throw new Error("Utente non trovato");
    }

    return user;


};