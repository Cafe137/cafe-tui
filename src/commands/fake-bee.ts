import Router from '@koa/router'
import { CafeFnContext, Command, Parser } from 'cafe-args'
import { Arrays, Dates, Logger, Numbers, Random, Strings, System, Types } from 'cafe-utility'
import chalk from 'chalk'
import Koa from 'koa'
import { Stamp } from '../stamp'

const logger = Logger.create('[Bee]')

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
                key: 'instant-stamp',
                type: 'boolean',
                description: 'Create stamps instantly',
                alias: 'i',
                conflicts: 'stuck-stamp'
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
            utilization: 0,
            batchTTL: parserContext.options.expire ? 1 : Dates.hours(24),
            validFrom: Date.now() + Dates.seconds(40)
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
    app.use(async (context, next) => {
        context.set('Access-Control-Allow-Origin', '*')
        context.set('Access-Control-Allow-Credentials', 'true')
        context.set(
            'Access-Control-Allow-Headers',
            'Content-Type, Content-Length, Authorization, Accept, X-Requested-With, swarm-postage-batch-id'
        )
        context.set('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, PATCH, OPTIONS')
        await next()
    })
    app.use(async (context, next) => {
        if (context.request.method === 'GET') {
            logger.info(`${chalk.bgWhite.black(` ${context.request.method} `)} ${context.request.url}`)
        } else if (context.request.method === 'POST') {
            logger.info(`${chalk.bgGreen.black(` ${context.request.method} `)} ${chalk.green(context.request.url)}`)
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
    router.get('/health', (context: Koa.Context) => {
        context.body = {
            status: 'ok',
            version: '1.9.0',
            apiVersion: '1.0.0',
            debugApiVersion: '1.0.0'
        }
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
            totalBalance: '1000000000000000000',
            availableBalance: '1000000000000000000'
        }
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
        context.body = { overlay: Strings.randomHex(64) }
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
}

function mapStamp(stamp: Stamp): Stamp {
    if (stamp.validFrom) {
        stamp.usable = Date.now() > stamp.validFrom
    }
    return stamp
}
