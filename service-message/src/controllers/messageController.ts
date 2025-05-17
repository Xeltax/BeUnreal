import { Request, Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import ConversationParticipant from '../models/ConversationParticipant';
import { Op } from 'sequelize';
import sequelize from '../config/database';

// Créer une conversation avec un utilisateur
export const createOrGetConversation = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body;
    const currentUserId = (req as any).userId;

    if (!userId) {
        res.status(400).json({ message: 'ID utilisateur requis' });
        return;
    }

    try {
        // Vérifier si une conversation existe déjà entre ces deux utilisateurs
        const existingConversation = await Conversation.findOne({
            include: [
                {
                    model: ConversationParticipant,
                    as: 'participants',
                    where: {
                        userId: {
                            [Op.in]: [currentUserId, userId],
                        },
                    },
                    required: true,
                },
            ],
            where: {
                isGroup: false,
            },
        });

        if (existingConversation) {
            // Vérifier que c'est bien une conversation entre ces deux utilisateurs uniquement
            const participantsCount = await ConversationParticipant.count({
                where: {
                    conversationId: existingConversation.id,
                },
            });

            if (participantsCount === 2) {
                res.status(200).json(existingConversation);
                return;
            }
        }

        // Créer une nouvelle conversation
        const transaction = await sequelize.transaction();

        try {
            const newConversation = await Conversation.create(
                {
                    isGroup: false,
                    lastMessageAt: new Date(),
                },
                { transaction }
            );

            // Ajouter les participants
            await ConversationParticipant.create(
                {
                    conversationId: newConversation.id,
                    userId: currentUserId,
                },
                { transaction }
            );

            await ConversationParticipant.create(
                {
                    conversationId: newConversation.id,
                    userId: parseInt(userId),
                },
                { transaction }
            );

            await transaction.commit();

            res.status(201).json(newConversation);
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

// Créer une conversation de groupe
export const createGroupConversation = async (req: Request, res: Response): Promise<void> => {
    const { name, userIds } = req.body;
    const currentUserId = (req as any).userId;

    if (!name || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({ message: 'Nom et IDs des utilisateurs requis' });
        return;
    }

    try {
        const transaction = await sequelize.transaction();

        try {
            const newConversation = await Conversation.create(
                {
                    isGroup: true,
                    name,
                    lastMessageAt: new Date(),
                },
                { transaction }
            );

            // Ajouter l'utilisateur actuel comme participant
            await ConversationParticipant.create(
                {
                    conversationId: newConversation.id,
                    userId: currentUserId,
                },
                { transaction }
            );

            // Ajouter les autres participants
            for (const userId of userIds) {
                await ConversationParticipant.create(
                    {
                        conversationId: newConversation.id,
                        userId: parseInt(userId),
                    },
                    { transaction }
                );
            }

            await transaction.commit();

            res.status(201).json(newConversation);
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

// Récupérer toutes les conversations d'un utilisateur
export const getUserConversations = async (req: Request, res: Response): Promise<void> => {
    const currentUserId = (req as any).userId;

    try {
        const conversations = await Conversation.findAll({
            include: [
                {
                    model: ConversationParticipant,
                    as: 'participants',
                    where: {
                        userId: currentUserId,
                    },
                    required: true,
                },
                {
                    model: Message,
                    as: 'messages',
                    limit: 1,
                    order: [['timestamp', 'DESC']],
                    required: false,
                },
            ],
            order: [['lastMessageAt', 'DESC']],
        });

        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Récupérer les messages d'une conversation
export const getConversationMessages = async (req: Request, res: Response): Promise<void> => {
    const { conversationId } = req.params;
    const currentUserId = (req as any).userId;

    try {
        // Vérifier que l'utilisateur est bien un participant de cette conversation
        const isParticipant = await ConversationParticipant.findOne({
            where: {
                conversationId,
                userId: currentUserId,
            },
        });

        if (!isParticipant) {
            res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
            return;
        }

        const messages = await Message.findAll({
            where: {
                conversationId,
            },
            order: [['timestamp', 'ASC']],
        });

        // Mettre à jour le dernier message lu
        if (messages.length > 0) {
            await ConversationParticipant.update(
                {
                    lastReadMessageId: messages[messages.length - 1].id,
                },
                {
                    where: {
                        conversationId,
                        userId: currentUserId,
                    },
                }
            );
        }

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({
            message: 'Erreur serveur',
            error: (error as Error).message,
        });
    }
};

// Envoyer un message texte
export const sendTextMessage = async (req: Request, res: Response): Promise<void> => {
    const { conversationId, content } = req.body;
    const senderId = (req as any).userId;

    if (!conversationId || !content) {
        res.status(400).json({ message: 'ID de conversation et contenu requis' });
        return;
    }

    try {
        // Vérifier que l'utilisateur est bien un participant de cette conversation
        const isParticipant = await ConversationParticipant.findOne({
            where: {
                conversationId,
                userId: senderId,
            },
        });

        if (!isParticipant) {
            res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
            return;
        }

        const transaction = await sequelize.transaction();

        try {
            const message = await Message.create(
                {
                    conversationId: parseInt(conversationId),
                    senderId,
                    type: 'text',
                    content,
                    timestamp: new Date(),
                    isRead: false,
                },
                { transaction }
            );

            // Mettre à jour la date du dernier message de la conversation
            await Conversation.update(
                {
                    lastMessageAt: new Date(),
                },
                {
                    where: {
                        id: conversationId,
                    },
                    transaction,
                }
            );

            await transaction.commit();

            // Le message sera diffusé via socket.io par le serveur
            res.status(201).json(message);
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

// Envoyer un message média (image ou vidéo)
export const sendMediaMessage = async (req: Request, res: Response): Promise<void> => {
    const { conversationId, type, content, mediaUrl } = req.body;
    const senderId = (req as any).userId;

    if (!conversationId || !type || !mediaUrl) {
        res.status(400).json({ message: 'ID de conversation, type et URL du média requis' });
        return;
    }

    if (type !== 'image' && type !== 'video') {
        res.status(400).json({ message: 'Type de média invalide' });
        return;
    }

    try {
        // Vérifier que l'utilisateur est bien un participant de cette conversation
        const isParticipant = await ConversationParticipant.findOne({
            where: {
                conversationId,
                userId: senderId,
            },
        });

        if (!isParticipant) {
            res.status(403).json({ message: 'Accès non autorisé à cette conversation' });
            return;
        }

        const transaction = await sequelize.transaction();

        try {
            const message = await Message.create(
                {
                    conversationId: parseInt(conversationId),
                    senderId,
                    type,
                    content: content || '',
                    mediaUrl,
                    timestamp: new Date(),
                    isRead: false,
                },
                { transaction }
            );

            // Mettre à jour la date du dernier message de la conversation
            await Conversation.update(
                {
                    lastMessageAt: new Date(),
                },
                {
                    where: {
                        id: conversationId,
                    },
                    transaction,
                }
            );

            await transaction.commit();

            // Le message sera diffusé via socket.io par le serveur
            res.status(201).json(message);
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