-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "profileImageUrl" TEXT NOT NULL,
    "bio" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteMovie" (
    "id" SERIAL NOT NULL,
    "movieId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteMovie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavoriteTvShow" (
    "id" SERIAL NOT NULL,
    "tvShowId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteTvShow_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteMovie_userId_movieId_key" ON "FavoriteMovie"("userId", "movieId");

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteTvShow_userId_tvShowId_key" ON "FavoriteTvShow"("userId", "tvShowId");

-- AddForeignKey
ALTER TABLE "FavoriteMovie" ADD CONSTRAINT "FavoriteMovie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FavoriteTvShow" ADD CONSTRAINT "FavoriteTvShow_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
