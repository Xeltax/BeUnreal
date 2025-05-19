import * as yup from 'yup';

export const loginSchema = yup.object().shape({
    email: yup
        .string()
        .email('Veuillez entrer une adresse email valide')
        .required('L\'email est requis'),
    password: yup
        .string()
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
        .required('Le mot de passe est requis'),
});

export const registerSchema = yup.object().shape({
    username: yup
        .string()
        .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
        .max(30, 'Le nom d\'utilisateur ne doit pas dépasser 30 caractères')
        .required('Le nom d\'utilisateur est requis'),
    email: yup
        .string()
        .email('Veuillez entrer une adresse email valide')
        .required('L\'email est requis'),
    password: yup
        .string()
        .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
        .required('Le mot de passe est requis'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Les mots de passe ne correspondent pas')
        .required('La confirmation du mot de passe est requise'),
});

export const profileUpdateSchema = yup.object().shape({
    username: yup
        .string()
        .min(3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères')
        .max(30, 'Le nom d\'utilisateur ne doit pas dépasser 30 caractères'),
    email: yup
        .string()
        .email('Veuillez entrer une adresse email valide'),
    bio: yup
        .string()
        .max(200, 'La bio ne doit pas dépasser 200 caractères'),
});

export const createGroupSchema = yup.object().shape({
    name: yup
        .string()
        .min(3, 'Le nom du groupe doit contenir au moins 3 caractères')
        .max(50, 'Le nom du groupe ne doit pas dépasser 50 caractères')
        .required('Le nom du groupe est requis'),
    userIds: yup
        .array()
        .of(yup.number())
        .min(1, 'Vous devez sélectionner au moins une personne')
        .required('Veuillez sélectionner des participants'),
});

export const messageSchema = yup.object().shape({
    content: yup
        .string()
        .required('Le message ne peut pas être vide'),
});