const STORAGE_KEY = 'upform-participant-id'
const NAME_KEY = 'upform-participant-name'
const AVATAR_SEED_KEY = 'upform-avatar-seed'

export function getParticipantId(): string {
  let id = localStorage.getItem(STORAGE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, id)
  }
  return id
}

export function getParticipantName(): string | null {
  return localStorage.getItem(NAME_KEY)
}

export function setParticipantName(name: string): void {
  localStorage.setItem(NAME_KEY, name)
}

export function getAvatarSeed(): string {
  let seed = localStorage.getItem(AVATAR_SEED_KEY)
  if (!seed) {
    seed = crypto.randomUUID()
    localStorage.setItem(AVATAR_SEED_KEY, seed)
  }
  return seed
}

export function setAvatarSeed(seed: string): void {
  localStorage.setItem(AVATAR_SEED_KEY, seed)
}

export function randomizeAvatarSeed(): string {
  const seed = crypto.randomUUID()
  localStorage.setItem(AVATAR_SEED_KEY, seed)
  return seed
}
