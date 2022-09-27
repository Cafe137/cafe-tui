import { Command, Parser } from 'cafe-args'
import { System } from 'cafe-utility'
import { requireEnv } from '../utility'

export function registerProxyCommand(parser: Parser) {
    parser.addCommand(
        new Command('proxy', 'Run gateway-proxy', {
            alias: 'p'
        })
            .withOption({
                key: 'stamp-management',
                type: 'boolean',
                alias: 's',
                description: 'Enable stamp autobuying'
            })
            .withFn(async context => {
                const location = requireEnv('CAFE_CLI_PROJECT_PROXY')
                const env = context.options['stamp-management']
                    ? {
                          ...process.env,
                          BEE_DEBUG_API_URL: 'http://localhost:1635',
                          POSTAGE_DEPTH: '22',
                          POSTAGE_AMOUNT: '200000'
                      }
                    : process.env
                System.runProcess(
                    'npm',
                    ['start'],
                    { cwd: location, env },
                    x => process.stdout.write(x.toString()),
                    x => process.stderr.write(x.toString())
                )
            })
    )
}
