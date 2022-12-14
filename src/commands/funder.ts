import { Command, Group, Parser } from 'cafe-args'
import { Strings, System, Types } from 'cafe-utility'
import { Wallet } from 'ethers'
import { requireEnv } from '../utility'

export function registerFunderCommands(parser: Parser) {
    parser.addGroup(
        new Group('funder', 'Funder commands')
            .withCommand(
                new Command('help', 'Provide funder guidance', {
                    alias: 'h'
                }).withFn(async () => {
                    if (process.env.TESTNET_PRIVATE_KEY) {
                        console.log('✅ TESTNET_PRIVATE_KEY is set')
                    } else {
                        console.log('❌ TESTNET_PRIVATE_KEY is not set.')
                    }
                    if (process.env.TESTNET_RPC_ENDPOINT) {
                        console.log('✅ TESTNET_RPC_ENDPOINT is set')
                    } else {
                        console.log('❌ TESTNET_RPC_ENDPOINT is not set.')
                    }
                    if (process.env.NODE_FUNDER_PATH) {
                        console.log('✅ NODE_FUNDER_PATH is set')
                    } else {
                        console.log('❌ NODE_FUNDER_PATH is not set.')
                    }
                })
            )
            .withCommand(
                new Command('gift', 'Create a gift wallet').withFn(async () => {
                    const privateKey = Strings.randomHex(64)
                    const address = await privateKeyToAddress(privateKey)
                    console.log({ privateKey })
                    console.log({ address })
                    await fundWallet(address)
                })
            )
            .withCommand(
                new Command('wallet', 'Generate a new wallet')
                    .withOption({
                        key: 'github',
                        description: 'Github stdout format',
                        type: 'boolean'
                    })
                    .withFn(async context => {
                        const privateKey = Strings.randomHex(64)
                        const address = await privateKeyToAddress(privateKey)
                        if (context.options.github) {
                            console.log(`fundingPrivateKey::${privateKey}`)
                            console.log(`fundingAddress::${address}`)
                        } else {
                            console.log({ privateKey })
                            console.log({ address })
                        }
                    })
            )
            .withCommand(
                new Command('fund', 'Fund a wallet')
                    .withPositional({ key: 'address', required: true, description: 'Address to fund' })
                    .withFn(async context => {
                        await fundWallet(Types.asString(context.arguments.address))
                    })
            )
    )
}

async function fundWallet(address: string): Promise<void> {
    await System.runProcess(
        'go',
        [
            'run',
            './cmd',
            `-chainNodeEndpoint=${requireEnv('TESTNET_RPC_ENDPOINT')}`,
            `-walletKey=${requireEnv('TESTNET_PRIVATE_KEY')}`,
            '-minSwarm=0.5',
            '-minNative=0.1',
            `-addresses=${address}`
        ],
        { env: process.env, cwd: requireEnv('NODE_FUNDER_PATH') }
    )
}

async function privateKeyToAddress(privateKeyString: string): Promise<string> {
    const wallet = new Wallet(privateKeyString)
    const address = await wallet.getAddress()
    return address
}
