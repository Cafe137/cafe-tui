import AdmZip from 'adm-zip'
import axios from 'axios'
import { Command, Parser } from 'cafe-args'
import { Types } from 'cafe-utility'

export function registerGetUnzipCommand(parser: Parser) {
    parser.addCommand(
        new Command('get-unzip', 'Download and unzip file', {
            alias: 'g'
        })
            .withPositional({
                key: 'url',
                description: 'Remote resource',
                required: true
            })
            .withPositional({
                key: 'path',
                description: 'Destination path',
                required: true
            })
            .withFn(async context => {
                await getAndUnzip(Types.asString(context.arguments.url), Types.asString(context.arguments.path))
            })
    )
}

async function getAndUnzip(url: string, path: string): Promise<void> {
    const response = await axios.get(url, { responseType: 'arraybuffer' })
    const buffer = response.data
    const zip = new AdmZip(buffer)
    zip.extractAllTo(path, true)
}
