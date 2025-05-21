const USERS_URL = import.meta.env.VITE_USERS_URL! as string | undefined
const MESSAGES_URL = import.meta.env.VITE_MESSAGES_URL! as string | undefined
const MEDIAS_URL = import.meta.env.VITE_MEDIAS_URL! as string | undefined

console.log(USERS_URL)
console.log(MESSAGES_URL)
console.log(MEDIAS_URL)

export { USERS_URL, MESSAGES_URL, MEDIAS_URL }
