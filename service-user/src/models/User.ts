import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcrypt';

interface UserAttributes {
    id: number;
    username: string;
    email: string;
    password: string;
    profilePicture?: string;
    bio?: string;
    latitude?: number;
    longitude?: number;
    lastActive?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    public id!: number;
    public username!: string;
    public email!: string;
    public password!: string;
    public profilePicture?: string;
    public bio?: string;
    public latitude?: number;
    public longitude?: number;
    public lastActive?: Date;
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

    // Méthode pour comparer le mot de passe
    public async comparePassword(candidatePassword: string): Promise<boolean> {
        return await bcrypt.compare(candidatePassword, this.password);
    }
}

User.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        profilePicture: {
            type: DataTypes.TEXT,
        },
        bio: {
            type: DataTypes.STRING,
        },
        latitude: {
            type: DataTypes.FLOAT,
        },
        longitude: {
            type: DataTypes.FLOAT,
        },
        lastActive: {
            type: DataTypes.DATE,
        },
    },
    {
        sequelize,
        tableName: 'users',
        hooks: {
            beforeCreate: async (user: User) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user: User) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
        },
    }
);

export default User;