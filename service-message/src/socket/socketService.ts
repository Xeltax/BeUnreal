import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import Message from '../models/Message';
import ConversationParticipant from '../models/ConversationParticipant';

interface JwtPayload {
    id: number;
}

export default (httpServer: HttpServer): void => {
    const io = new Server(httpServer, {
        cors: {
            origin: '*', // En production, spécifiez les domaines autorisés
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Mapping des utilisateurs connectés (userId -> socketId)
    const connectedUsers = new Map<number, string>();

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentification requise'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;
            socket.data.userId = decoded.id;
            next();
        } catch (error) {
            return next(new Error('Token invalide'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = socket.data.userId;
        console.log(`Utilisateur ${userId} connecté`);

        // Ajouter l'utilisateur à la liste des connectés
        connectedUsers.set(userId, socket.id);

        // Rejoindre les salons de toutes les conversations de l'utilisateur
        ConversationParticipant.findAll({
            where: {
                userId,
            },
        }).then((participants) => {
            participants.forEach((participant) => {
                socket.join(`conversation:${participant.conversationId}`);
            });
        });

        // Écouter les nouveaux messages
        socket.on('message', async (data: { conversationId: number; message: any }) => {
            try {
                const { conversationId, message } = data;

                // Vérifier que l'utilisateur a le droit d'envoyer des messages dans cette conversation
                const isParticipant = await ConversationParticipant.findOne({
                    where: {
                        conversationId,
                        userId,
                    },
                });

                if (!isParticipant) {
                    return socket.emit('error', 'Non autorisé à envoyer des messages dans cette conversation');
                }

                // Enregistrer le message dans la base de données
                const newMessage = await Message.create({
                    conversationId,
                    senderId: userId,
                    type: message.type || 'text',
                    content: message.content,
                    mediaUrl: message.mediaUrl,
                    timestamp: new Date(),
                    isRead: false,
                });

                // Diffuser le message à tous les participants de la conversation
                io.to(`conversation:${conversationId}`).emit('newMessage', {
                    conversationId,
                    message: newMessage,
                });
            } catch (error) {
                console.error('Erreur lors du traitement du message:', error);
                socket.emit('error', 'Erreur lors du traitement du message');
            }
        });

        // Écouter les notifications de lecture de messages
        socket.on('markAsRead', async (data: { conversationId: number; messageId: number }) => {
            try {
                const { conversationId, messageId } = data;

                // Vérifier que l'utilisateur a le droit de marquer les messages comme lus dans cette conversation
                const isParticipant = await ConversationParticipant.findOne({
                    where: {
                        conversationId,
                        userId,
                    },
                });

                if (!isParticipant) {
                    return socket.emit('error', 'Non autorisé à marquer les messages comme lus dans cette conversation');
                }

                // Mettre à jour le dernier message lu
                await ConversationParticipant.update(
                    {
                        lastReadMessageId: messageId,
                    },
                    {
                        where: {
                            conversationId,
                            userId,
                        },
                    }
                );

                // Diffuser la notification de lecture à tous les participants de la conversation
                io.to(`conversation:${conversationId}`).emit('messageRead', {
                    conversationId,
                    userId,
                    messageId,
                });
            } catch (error) {
                console.error('Erreur lors du marquage des messages comme lus:', error);
                socket.emit('error', 'Erreur lors du marquage des messages comme lus');
            }
        });

        // Écouter les événements de saisie
        socket.on('typing', (data: { conversationId: number; isTyping: boolean }) => {
            // Diffuser l'événement de saisie à tous les participants de la conversation sauf l'expéditeur
            socket.to(`conversation:${data.conversationId}`).emit('userTyping', {
                conversationId: data.conversationId,
                userId,
                isTyping: data.isTyping,
            });
        });

        // Gérer la déconnexion
        socket.on('disconnect', () => {
            console.log(`Utilisateur ${userId} déconnecté`);
            connectedUsers.delete(userId);
        });
    });
};