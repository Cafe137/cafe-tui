import { Command, Parser, tokenize } from 'cafe-args'
import { Dates, System, Types } from 'cafe-utility'

export function registerWatchCommand(parser: Parser) {
    parser.addCommand(
        new Command('watch', 'Run command periodically', {
            alias: 'w'
        })
            .withOption({
                key: 'command',
                description: 'Command to run',
                required: true
            })
            .withOption({
                key: 'interval',
                description: 'Interval in seconds',
                type: 'number',
                default: 5
            })
            .withFn(async context => {
                System.forever(async () => {
                    const { argv } = tokenize(Types.asString(context.options.command), 0)
                    const command = Types.asString(argv.shift())
                    await System.runProcess(
                        command,
                        argv,
                        {},
                        x => process.stdout.write(x.toString()),
                        x => process.stderr.write(x.toString())
                    )
                }, Dates.seconds(Types.asNumber(context.options.interval)))
            })
    )
}
