import { PrismaClient, FriendshipStatus } from '@prisma/client';


const prisma = new PrismaClient();

// --- 1. FUNZIONE BASE (Tramite ID) ---
export const sendFriendRequest = async (requesterId: number, addresseeId: number) => {
  if (requesterId === addresseeId) throw new Error("Non puoi chiederti l'amicizia da solo.");

  // Controlla se esiste già una relazione (in qualsiasi stato)
  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId }
      ]
    }
  });

  if (existing) {
    if (existing.status === 'ACCEPTED') throw new Error("Siete già amici.");
    if (existing.status === 'PENDING') throw new Error("C'è già una richiesta in sospeso.");
  }

  return await prisma.friendship.create({
    data: { requesterId, addresseeId, status: 'PENDING' }
  });
};

// --- 2. NUOVA FUNZIONE (Tramite Username) ---
export const sendFriendRequestByUsername = async (requesterId: number, username: string) => {
  // Cerchiamo l'utente nel DB
  const targetUser = await prisma.user.findUnique({
    where: { username }
  });

  if (!targetUser) {
    throw new Error(`Utente con username "${username}" non trovato.`);
  }

  // Riutilizziamo la logica di base passando l'ID trovato
  return sendFriendRequest(requesterId, targetUser.id);
};

// 2. Accettare una richiesta
//id di chi riceve la richiesta e id della richiesta. diventa accepted

export const acceptFriendRequest = async (userId: number, friendshipId: number) => {
  // Solo chi ha RICEVUTO la richiesta (userId == addresseeId) può accettarla
  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId }});

  
  if (!friendship || friendship.addresseeId !== userId) {
    throw new Error("Richiesta non valida o non autorizzata.");
  }
  //CONTROLLA SE SONO GIà AMICI PER RISPARMIARE UPDATE AL DATABASE.
  if (friendship.status === 'ACCEPTED') {
    throw new Error("Siete già amici.");
}

  return await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: 'ACCEPTED' }
  });
};

// 3. Rifiutare o Cancellare un amico
// id dell'utente e id della friendship delete della friendship
export const deleteFriendship = async (userId: number, friendshipId: number) => {
  // L'utente deve essere uno dei due partecipanti
  const friendship = await prisma.friendship.findFirst({
    where: {
      id: friendshipId,
      OR: [{ requesterId: userId }, { addresseeId: userId }]
    }
  });

  if (!friendship) throw new Error("Amicizia non trovata.");

  return await prisma.friendship.delete({
    where: { id: friendshipId }
  });
};

// 4. OTTENERE LA LISTA AMICI (Paginata!)
//ottiene la lista di amici: dell'utente page 1 e limite 20 persone per chiamata ritorna array formattedFriends.
export const getFriends = async (userId: number, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit; //indica quanti record saltare. nel caso di pagina 1 allora salto 0 record.

  // Cerchiamo tutte le amicizie ACCETTATE dove l'utente è coinvolto
  const friendships = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: userId }, { addresseeId: userId }]
    },
    include: {
      requester: { select: { id: true, username: true, profileImageUrl: true } },
      addressee: { select: { id: true, username: true, profileImageUrl: true } }
    },
    skip,
    take: limit,
    orderBy: { updatedAt: 'desc' } // Ordina per data di accettazione
  });

  // Formattiamo i dati per restituire una lista pulita di "amici"
  const formattedFriends = friendships.map(f => {
    // Se io sono il requester, l'amico è l'addressee, e viceversa
    return f.requesterId === userId ? f.addressee : f.requester;
  });

  return formattedFriends;
};

// 5. OTTENERE RICHIESTE IN SOSPESO (Quelle ricevute)
// ottieni le richieste di pending quelle da accettare o eliminare. userid.
export const getPendingRequests = async (userId: number, page: number = 1, limit: number = 20) => {
   const skip = (page - 1) * limit; //indica quanti record saltare. nel caso di pagina 1 allora salto 0 record.

  return await prisma.friendship.findMany({
    where: {
      addresseeId: userId,
      status: 'PENDING'
    },
    include: {
      requester: { select: { id: true, username: true, profileImageUrl: true } }
    },
    skip,
    take: limit,
    orderBy: { updatedAt: 'desc' } // Ordina per data di accettazione
  });
};

//mi da le richieste che ho inviato
export const getSentRequests = async (userId: number, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;

  return await prisma.friendship.findMany({
    where:{
      requesterId: userId,
      status: 'PENDING'
    },
    include: {
      addressee: {select: {id: true, username: true, profileImageUrl: true}}
    },
    skip,
    take: limit,
    orderBy: {updatedAt: 'desc'}
  });
};


export const getFriendshipStatus = async (currentUserId: number, targetUserId: number) => {
  // Cerchiamo una relazione esistente tra i due utenti
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: currentUserId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: currentUserId },
      ],
    },
  });

  // Se non esiste nessuna relazione
  if (!friendship) {
    return { 
      status: 'NONE', 
      id: null, 
      isRequester: false 
    };
  }

  // Se esiste, restituiamo lo stato, l'ID e se l'utente corrente è colui che ha inviato la richiesta
  return {
    status: friendship.status, // 'PENDING' oppure 'ACCEPTED'
    id: friendship.id,
    isRequester: friendship.requesterId === currentUserId
  };
};


