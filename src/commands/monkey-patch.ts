import { Command, Parser } from 'cafe-args'
import { Files } from 'cafe-node-utility'
import { Types } from 'cafe-utility'
import { writeFile } from 'fs/promises'

export function registerMonkeyPatchCommand(parser: Parser) {
    parser.addCommand(
        new Command('monkey-patch', 'Replace text in path', {
            alias: 'm'
        })
            .withPositional({
                key: 'path',
                description: 'Path to file',
                required: true
            })
            .withPositional({
                key: 'search',
                description: 'Text to search for',
                required: true
            })
            .withPositional({
                key: 'replacement',
                description: 'Text to replace with',
                required: true
            })
            .withFn(async context => {
                await monkeyPatch(
                    Types.asString(context.arguments.path),
                    Types.asString(context.arguments.search),
                    Types.asString(context.arguments.replacement)
                )
            })
    )
}

async function monkeyPatch(path: string, search: string, replacement: string): Promise<void> {
    const content = await Files.readUtf8FileAsync(path)
    const newContent = content.replace(search, replacement)
    await writeFile(path, newContent)
}
