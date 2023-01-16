import { Command, Parser } from 'cafe-args'
import { Exec } from 'cafe-node-utility'
import { BEE_DEBUG_API_URL } from '../constants'
import { findPostageStamp } from '../stamp'

export function registerJestCommand(parser: Parser) {
    parser.addCommand(
        new Command('jest', 'Run jest with postage stamp environment variable', {
            alias: 'j'
        }).withFn(async () => {
            const stamp = await findPostageStamp(BEE_DEBUG_API_URL)
            await Exec.runProcess(
                'npm',
                ['test', '--', '--colors'],
                {
                    env: {
                        ...process.env,
                        STAMP: stamp.batchID,
                        POSTAGE_STAMP: stamp.batchID,
                        POSTAGE_BATCH: stamp.batchID,
                        BEE_POSTAGE: stamp.batchID
                    }
                },
                x => process.stdout.write(x.toString()),
                x => process.stderr.write(x.toString())
            )
        })
    )
}
