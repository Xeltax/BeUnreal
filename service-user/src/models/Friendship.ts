import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum FriendshipStatus {
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    DECLINED = 'declined',
    BLOCKED = 'blocked'
}

interface FriendshipAttributes {
    id: number;
    requesterId: number;
    addresseeId: number;
    status: FriendshipStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

interface FriendshipCreationAttributes extends Optional<FriendshipAttributes, 'id'> {}

class Friendship extends Model<FriendshipAttributes, FriendshipCreationAttributes> implements FriendshipAttributes {
    public id!: number;
    public requesterId!: number;
    public addresseeId!: number;
    public status!: FriendshipStatus;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;
}

Friendship.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        requesterId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        addresseeId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM(...Object.values(FriendshipStatus)),
            allowNull: false,
            defaultValue: FriendshipStatus.PENDING,
        },
    },
    {
        sequelize,
        tableName: 'friendships',
        indexes: [
            {
                unique: true,
                fields: ['requesterId', 'addresseeId'],
            },
        ],
    }
);

export default Friendship;