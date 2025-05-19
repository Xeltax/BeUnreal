import {DataTypes, Model, Optional} from 'sequelize';
import User from "./User";
import sequelize from "../config/database";

interface MediaAttributes {
    id: number,
    userId: number,
    user?: User,
    mediaUrl: string,
    city?: string,
    createdAt: Date,

    isPublic: boolean,
    latitude?: number,
    longitude?: number,
}

interface MediaCreationAttributes extends Optional<MediaAttributes, 'id'> {}

class Media extends Model<MediaAttributes, MediaCreationAttributes> implements MediaAttributes {
    id!: number
    userId!: number
    user?: User
    mediaUrl!: string
    city?: string
    createdAt!: Date

    isPublic!: boolean
    latitude?: number
    longitude?: number
}

Media.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        mediaUrl: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        isPublic: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        },
        latitude: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
        longitude: {
            type: DataTypes.FLOAT,
            allowNull: true,
        }
    }, {
        sequelize,
        tableName: 'medias',
        timestamps: false,
        hooks: {
            beforeCreate: async (media: Media) => {
                media.createdAt = new Date()
            },
            afterFind: async (media: Media) => {
                if (!media.userId) {
                    return
                }

                const response = await fetch(`http://localhost:3000/api/users/internal/profile/${media.userId}`)

                console.log(response)
                if (!response.ok) {
                    return
                }

                media.user = (await (await response.json()))
            },
        },
    }
)