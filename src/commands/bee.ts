import { Command, Parser } from 'cafe-args'
import { Exec } from 'cafe-node-utility'
import { requireEnv } from '../utility'

export function registerBeeCommand(parser: Parser) {
    parser.addCommand(
        new Command('bee', 'Run bee', {
            alias: 'b'
        })
            .withOption({
                key: 'dev',
                type: 'boolean',
                description: 'Run in dev mode'
            })
            .withFn(async context => {
                const location = requireEnv('CAFE_CLI_PROJECT_DESKTOP')
                Exec.runProcess(
                    './bee',
                    [context.options.dev ? 'dev' : 'start', '--config=config.yaml'],
                    { cwd: location },
                    x => process.stdout.write(x.toString()),
                    x => process.stderr.write(x.toString())
                )
            })
    )
}
