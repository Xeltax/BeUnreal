import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Conversation from './Conversation';

interface ConversationParticipantAttributes {
    id: number;
    conversationId: number;
    userId: number;
    lastReadMessageId?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

interface ConversationParticipantCreationAttributes extends Optional<ConversationParticipantAttributes, 'id'> {}

class ConversationParticipant extends Model<ConversationParticipantAttributes, ConversationParticipantCreationAttributes> implements ConversationParticipantAttributes {
    public id!: number;
    public conversationId!: number;
    public userId!: number;
    public lastReadMessageId?: number;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

ConversationParticipant.init(
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
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        lastReadMessageId: {
            type: DataTypes.INTEGER,
        },
    },
    {
        sequelize,
        tableName: 'conversation_participants',
    }
);

// Relation avec les conversations
Conversation.hasMany(ConversationParticipant, {
    foreignKey: 'conversationId',
    as: 'participants'
});
ConversationParticipant.belongsTo(Conversation, {
    foreignKey: 'conversationId',
    as: 'conversation'
});

export default ConversationParticipant;