import Router from '@koa/router'
import { CafeFnContext, Command, Parser } from 'cafe-args'
import { Dates, Numbers, Strings, System } from 'cafe-utility'
import Koa from 'koa'

interface Stamp {
    batchID: string
    usable: boolean
    amount: string
    depth: number
    bucketDepth: number
    utilization: number
    batchTTL: number
}

export function registerFakeBeeCommand(parser: Parser) {
    parser.addCommand(
        new Command('fake-bee', 'Run fake Bee', {
            alias: 'f'
        })
            .withOption({
                key: 'instant-stamp',
                type: 'boolean',
                description: 'Create a stamp instantly',
                alias: 'i'
            })
            .withFn(async context => {
                runFakeBee(context)
            })
    )
}

function runFakeBee(parserContext: CafeFnContext) {
    const stamps: Stamp[] = []

    const app = new Koa()
    const router = new Router()
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
    router.post('/stamps/:amount/:depth', async (context: Koa.Context) => {
        if (!parserContext.options['instant-stamp']) {
            await System.sleepMillis(Dates.minutes(2))
        }
        const stamp = {
            batchID: Strings.randomHex(64),
            usable: true,
            amount: context.params.amount,
            depth: Numbers.parseIntOrThrow(context.params.depth),
            bucketDepth: 16,
            utilization: 0,
            batchTTL: Dates.hours(24)
        }
        stamps.push(stamp)
        context.body = stamp
    })
    app.use(router.routes())
    app.listen(1633)
    app.listen(1635)
}
