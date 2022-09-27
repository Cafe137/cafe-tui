export function requireEnv(key: string): string {
    const value = process.env[key]
    if (!value) {
        throw Error(`Environment variable ${key} is not set`)
    }
    return value
}
