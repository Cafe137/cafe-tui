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
            usable: !parserContext.options['never-usable'],
            amount: Types.asString(amount),
            depth: Numbers.parseIntOrThrow(depth),
            bucketDepth: 16,
            utilization: 0,
            batchTTL: parserContext.options.expire ? 1 : Dates.hours(24)
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
        if (context.request.method === 'GET') {
            logger.info(`${chalk.bgWhite.black(` ${context.request.method} `)} ${context.request.url}`)
        } else if (context.request.method === 'POST') {
            logger.info(`${chalk.bgGreen.black(` ${context.request.method} `)} ${chalk.green(context.request.url)}`)
        } else if (context.request.method === 'PATCH') {
            logger.info(`${chalk.bgBlue.black(` ${context.request.method} `)} ${chalk.blue(context.request.url)}`)
        } else {
            logger.info(`${context.request.method} ${context.request.url}`)
        }
        await next()
    })
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
    router.get('/health', (context: Koa.Context) => {
        context.body = { status: 'ok' }
    })
    router.get('/addresses', (context: Koa.Context) => {
        context.body = { overlay: Strings.randomHex(64) }
    })
    router.get('/pins', (context: Koa.Context) => {
        context.body = { references: [] }
    })
    router.get('/stamps', (context: Koa.Context) => {
        context.body = { stamps }
    })
    router.get('/stamps/:id', (context: Koa.Context) => {
        context.body = stamps.find(stamp => stamp.batchID === context.params.id)
    })
    router.post('/chunks', (context: Koa.Context) => {
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
