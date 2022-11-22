import Router from '@koa/router'
import { CafeFnContext, Command, Parser } from 'cafe-args'
import { Arrays, Dates, Logger, Numbers, Objects, Random, Strings, System, Types } from 'cafe-utility'
import chalk from 'chalk'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import { Stamp } from '../stamp'
import { Token } from '../token'

const logger = Logger.create('[Bee]')

const state = {
    chequebookBalance: Token.fromNumber(137),
    stakedBalance: Token.fromNumber(0),
    toggles: {
        readiness: true,
        deposit: true,
        withdraw: true,
        getDesktopConfiguration: true
    },
    desktopConfiguration: {
        'api-addr': '0.0.0.0:1633',
        'debug-api-addr': '127.0.0.1:1635',
        'debug-api-enable': 'true',
        'swap-enable': true,
        'swap-initial-deposit': '1000000000000000',
        mainnet: true,
        'full-node': 'false',
        'chain-enable': 'false',
        'cors-allowed-origins': '*',
        'use-postage-snapshot': 'true',
        'resolver-options': 'https://cloudflare-eth.com',
        'data-dir': '/Users/aron/Library/Application Support/Swarm Desktop/data-dir',
        password: 'Test',
        'swap-endpoint': 'http://localhost:1633',
        verbosity: 'trace',
        bootnode: '/dnsaddr/mainnet.ethswarm.org'
    }
}

export function registerFakeBeeCommand(parser: Parser) {
    parser.addCommand(
        new Command('fake-bee', 'Run fake Bee', {
            alias: 'f'
        })
            .withOption({
                key: 'purge',
                type: 'boolean',
                alias: 'p',
                description: 'Purge stamps every minute'
            })
            .withOption({
                key: 'expire',
                type: 'boolean',
                description: 'Display close expiration for stamps',
                alias: 'e'
            })
            .withOption({
                key: 'full',
                type: 'boolean',
                description: 'Display high usage for stamps',
                alias: 'f'
            })
            .withOption({
                key: 'instant-stamp',
                type: 'boolean',
                description: 'Create stamps instantly',
                alias: 'i',
                conflicts: 'stuck-stamp'
            })
            .withOption({
                key: 'instant-usable',
                type: 'boolean',
                description: 'Stamps are usable instantly',
                alias: 'I'
            })
            .withOption({
                key: 'stuck-stamp',
                type: 'boolean',
                description: 'Never complete stamp buy',
                alias: 's',
                conflicts: 'instant-stamp'
            })
            .withOption({
                key: 'buggy-stamp',
                type: 'boolean',
                description: 'Stamps 404 when buying',
                alias: 'b'
            })
            .withOption({
                key: 'initial-stamp',
                alias: 'S',
                description: 'Create initial stamp',
                type: 'boolean'
            })
            .withOption({
                key: 'never-usable',
                type: 'boolean',
                description: 'Stamps never become usable',
                alias: 'n'
            })
            .withOption({
                key: 'detect-overpurchase',
                type: 'boolean',
                description: 'Detect postage overpurchase',
                alias: 'd'
            })
            .withOption({
                key: 'on-off',
                type: 'boolean',
                description: 'Turn server on/off periodically',
                alias: 'o'
            })
            .withOption({
                key: 'chaos',
                type: 'number',
                description: '100 = all requests fail, 0 = no fail, 50 = 50% fail',
                minimum: 0,
                maximum: 100,
                default: 0,
                alias: 'c'
            })
            .withOption({
                key: 'throttling',
                type: 'number',
                description: 'Maximum delay in milliseconds',
                minimum: 0,
                default: 0,
                alias: 't'
            })
            .withOption({
                key: 'long-operations',
                type: 'boolean',
                description: 'Topup and dilute take longer',
                alias: 'l'
            })
            .withOption({
                key: 'desktop',
                type: 'boolean',
                default: true,
                description: 'Mock desktop API',
                alias: 'D'
            })
            .withFn(async context => {
                runFakeBee(context)
            })
    )
}

