import axios from 'axios'
import { Command, Parser } from 'cafe-args'
import { Dates, System } from 'cafe-utility'

export function registerAwaitPortCommand(parser: Parser) {
    parser.addCommand(
        new Command('await-port', 'Wait until a port listens')
            .withPositional({
                key: 'port',
                description: 'Port number',
                type: 'number',
                required: true
            })
            .withFn(async context => {
                const result = await System.waitFor(
                    async () => {
                        try {
                            await axios.get(`http://localhost:${context.arguments.port}`)
                            return true
                        } catch (error) {
                            return false
                        }
                    },
                    Dates.seconds(1),
                    600
                )
                if (!result) {
                    throw Error('Port never listened')
                }
            })
    )
}
