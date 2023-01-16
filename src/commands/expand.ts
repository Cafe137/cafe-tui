import { Command, Parser } from 'cafe-args'
import { Files } from 'cafe-node-utility'
import { Strings, Types } from 'cafe-utility'

export function registerExpandCommand(parser: Parser) {
    parser.addCommand(
        new Command('expand', 'Expand file', {
            alias: 'w'
        })
            .withPositional({
                key: 'path',
                description: 'Path to file',
                required: true
            })
            .withFn(async context => {
                const path = Types.asString(context.arguments.path)
                const lines = await Files.readLinesAsync(path)
                const expanded = lines.flatMap(Strings.expand)
                console.log(expanded.join('\n'))
            })
    )
}
