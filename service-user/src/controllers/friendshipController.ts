import { Request, Response } from 'express';
import { Op } from 'sequelize';
import Friendship, { FriendshipStatus } from '../models/Friendship';
import sequelize from '../config/database';
import User from "../models/User";
import {getUserProfile} from "./userController";

export const sendFriendRequest = async (req: Request, res: Response): Promise<void> => {
    const { addresseeId } = req.body;
    const requesterId = (req as any).userId;

    if (!addresseeId) {
        res.status(400).json({ message: 'ID du destinataire requis' });
        return;
    }

    if (requesterId === parseInt(addresseeId)) {
        res.status(400).json({ message: 'Vous ne pouvez pas vous envoyer une demande d\'ami à vous-même' });
        return;
    }

    try {
        const existingFriendship = await Friendship.findOne({
            where: {
                [Op.or]: [
                    { requesterId, addresseeId },
                    { requesterId: addresseeId, addresseeId: requesterId },
                ],
            },
        });

        if (existingFriendship) {
            if (existingFriendship.status === FriendshipStatus.ACCEPTED) {
                res.status(400).json({ message: 'Vous êtes déjà amis' });
            } else if (existingFriendship.status === FriendshipStatus.PENDING) {
                if (existingFriendship.requesterId === parseInt(addresseeId)) {
                    existingFriendship.status = FriendshipStatus.ACCEPTED;
                    await existingFriendship.save();
                    res.status(200).json({ message: 'Demande d\'ami acceptée', friendship: existingFriendship });
                } else {
                    res.status(400).json({ message: 'Vous avez déjà envoyé une demande d\'ami à cet utilisateur' });
                }
            } else if (existingFriendship.status === FriendshipStatus.BLOCKED) {
                res.status(403).json({ message: 'Action impossible' });
            } else {
                existingFriendship.status = FriendshipStatus.PENDING;
                await existingFriendship.save();
                res.status(200).json({ message: 'Demande d\'ami envoyée', friendship: existingFriendship });
            }
            return;
        }

        const newFriendship = await Friendship.create({
            requesterId,
            addresseeId: parseInt(addresseeId),
            status: FriendshipStatus.PENDING,
        });

        res.status(201).json({ message: 'Demande d\'ami envoyée', friendship: newFriendship });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

export const respondToFriendRequest = async (req: Request, res: Response): Promise<void> => {
    const { friendshipId, accept } = req.body;
    const currentUserId = (req as any).userId;

    if (!friendshipId) {
        res.status(400).json({ message: 'ID de la demande d\'ami requis' });
        return;
    }

    try {
        const friendship = await Friendship.findByPk(friendshipId);

        if (!friendship) {
            res.status(404).json({ message: 'Demande d\'ami non trouvée' });
            return;
        }

        if (friendship.addresseeId !== currentUserId) {
            res.status(403).json({ message: 'Non autorisé à répondre à cette demande d\'ami' });
            return;
        }

        if (friendship.status !== FriendshipStatus.PENDING) {
            res.status(400).json({ message: 'Cette demande d\'ami n\'est plus en attente' });
            return;
        }

        friendship.status = accept ? FriendshipStatus.ACCEPTED : FriendshipStatus.DECLINED;
        await friendship.save();

        res.status(200).json({
            message: accept ? 'Demande d\'ami acceptée' : 'Demande d\'ami refusée',
            friendship,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

export const blockUser = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body;
    const currentUserId = (req as any).userId;

    if (!userId) {
        res.status(400).json({ message: 'ID de l\'utilisateur requis' });
        return;
    }

    if (currentUserId === parseInt(userId)) {
        res.status(400).json({ message: 'Vous ne pouvez pas vous bloquer vous-même' });
        return;
    }

    try {
        const transaction = await sequelize.transaction();

        try {
            let friendship = await Friendship.findOne({
                where: {
                    [Op.or]: [
                        { requesterId: currentUserId, addresseeId: userId },
                        { requesterId: userId, addresseeId: currentUserId },
                    ],
                },
                transaction,
            });

            if (friendship) {
                friendship.status = FriendshipStatus.BLOCKED;

                if (friendship.addresseeId === currentUserId) {
                    const tempId = friendship.requesterId;
                    friendship.requesterId = friendship.addresseeId;
                    friendship.addresseeId = tempId;
                }

                await friendship.save({ transaction });
            } else {
                friendship = await Friendship.create({
                    requesterId: currentUserId,
                    addresseeId: parseInt(userId),
                    status: FriendshipStatus.BLOCKED,
                }, { transaction });
            }

            await transaction.commit();
            res.status(200).json({ message: 'Utilisateur bloqué', friendship });
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

export const unblockUser = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body;
    const currentUserId = (req as any).userId;

    if (!userId) {
        res.status(400).json({ message: 'ID de l\'utilisateur requis' });
        return;
    }

    try {
        const friendship = await Friendship.findOne({
            where: {
                requesterId: currentUserId,
                addresseeId: userId,
                status: FriendshipStatus.BLOCKED,
            },
        });

        if (!friendship) {
            res.status(404).json({ message: 'Relation de blocage non trouvée' });
            return;
        }

        await friendship.destroy();

        res.status(200).json({ message: 'Utilisateur débloqué' });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

export const removeFriend = async (req: Request, res: Response): Promise<void> => {
    const { friendId } = req.body;
    const currentUserId = (req as any).userId;

    if (!friendId) {
        res.status(400).json({ message: 'ID de l\'ami requis' });
        return;
    }

    try {
        const friendship = await Friendship.findOne({
            where: {
                status: FriendshipStatus.ACCEPTED,
                [Op.or]: [
                    { requesterId: currentUserId, addresseeId: friendId },
                    { requesterId: friendId, addresseeId: currentUserId },
                ],
            },
        });

        if (!friendship) {
            res.status(404).json({ message: 'Relation d\'amitié non trouvée' });
            return;
        }

        await friendship.destroy();

        res.status(200).json({ message: 'Ami supprimé' });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

export const getFriends = async (req: Request, res: Response): Promise<void> => {
    const currentUserId = (req as any).userId;

    try {
        const friendships = await Friendship.findAll({
            where: {
                status: FriendshipStatus.ACCEPTED,
                [Op.or]: [
                    { requesterId: currentUserId },
                    { addresseeId: currentUserId },
                ],
            },
        });

        const friendIds = friendships.map(friendship =>
            friendship.requesterId === currentUserId
                ? friendship.addresseeId
                : friendship.requesterId
        );

        const userDetails : any = []

        for (const friendId of friendIds) {
            await User.findOne({
                where: {
                    id: friendId,
                },
                attributes: ['id', 'username', 'profilePicture'],
            }).then(user => {
                if (user) {
                    userDetails.push({
                        id: user.id,
                        username: user.username,
                        profilePicture: user.profilePicture,
                    });
                }
            }).catch(err => {
                console.error('Erreur lors de la récupération de l\'utilisateur:', err);
            });
        }

        res.status(200).json({ friends: userDetails });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

export const getPendingFriendRequests = async (req: Request, res: Response): Promise<void> => {
    const currentUserId = (req as any).userId;

    try {
        const receivedRequests = await Friendship.findAll({
            where: {
                addresseeId: currentUserId,
                status: FriendshipStatus.PENDING,
            },
        });

        const sentRequests = await Friendship.findAll({
            where: {
                requesterId: currentUserId,
                status: FriendshipStatus.PENDING,
            },
        });

        const enrichedReceivedRequests = await Promise.all(receivedRequests.map(async (request) => {
            const user = await User.findOne({
                where: {
                    id: request.requesterId,
                },
                attributes: ['id', 'username', 'profilePicture'],
            });

            const requestObj = request.get({ plain: true });
            return {
                ...requestObj,
                requester: user ? {
                    id: user.id,
                    username: user.username,
                    profilePicture: user.profilePicture,
                } : null
            };
        }));

        const enrichedSentRequests = await Promise.all(sentRequests.map(async (request) => {
            const user = await User.findOne({
                where: {
                    id: request.addresseeId,
                },
                attributes: ['id', 'username', 'profilePicture'],
            });

            const requestObj = request.get({ plain: true });
            return {
                ...requestObj,
                addressee: user ? {
                    id: user.id,
                    username: user.username,
                    profilePicture: user.profilePicture,
                } : null
            };
        }));

        res.status(200).json({
            received: enrichedReceivedRequests,
            sent: enrichedSentRequests,
        });
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
    const { query } = req.query;

    if (!query) {
        res.status(400).json({ message: 'Requête de recherche requise' });
        return;
    }

    try {
        const users = await User.findAll({
            where: {
                username: {
                    [Op.like]: `%${query}%`,
                },
            },
            attributes: ['id', 'username', 'profilePicture'],
        });

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};