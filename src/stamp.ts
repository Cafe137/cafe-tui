import axios from 'axios'
import { Arrays, Types } from 'cafe-utility'

export interface Stamp {
    batchID: string
    usable: boolean
    amount: string
    depth: number
    bucketDepth: number
    utilization: number
    batchTTL: number
}

export async function findPostageStamp(beeDebugApiUrl: string): Promise<Stamp> {
    console.log('Fetching available stamps from', beeDebugApiUrl)
    const response = await axios(`${beeDebugApiUrl}/stamps`)
    const json = Types.asObject(await response.data)
    const stamps: Stamp[] = Types.asArray(json.stamps).map(x => {
        const stamp = Types.asObject(x)
        return {
            batchID: Types.asString(stamp.batchID),
            usable: Types.asBoolean(stamp.usable),
            amount: Types.asString(stamp.amount),
            depth: Types.asNumber(stamp.depth),
            bucketDepth: Types.asNumber(stamp.bucketDepth),
            utilization: Types.asNumber(stamp.utilization),
            batchTTL: Types.asNumber(stamp.batchTTL)
        }
    })
    if (!stamps.length) {
        throw Error('No stamps available')
    }
    console.log(`Found ${stamps.length} stamps`)
    const stamp = Arrays.pick(stamps)
    console.log(`Picked stamp ${stamp.batchID}`)
    return stamp
}
