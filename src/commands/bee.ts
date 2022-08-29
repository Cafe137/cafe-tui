import { Command, Parser } from 'cafe-args'
import { System } from 'cafe-utility'

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
                if (!process.env.CAFE_CLI_PROJECT_DESKTOP) {
                    throw Error('CAFE_CLI_PROJECT_DESKTOP must be set')
                }
                System.runProcess(
                    './bee',
                    [context.options.dev ? 'dev' : 'start', '--config=config.yaml'],
                    {
                        cwd: process.env.CAFE_CLI_PROJECT_DESKTOP
                    },
                    x => process.stdout.write(x.toString()),
                    x => process.stderr.write(x.toString())
                )
            })
    )
}
