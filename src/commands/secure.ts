import { Command, Group, Parser } from 'cafe-args'
import { Files } from 'cafe-node-utility'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { writeFile } from 'fs/promises'
import inquirer from 'inquirer'
import { homedir } from 'os'

export function registerSecureCommands(parser: Parser) {
    parser.addGroup(
        new Group('secure', 'Secure commands')
            .withCommand(
                new Command('read', 'Print secure file', {
                    alias: 'r'
                }).withFn(async () => {
                    const { password } = await inquirer.prompt({ name: 'password', type: 'password' })
                    const key = scryptSync(password, 'salt', 24)
                    const decrypted = await decrypt(await Files.readUtf8FileAsync(`${homedir()}/secure.txt`), key)
                    console.log(decrypted)
                })
            )
            .withCommand(
                new Command('write', 'Write to secure file').withFn(async () => {
                    const { password } = await inquirer.prompt({ name: 'password', type: 'password' })
                    const key = scryptSync(password, 'salt', 24)
                    let decrypted = (await Files.existsAsync(`${homedir()}/secure.txt`))
                        ? await decrypt(await Files.readUtf8FileAsync(`${homedir()}/secure.txt`), key)
                        : ''
                    const { line } = await inquirer.prompt({ name: 'line' })
                    decrypted += `\n${line}`
                    await writeFile(`${homedir()}/secure.txt`, await encrypt(decrypted, key))
                })
            )
    )
}

async function encrypt(string: string, key: Buffer): Promise<string> {
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-192-cbc', key, iv)
    const encrypted = cipher.update(string, 'utf8', 'hex')
    return [encrypted + cipher.final('hex'), Buffer.from(iv).toString('hex')].join('|')
}

async function decrypt(hexData: string, key: Buffer): Promise<string> {
    const [encrypted, iv] = hexData.split('|')
    if (!iv) {
        throw new Error('IV not found')
    }
    const decipher = createDecipheriv('aes-192-cbc', key, Buffer.from(iv, 'hex'))
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
}
