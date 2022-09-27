#!/usr/bin/env node

import { createParser } from 'cafe-args'
import { Types } from 'cafe-utility'
import { exit } from 'process'
import { registerBeeCommand } from './commands/bee'
import { registerJestCommand } from './commands/jest'
import { registerProjectCommand } from './commands/project'
import { registerProxyCommand } from './commands/proxy'

async function main() {
    const parser = createParser({
        application: {
            name: 'Cafe TUI',
            description: 'Dev productivity things and stuff',
            version: 'alpha',
            command: 'cafe-tui'
        }
    })
    registerBeeCommand(parser)
    registerJestCommand(parser)
    registerProxyCommand(parser)
    registerProjectCommand(parser)
    const result = await parser.parse(process.argv.slice(2))
    if (Types.isString(result)) {
        console.error(result)
        exit(1)
    }
    if (Types.isFunction(result.command.fn)) {
        await result.command.fn(result).catch(x => {
            console.error(x.message)
            exit(1)
        })
    }
}

main()
