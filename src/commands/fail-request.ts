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
                if (descriptor === 'deposit') {
                    await axios.post(
                        'http://localhost:1633/meta',
                        JSON.stringify({ method: 'POST', url: '/chequebook/deposit' }),
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    )
                }
                if (descriptor === 'withdraw') {
                    await axios.post(
                        'http://localhost:1633/meta',
                        JSON.stringify({ method: 'POST', url: '/chequebook/withdraw' }),
                        {
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        }
                    )
                }
            })
    )
}
