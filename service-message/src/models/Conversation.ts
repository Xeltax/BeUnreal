import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Message from './Message';

interface ConversationAttributes {
    id: number;
    isGroup: boolean;
    name?: string;
    createdAt?: Date;
    updatedAt?: Date;
    lastMessageAt: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'lastMessageAt'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
    public id!: number;
    public isGroup!: boolean;
    public name?: string;
    public lastMessageAt!: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Conversation.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        isGroup: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        },
        name: {
            type: DataTypes.STRING,
        },
        lastMessageAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
        },
    },
    {
        sequelize,
        tableName: 'conversations',
    }
);

// Relation avec les messages
Conversation.hasMany(Message, {
    foreignKey: 'conversationId',
    as: 'messages'
});
Message.belongsTo(Conversation, {
    foreignKey: 'conversationId',
    as: 'conversation'
});

export default Conversation;