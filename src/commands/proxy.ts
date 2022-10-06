import { Command, Parser } from 'cafe-args'
import { Dates, System, Types } from 'cafe-utility'
import { BEE_DEBUG_API_URL } from '../constants'
import { findPostageStamp } from '../stamp'
import { requireEnv } from '../utility'

export function registerProxyCommand(parser: Parser) {
    parser.addCommand(
        new Command('proxy', 'Run gateway-proxy', {
            alias: 'p'
        })
            .withOption({
                key: 'stamp-autobuy',
                type: 'boolean',
                alias: 's',
                description: 'Enable stamp autobuying'
            })
            .withOption({
                key: 'stamp-autoextend',
                type: 'boolean',
                alias: 'S',
                description: 'Enable stamp autoextending'
            })
            .withOption({
                key: 'stamp-hardcoded',
                type: 'boolean',
                alias: 'h',
                description: 'Enable hardcoded stamp'
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
                key: 'quick',
                type: 'boolean',
                alias: 'q',
                description: 'Postage check is very frequent'
            })
            .withOption({
                key: 'preset0',
                type: 'boolean',
                alias: 'x',
                description: 'Enables all features with autobuying'
            })
            .withOption({
                key: 'preset1',
                type: 'boolean',
                alias: 'y',
                description: 'Enables all features with autoextending'
            })
            .withOption({
                key: 'preset2',
                type: 'boolean',
                alias: 'z',
                description: 'Enables all features with hardcoded stamp'
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
                const all = context.options['preset0'] || context.options['preset1'] || context.options['preset2']
                const stampAutobuy = context.options['stamp-autobuy'] || context.options.preset0
                const stampAutoextend = context.options['stamp-autoextend'] || context.options.preset1
                const stampHardcoded = context.options['stamp-hardcoded'] || context.options.preset2
                if ([stampAutobuy, stampAutoextend, stampHardcoded].filter(x => x).length > 1) {
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
                    env.BEE_DEBUG_API_URL = BEE_DEBUG_API_URL
                }
                if (stampAutoextend) {
                    env.POSTAGE_DEPTH = '22'
                    env.POSTAGE_AMOUNT = '200000'
                    env.POSTAGE_TTL_MIN = '60'
                    env.BEE_DEBUG_API_URL = BEE_DEBUG_API_URL
                    env.POSTAGE_EXTENDSTTL = 'true'
                }
                if (stampHardcoded) {
                    env.POSTAGE_STAMP = (await findPostageStamp(BEE_DEBUG_API_URL)).batchID
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
                    env.REUPLOAD_PERIOD = Dates.minutes(2).toString()
                }
                if (context.options['debug']) {
                    env.LOG_LEVEL = 'debug'
                }
                if (context.options['quick']) {
                    env.POSTAGE_REFRESH_PERIOD = Dates.seconds(2).toString()
                    if (reupload) {
                        env.REUPLOAD_PERIOD = Dates.seconds(2).toString()
                    }
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
