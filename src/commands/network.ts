import { Command, Parser } from 'cafe-args'
import { join } from 'path'
import { requireEnv } from '../utility'
import { patchConfigYaml } from '../yaml'

export function registerNetworkCommand(parser: Parser) {
    parser.addCommand(
        new Command('network', 'Switch bee network', {
            alias: 'n'
        })
            .withOption({
                key: 'mainnet',
                type: 'boolean',
                description: 'Switch to mainnet',
                required: true,
                conflicts: 'testnet'
            })
            .withOption({
                key: 'testnet',
                type: 'boolean',
                description: 'Switch to testnet',
                required: true,
                conflicts: 'mainnet'
            })
            .withFn(async context => {
                const location = requireEnv('CAFE_CLI_PROJECT_DESKTOP')
                const goerliEnsResolver = requireEnv('CAFE_CLI_GOERLI_ENS_RESOLVER')
                const patch = context.options.testnet
                    ? {
                          mainnet: false,
                          'data-dir': join(location, 'data-dir-testnet'),
                          'swap-enable': false,
                          'swap-endpoint': '',
                          'resolver-options': goerliEnsResolver,
                          bootnode: '/dnsaddr/testnet.ethswarm.org'
                      }
                    : {
                          mainnet: true,
                          'data-dir': join(location, 'data-dir'),
                          'swap-enable': true,
                          'swap-endpoint': 'https://xdai.fairdatasociety.org',
                          'resolver-options': 'https://cloudflare-eth.com',
                          bootnode: '/dnsaddr/mainnet.ethswarm.org'
                      }
                await patchConfigYaml(location, patch)
            })
    )
}
