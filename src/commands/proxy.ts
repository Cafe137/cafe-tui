import { Command, Parser } from 'cafe-args'
import { Dates, System, Types } from 'cafe-utility'
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
            .withOption({
                key: 'hostname',
                alias: 'h',
                description: 'Hostname of the proxy, required for Bzz.link',
                default: 'bzz-link.local'
            })
            .withOption({
                key: 'cid',
                type: 'boolean',
                alias: 'c',
                description: 'Enables CID support'
            })
            .withOption({
                key: 'ens',
                type: 'boolean',
                alias: 'e',
                description: 'Enables ENS support'
            })
            .withOption({
                key: 'reupload',
                type: 'boolean',
                alias: 'r',
                description: 'Enables periodical content reupload'
            })
            .withOption({
                key: 'reupload-interval-ms',
                type: 'number',
                alias: 'i',
                description: 'Reupload interval in milliseconds',
                default: Dates.minutes(2)
            })
            .withOption({
                key: 'all',
                type: 'boolean',
                alias: 'a',
                description: 'Enables all features'
            })
            .withOption({
                key: 'debug',
                type: 'boolean',
                alias: 'd',
                description: 'Enables debug log level'
            })
            .withFn(async context => {
                const location = requireEnv('CAFE_CLI_PROJECT_PROXY')
                const hostname = context.options['hostname']
                const ens = context.options['ens'] || context.options['all']
                const cid = context.options['cid'] || context.options['all']
                const reupload = context.options['reupload'] || context.options['all']
                const stampManagement = context.options['stamp-management'] || context.options['all']
                const env: Record<string, string> = { PATH: Types.asString(process.env.PATH) }
                if (stampManagement) {
                    env.POSTAGE_DEPTH = '22'
                    env.POSTAGE_AMOUNT = '200000'
                    env.BEE_DEBUG_API_URL = 'http://localhost:1635'
                }
                if (hostname) {
                    env.HOSTNAME = Types.asString(hostname)
                }
                if (ens) {
                    env.ENS_SUBDOMAINS = 'true'
                }
                if (cid) {
                    env.CID_SUBDOMAINS = 'true'
                }
                if (reupload) {
                    env.REUPLOAD_PERIOD = Types.asNumber(context.options['reupload-interval-ms']).toString()
                }
                if (context.options['debug']) {
                    env.LOG_LEVEL = 'debug'
                }
                console.log('Starting with env:', env)
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
