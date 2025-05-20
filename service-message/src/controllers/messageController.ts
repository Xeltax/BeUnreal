import { Request, Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import ConversationParticipant from '../models/ConversationParticipant';
import { Op } from 'sequelize';
import sequelize from '../config/database';

export const createOrGetConversation = async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.body;
    const currentUserId = (req as any).userId;

    if (!userId) {
        res.status(400).json({ message: 'ID utilisateur requis' });
        return;
    }

    try {
        const userConversations = await ConversationParticipant.findAll({
            attributes: ['conversationId'],
            where: {
                userId: currentUserId
            }
        });

        const friendConversations = await ConversationParticipant.findAll({
            attributes: ['conversationId'],
            where: {
                userId: userId
            }
        });

        const userConvIds = userConversations.map(c => c.conversationId);
        const friendConvIds = friendConversations.map(c => c.conversationId);
        const commonConvIds = userConvIds.filter(id => friendConvIds.includes(id));

        console.log('User conversations:', userConvIds);
        console.log('Friend conversations:', friendConvIds);
        console.log('Common conversations:', commonConvIds);

        if (commonConvIds.length > 0) {
            const existingConversation = await Conversation.findOne({
                where: {
                    id: { [Op.in]: commonConvIds },
                    isGroup: false,
                },
            });

            if (existingConversation) {
                const participantsCount = await ConversationParticipant.count({
                    where: {
                        conversationId: existingConversation.id,
                    },
                });

                if (participantsCount === 2) {
                    // Charger explicitement tous les participants
                    const allParticipants = await ConversationParticipant.findAll({
                        where: {
                            conversationId: existingConversation.id,
                        },
                    });

                    console.log('All participants:', allParticipants);

                    // @ts-ignore
                    existingConversation.setDataValue('participants', allParticipants);

                    res.status(200).json(existingConversation);
                    return;
                }
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

export const getUserConversations = async (req: Request, res: Response): Promise<void> => {
    const currentUserId = (req as any).userId;

    try {
        const userParticipations = await ConversationParticipant.findAll({
            attributes: ['conversationId'],
            where: {
                userId: currentUserId,
            },
        });

        const conversationIds = userParticipations.map(p => p.conversationId);

        if (conversationIds.length === 0) {
            res.status(200).json([]);
            return;
        }

        const conversations = await Conversation.findAll({
            include: [
                {
                    model: Message,
                    as: 'messages',
                    limit: 1,
                    order: [['timestamp', 'DESC']],
                    required: false,
                },
            ],
            where: {
                id: {
                    [Op.in]: conversationIds
                }
            },
            order: [['lastMessageAt', 'DESC']],
        });

        const conversationsWithParticipants = await Promise.all(
            conversations.map(async (conversation) => {
                const participants = await ConversationParticipant.findAll({
                    where: {
                        conversationId: conversation.id
                    }
                });
                // @ts-ignore
                conversation.setDataValue('participants', participants);

                return conversation;
            })
        );

        res.status(200).json(conversationsWithParticipants);
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