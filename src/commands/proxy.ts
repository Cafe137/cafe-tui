import { Command, Parser } from 'cafe-args'
import { Dates, System, Types } from 'cafe-utility'
import { requireEnv } from '../utility'

export function registerProxyCommand(parser: Parser) {
    parser.addCommand(
        new Command('proxy', 'Run gateway-proxy', {
            alias: 'p'
        })
            .withOption({
                key: 'stamp-autobuy',
                type: 'boolean',
                alias: 'b',
                description: 'Enable stamp autobuying'
            })
            .withOption({
                key: 'stamp-autoextend',
                type: 'boolean',
                alias: 'x',
                description: 'Enable stamp autoextending'
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
                key: 'preset0',
                type: 'boolean',
                alias: 'p',
                description: 'Enables all features with autobuying'
            })
            .withOption({
                key: 'preset1',
                type: 'boolean',
                alias: 'P',
                description: 'Enables all features with autoextending'
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
                const all = context.options['preset0'] || context.options['preset1']
                const stampAutobuy = context.options['stamp-autobuy'] || context.options.preset0
                const stampAutoextend = context.options['stamp-autoextend'] || context.options.preset1
                if (stampAutoextend && stampAutobuy) {
                    throw Error('Cannot enable both stamp autobuy and autoextend')
                }
                const ens = context.options['ens'] || all
                const cid = context.options['cid'] || all
                const reupload = context.options['reupload'] || all
                const env: Record<string, string> = {
                    PATH: Types.asString(process.env.PATH),
                    EXPOSE_HASHED_IDENTITY: 'true'
                }
                if (stampAutobuy) {
                    env.POSTAGE_DEPTH = '22'
                    env.POSTAGE_AMOUNT = '200000'
                    env.BEE_DEBUG_API_URL = 'http://localhost:1635'
                }
                if (stampAutoextend) {
                    env.POSTAGE_DEPTH = '22'
                    env.POSTAGE_AMOUNT = '200000'
                    env.POSTAGE_TTL_MIN = '60'
                    env.BEE_DEBUG_API_URL = 'http://localhost:1635'
                    env.POSTAGE_EXTENDSTTL = 'true'
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