function runFakeBee(parserContext: CafeFnContext) {
    function createStamp(amount: unknown, depth: unknown): Stamp {
        return {
            batchID: Strings.randomHex(64),
            exists: true,
            usable: !parserContext.options['never-usable'],
            amount: Types.asString(amount),
            depth: Numbers.parseIntOrThrow(depth),
            bucketDepth: 16,
            utilization: parserContext.options.full ? 62 : 0,
            batchTTL: parserContext.options.expire ? 1 : Dates.hours(24),
            validFrom: parserContext.options['instant-usable'] ? Date.now() : Date.now() + Dates.seconds(40)
        }
    }

    let purchaseCounter = 0
    const stamps: Stamp[] = parserContext.options['initial-stamp'] ? [createStamp('200500', 22)] : []

    if (parserContext.options['purge']) {
        setInterval(() => {
            logger.info('♻️  Purging stamps ♻️')
            purchaseCounter = 0
            Arrays.empty(stamps)
        }, Dates.seconds(90))
    }

    const app = new Koa()
    app.use(bodyParser())
    app.use(async (context, next) => {
        context.set('Access-Control-Allow-Origin', '*')
        context.set('Access-Control-Allow-Credentials', 'true')
        context.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, swarm-postage-batch-id, swarm-collection, swarm-index-document'
        )
        context.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, PATCH, OPTIONS')
        await next()
    })
    app.use(async (context, next) => {
        if (context.request.method === 'GET') {
            logger.info(`${chalk.bgWhite.black(` ${context.request.method} `)} ${context.request.url}`)
        } else if (context.request.method === 'POST') {
            if (context.request.url === '/' && context.request.body && context.request.body.method) {
                logger.info(`${chalk.bgGreen.black(` ${context.request.method} `)} rpc:${context.request.body.method}`)
            } else {
                logger.info(`${chalk.bgGreen.black(` ${context.request.method} `)} ${chalk.green(context.request.url)}`)
            }
        } else if (context.request.method === 'PATCH') {
            logger.info(`${chalk.bgBlue.black(` ${context.request.method} `)} ${chalk.blue(context.request.url)}`)
        } else if (context.request.method === 'PUT') {
            logger.info(
                `${chalk.bgYellowBright.black(` ${context.request.method} `)} ${chalk.blue(context.request.url)}`
            )
        } else {
            logger.info(`${context.request.method} ${context.request.url}`)
        }
        await next()
    })
    if (parserContext.options['on-off']) {
        let healthy = true
        setInterval(() => {
            if (healthy && Random.chance(0.33)) {
                healthy = false
                logger.info(chalk.bgCyanBright.black(' Server is unhealthy from now on '))
            } else if (!healthy) {
                healthy = true
                logger.info(chalk.bgCyanBright.black(' Server is healthy from now on '))
            }
        }, Dates.seconds(20))
        app.use(async (context, next) => {
            if (!healthy) {
                context.status = 503
                context.body = 'Service Unavailable'
                return
            }
            await next()
        })
    }
    if (parserContext.options.throttling) {
        app.use(async (_, next) => {
            await System.sleepMillis(Random.inclusiveInt(0, Types.asNumber(parserContext.options.throttling) / 2))
            await next()
        })
    }
    if (parserContext.options.chaos) {
        app.use(async (context, next) => {
            if (Random.chance(Types.asNumber(parserContext.options.chaos) / 100)) {
                context.status = 500
                context.body = 'Internal Server Error'
            } else {
                await next()
            }
        })
    }
    const router = new Router()
    router.options('/(.*)', (context: Koa.Context) => {
        context.body = 'OK'
    })
    router.get('/', (context: Koa.Context) => {
        context.body = 'Ethereum Swarm Bee'
    })
    router.put('/meta/toggles', (context: Koa.Context) => {
        const body = Types.asObject(context.request.body)
        const objectPath = Types.asString(body.objectPath)
        const newValue =
            body.newValue === 'true' ? true : body.newValue === 'false' ? false : Types.asString(body.newValue)
        Objects.setDeep(state, objectPath, newValue)
        context.body = state
    })
    router.post('/', (context: Koa.Context) => {
        const { id, method } = Types.asObject(context.request.body)
        if (method === 'eth_chainId') {
            context.body = {
                jsonrpc: '2.0',
                id,
                result: '0x64'
            }
        } else if (method === 'net_version') {
            context.body = {
                jsonrpc: '2.0',
                id,
                result: '1'
            }
        } else if (method === 'eth_call') {
            context.body = {
                jsonrpc: '2.0',
                id,
                result: '0x00000000000000000000000000000000000000000000014a314d9ff9b20b9800'
            }
        } else if (method === 'eth_getBalance') {
            context.body = {
                jsonrpc: '2.0',
                id,
                result: '0x0c1a2fe84e3113d7b'
            }
        }
    })
    if (parserContext.options.desktop) {
        router.get('/info', (context: Koa.Context) => {
            context.body = {
                name: 'bee-desktop',
                version: '1.9.0',
                autoUpdateEnabled: false
            }
        })
        router.get('/price', (context: Koa.Context) => {
            context.body = 0.45634
        })
        router.get('/config', (context: Koa.Context) => {
            if (!state.toggles.getDesktopConfiguration) {
                context.status = 500
            }
            context.body = state.desktopConfiguration
        })
        router.post('/swap', (context: Koa.Context) => {
            context.body = 'OK'
        })
    }
    router.get('/health', (context: Koa.Context) => {
        context.body = {
            status: 'ok',
            version: '1.9.0',
            apiVersion: '1.0.0',
            debugApiVersion: '1.0.0'
        }
    })
    router.get('/readiness', (context: Koa.Context) => {
        context.status = state.toggles.readiness ? 200 : 500
        context.body = { status: state.toggles.readiness }
    })
    router.get('/node', (context: Koa.Context) => {
        context.body = {
            beeMode: 'light',
            gatewayMode: true,
            chequebookEnabled: true,
            swapEnabled: true
        }
    })
    router.get('/balances', (context: Koa.Context) => {
        context.body = { balances: [] }
    })
    router.get('/settlements', (context: Koa.Context) => {
        context.body = {
            totalReceived: 0,
            totalSent: 0,
            settlements: []
        }
    })
    router.get('/wallet', (context: Koa.Context) => {
        context.body = {
            bzz: '1000000000000000000',
            xDai: '1000000000000000000',
            chainID: 0,
            contractAddress: '36b7efd913ca4cf880b8eeac5093fa27b0825906'
        }
    })
    router.get('/peers', (context: Koa.Context) => {
        context.body = {
            peers: [
                {
                    address: '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f'
                }
            ]
        }
    })
    router.get('/chequebook/address', (context: Koa.Context) => {
        context.body = {
            chequebookAddress: '36b7efd913ca4cf880b8eeac5093fa27b0825906'
        }
    })
    router.get('/chequebook/cheque', (context: Koa.Context) => {
        context.body = {
            lastcheques: []
        }
    })
    router.get('/chequebook/balance', (context: Koa.Context) => {
        context.body = {
            totalBalance: state.chequebookBalance.toString(),
            availableBalance: state.chequebookBalance.toString()
        }
    })
    router.post('/chequebook/deposit', (context: Koa.Context) => {
        if (!state.toggles.deposit) {
            context.status = 500
            return
        }
        const amount = Token.fromString(Types.asString(context.request.query.amount))
        state.chequebookBalance = state.chequebookBalance.plusToken(amount)
        context.body = { transactionHash: Strings.randomHex(64) }
    })
    router.post('/chequebook/withdraw', (context: Koa.Context) => {
        if (!state.toggles.withdraw) {
            context.status = 500
            return
        }
        const amount = Token.fromString(Types.asString(context.request.query.amount))
        state.chequebookBalance = state.chequebookBalance.minusToken(amount)
        context.body = { transactionHash: Strings.randomHex(64) }
    })
    router.get('/stake', (context: Koa.Context) => {
        context.body = { stakedAmount: state.stakedBalance.toString() }
    })
    router.post('/stake/deposit/:amount', (context: Koa.Context) => {
        const amount = Token.fromString(Types.asString(context.params.amount))
        state.stakedBalance = state.stakedBalance.plusToken(amount)
        context.body = { stakedAmount: state.stakedBalance.toString() }
    })
    router.get('/topology', (context: Koa.Context) => {
        context.body = {
            baseAddr: '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f',
            population: 1000,
            connected: 100,
            timestamp: 'string',
            nnLowWatermark: 0,
            depth: 6
        }
    })
    router.get('/chainstate', (context: Koa.Context) => {
        context.body = {
            chainTip: 0,
            block: 0,
            totalAmount: '1000000000000000000',
            currentPrice: '1000000000000000000'
        }
    })
    router.get('/addresses', (context: Koa.Context) => {
        context.body = {
            overlay: '36b7efd913ca4cf880b8eeac5093fa27b0825906c600685b6abdd6566e6cfe8f',
            underlay: ['/ip4/127.0.0.1/tcp/1634/p2p/16Uiu2HAmTm17toLDaPYzRyjKn27iCB76yjKnJ5DjQXneFmifFvaX'],
            ethereum: '36b7efd913ca4cf880b8eeac5093fa27b0825906',
            publicKey: '02ab7473879005929d10ce7d4f626412dad9fe56b0a6622038931d26bd79abf0a4',
            pssPublicKey: '02ab7473879005929d10ce7d4f626412dad9fe56b0a6622038931d26bd79abf0a4'
        }
    })
    router.get('/pins', (context: Koa.Context) => {
        context.body = {
            references: Arrays.pickWeighted(
                [[], [Strings.randomHex(64)], [Strings.randomHex(64), Strings.randomHex(64)]],
                [3, 1, 1]
            )
        }
    })
    router.get('/stewardship/:reference', (context: Koa.Context) => {
        context.body = {
            isRetrievable: Random.chance(0.5)
        }
    })
    router.put('/stewardship/:reference', (context: Koa.Context) => {
        context.body = 'OK'
    })
    router.get('/stamps', (context: Koa.Context) => {
        context.body = { stamps: stamps.map(mapStamp) }
    })
    router.get('/stamps/:id', (context: Koa.Context) => {
        const stamp = stamps.find(stamp => stamp.batchID === context.params.id)
        if (!stamp) {
            context.status = 404
            context.body = 'Not Found'
            return
        }
        if (parserContext.options['buggy-stamp'] && stamp.validFrom && stamp.validFrom > Date.now()) {
            context.status = 404
            context.body = 'Not Found'
            return
        }
        context.body = mapStamp(stamp)
    })
    router.post('/chunks', (context: Koa.Context) => {
        context.body = { reference: Strings.randomHex(64) }
    })
    router.post('/bytes', (context: Koa.Context) => {
        context.set('swarm-tag', '42')
        context.body = { reference: Strings.randomHex(64) }
    })
    router.post('/bzz', (context: Koa.Context) => {
        context.set('swarm-tag', '42')
        context.body = { reference: Strings.randomHex(64) }
    })
    router.patch('/stamps/topup/:id/:amount', async (context: Koa.Context) => {
        if (parserContext.options['long-operations']) {
            await System.sleepMillis(Dates.seconds(20))
        }
        context.body = { batchID: context.params.id }
    })
    router.patch('/stamps/dilute/:id/:depth', async (context: Koa.Context) => {
        if (parserContext.options['long-operations']) {
            await System.sleepMillis(Dates.seconds(20))
        }
        context.body = { batchID: context.params.id }
    })
    router.post('/stamps/:amount/:depth', async (context: Koa.Context) => {
        if (parserContext.options['detect-overpurchase'] && (stamps.length > 0 || purchaseCounter > 0)) {
            logger.warn('⚠️  Detected postage overpurchase ⚠️')
        }
        purchaseCounter++
        if (parserContext.options['stuck-stamp']) {
            await System.sleepMillis(Dates.hours(100))
        }
        if (!parserContext.options['instant-stamp']) {
            await System.sleepMillis(Dates.seconds(20))
        }
        const stamp = createStamp(context.params.amount, context.params.depth)
        stamps.push(stamp)
        context.body = stamp
    })
    app.use(router.routes())
    if (parserContext.options.throttling) {
        app.use(async (_, next) => {
            await System.sleepMillis(Random.inclusiveInt(0, Types.asNumber(parserContext.options.throttling) / 2))
            await next()
        })
    }
    app.listen(1633)
    app.listen(1635)
    app.listen(11633)
    app.listen(11635)
    if (parserContext.options.desktop) {
        app.listen(3054)
    }
}

function mapStamp(stamp: Stamp): Stamp {
    if (stamp.validFrom) {
        stamp.usable = Date.now() > stamp.validFrom
    }
    return stamp
}
