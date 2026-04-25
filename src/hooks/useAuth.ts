import { authClient } from '@/lib'

export const useAuth = () => authClient.useSession()
