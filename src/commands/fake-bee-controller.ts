import axios from 'axios'
import { Command, Parser } from 'cafe-args'
import { Types } from 'cafe-utility'

export function registerFakeBeeControllerCommand(parser: Parser) {
    parser.addCommand(
        new Command('fake-bee-controller', 'Control fake Bee', {
            alias: 'x'
        })
            .withPositional({
                key: 'object-path',
                description: 'Request descriptor',
                required: true
            })
            .withPositional({
                key: 'new-value',
                description: 'New value',
                required: true
            })
            .withFn(async context => {
                const objectPath = Types.asString(context.arguments['object-path'])
                const newValue = Types.asString(context.arguments['new-value'])
                const response = await axios.put(
                    'http://localhost:1633/meta/toggles',
                    JSON.stringify({
                        objectPath,
                        newValue
                    }),
                    {
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                )
                console.log(response.data)
            })
    )
}
