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
                key: 'dry-run',
                type: 'boolean',
                alias: 'D',
                description: 'Print env and exit'
            })
            .withOption({
                key: 'autobuy',
                type: 'boolean',
                alias: 'a',
                description: 'Enable stamp purchase'
            })
            .withOption({
                key: 'topup',
                type: 'boolean',
                alias: 't',
                description: 'Enable stamp topup'
            })
            .withOption({
                key: 'dilute',
                type: 'boolean',
                alias: 'S',
                description: 'Enable stamp dilution'
            })
            .withOption({
                key: 'hardcoded',
                type: 'boolean',
                alias: 'h',
                description: 'Enable hardcoded stamp'
            })
            .withOption({
                key: 'hostname',
                alias: 'H',
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
                description: 'Enables all features with autobuy'
            })
            .withOption({
                key: 'preset1',
                type: 'boolean',
                description: 'Enables all features with topup'
            })
            .withOption({
                key: 'preset2',
                type: 'boolean',
                description: 'Enables all features with dilute'
            })
            .withOption({
                key: 'preset3',
                type: 'boolean',
                description: 'Enables all features with hardcoded'
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
                const autobuy = context.options['autobuy'] || context.options.preset0
                const topup = context.options['topup'] || context.options.preset1
                const dilute = context.options['dilute'] || context.options.preset2
                const hardcoded = context.options['hardcoded'] || context.options.preset3
                if ([autobuy, topup, hardcoded, dilute].filter(x => x).length > 1) {
                    throw Error('Exclusive options: autobuy, topup, hardcoded, dilute')
                }
                const ens = context.options['ens'] || all
                const cid = context.options['cid'] || all
                const reupload = context.options['reupload'] || all
                const debug = context.options['debug'] || all
                const quick = context.options['quick'] || all
                const env: Record<string, string> = {
                    PATH: Types.asString(process.env.PATH),
                    EXPOSE_HASHED_IDENTITY: 'true'
                }
                if (autobuy) {
                    env.POSTAGE_DEPTH = '22'
                    env.POSTAGE_AMOUNT = '200000'
                    env.BEE_DEBUG_API_URL = BEE_DEBUG_API_URL
                }
                if (topup) {
                    env.POSTAGE_DEPTH = '22'
                    env.POSTAGE_AMOUNT = '200000'
                    env.POSTAGE_TTL_MIN = '60'
                    env.BEE_DEBUG_API_URL = BEE_DEBUG_API_URL
                    env.POSTAGE_EXTENDSTTL = 'true'
                }
                if (dilute) {
                    env.BEE_DEBUG_API_URL = BEE_DEBUG_API_URL
                    env.POSTAGE_EXTENDS_CAPACITY = 'true'
                }
                if (hardcoded) {
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
                if (debug) {
                    env.LOG_LEVEL = 'debug'
                }
                if (quick) {
                    env.POSTAGE_REFRESH_PERIOD = Dates.seconds(2).toString()
                    if (reupload) {
                        env.REUPLOAD_PERIOD = Dates.seconds(2).toString()
                    }
                }
                console.log(env)
                if (context.options['dry-run']) {
                    return
                }
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
