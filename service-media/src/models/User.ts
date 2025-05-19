interface User {
    id: number;
    username: string;
    email: string;
    latitude?: number;
    longitude?: number;
    lastActive?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export default User;