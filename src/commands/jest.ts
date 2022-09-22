import axios from 'axios'
import { Command, Parser } from 'cafe-args'
import { Arrays, System, Types } from 'cafe-utility'

const BEE_DEBUG_API_URL = 'http://localhost:1635'

interface Stamp {
    batchID: string
}

export function registerJestCommand(parser: Parser) {
    parser.addCommand(
        new Command('jest', 'Run jest with postage stamp environment variable', {
            alias: 'j'
        }).withFn(async () => {
            console.log('Fetching available stamps from', BEE_DEBUG_API_URL)
            const response = await axios(BEE_DEBUG_API_URL)
            const json = Types.asObject(await response.data)
            const stamps: Stamp[] = Types.asArray(json.stamps).map(x => ({
                batchID: Types.asString(Types.asObject(x).batchID)
            }))
            if (!stamps.length) {
                throw Error('No stamps available')
            }
            console.log(`Found ${stamps.length} stamps`)
            const stamp = Arrays.pick(stamps)
            console.log(`Picked stamp ${stamp.batchID}`)
            await System.runProcess(
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
