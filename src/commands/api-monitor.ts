import axios from 'axios'
import { Command, Parser } from 'cafe-args'
import { Arrays, Files, Objects, System } from 'cafe-utility'

const endpoints = [
    'http://localhost:1635/health',
    'http://localhost:1635/readiness',
    'http://localhost:1635/addresses',
    'http://localhost:1635/chequebook/address',
    'http://localhost:1635/chequebook/balance',
    'http://localhost:1635/reservestate',
    'http://localhost:1635/chainstate',
    'http://localhost:1635/node',
    'http://localhost:1635/wallet',
    'http://localhost:1635/transactions',
    'http://localhost:1635/stamps'
]

interface Item {
    delta: number
    data: unknown
}

export function registerApiMonitorCommand(parser: Parser) {
    parser.addCommand(
        new Command('api-monitor', 'Monitor Bee startup', {
            alias: 'a'
        }).withFn(async () => {
            const startedAt = Date.now()
            const responses: Record<string, Item[]> = {}
            for (let i = 0; i < 150; i++) {
                for (const endpoint of endpoints) {
                    runCheck(endpoint, responses, startedAt)
                }
                console.log(i)
                await System.sleepMillis(190)
            }
            for (const key of Object.keys(responses)) {
                for (let i = responses[key].length - 1; i >= 1; i--) {
                    const current = responses[key][i]
                    const previous = responses[key][i - 1]
                    if (Objects.deepEquals(current.data, previous.data)) {
                        responses[key].splice(i, 1)
                    }
                }
            }
            await Files.writeJsonAsync('api-monitor.json', responses, true)
        })
    )
}

async function runCheck(endpoint: string, responses: Record<string, Item[]>, startedAt: number): Promise<void> {
    try {
        Arrays.pushToBucket(responses, endpoint, {
            delta: Date.now() - startedAt,
            data: await (await axios.get(endpoint)).data
        })
    } catch {
        Arrays.pushToBucket(responses, endpoint, { delta: Date.now() - startedAt, data: 'failure' })
    }
}
