import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MessageAttributes {
    id: number;
    conversationId: number;  // Ajout du conversationId manquant
    senderId: number;
    type: 'text' | 'image' | 'video';
    content: string;
    mediaUrl?: string;
    timestamp: Date;
    isRead: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'isRead' | 'timestamp'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
    public id!: number;
    public conversationId!: number;  // Propriété ajoutée
    public senderId!: number;
    public type!: 'text' | 'image' | 'video';
    public content!: string;
    public mediaUrl?: string;
    public timestamp!: Date;
    public isRead!: boolean;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Message.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        conversationId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'conversations',
                key: 'id',
            },
        },
        senderId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('text', 'image', 'video'),
            allowNull: false,
            defaultValue: 'text',
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        mediaUrl: {
            type: DataTypes.STRING,
        },
        timestamp: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
    },
    {
        sequelize,
        tableName: 'messages',
    }
);

export default Message;