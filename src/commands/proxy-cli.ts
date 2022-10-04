import axios from 'axios'
import { Command, Parser, tokenize } from 'cafe-args'
import { System } from 'cafe-utility'

const PROXY_URL = 'http://localhost:3000'

export function registerProxyCliCommand(parser: Parser) {
    parser.addCommand(
        new Command('proxy-cli', 'Execute Swarm-CLI on Gateway Proxy', {
            alias: 'c'
        })
            .withPositional({
                key: 'command',
                description: 'Swarm-CLI command to execute',
                required: true
            })
            .withOption({
                key: 'readiness',
                description: 'Check proxy to be ready',
                type: 'boolean',
                alias: 'r',
                default: true
            })
            .withFn(async context => {
                if (context.options.readiness) {
                    const response = await axios.get(`${PROXY_URL}/readiness`)
                    if (response.data !== 'OK') {
                        throw Error('Gateway Proxy is not ready')
                    }
                }
                const { argv } = tokenize(context.arguments.command as string, 0)
                const isUploadCommand = argv[0] === 'upload' || argv[0] === 'feed'
                argv.push('--bee-api-url')
                argv.push(PROXY_URL)
                if (isUploadCommand) {
                    argv.push('--stamp')
                    argv.push('00'.repeat(32))
                }
                await System.runProcess(
                    'swarm-cli',
                    argv,
                    {},
                    x => process.stdout.write(x.toString()),
                    x => process.stderr.write(x.toString())
                )
            })
    )
}
