import axios from 'axios'
import { Command, Parser } from 'cafe-args'

export function registerFailRequestCommand(parser: Parser) {
    parser.addCommand(
        new Command('fail-request', 'Make next request fail', {
            alias: 'x'
        })
            .withPositional({
                key: 'descriptor',
                description: 'Request descriptor',
                required: true
            })
            .withFn(async context => {
                const descriptor = context.arguments.descriptor
                if (descriptor === 'ready') {
                    await postJson('http://localhost:1633/meta/readiness', { ready: true })
                }
                if (descriptor === 'unready') {
                    await postJson('http://localhost:1633/meta/readiness', { ready: false })
                }
                if (descriptor === 'deposit') {
                    await postJson('http://localhost:1633/meta', { method: 'POST', url: '/chequebook/deposit' })
                }
                if (descriptor === 'withdraw') {
                    await postJson('http://localhost:1633/meta', { method: 'POST', url: '/chequebook/withdraw' })
                }
            })
    )
}

async function postJson(url: string, body: Record<string, unknown>): Promise<void> {
    await axios.post(url, JSON.stringify(body), {
        headers: {
            'Content-Type': 'application/json'
        }
    })
}
