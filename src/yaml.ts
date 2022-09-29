import { Files, Objects } from 'cafe-utility'
import { writeFile } from 'fs/promises'
import { dump, FAILSAFE_SCHEMA, load } from 'js-yaml'
import { join } from 'path'

export async function readConfigYaml(path: string): Promise<Record<string, unknown>> {
    const raw = await Files.readUtf8FileAsync(join(path, 'config.yaml'))
    const data = load(raw, {
        schema: FAILSAFE_SCHEMA
    })
    return data as Record<string, unknown>
}

export async function patchConfigYaml(path: string, patch: Record<string, unknown>) {
    const configuration = await readConfigYaml(path)
    Objects.mergeDeep(configuration, patch)
    await writeFile(join(path, 'config.yaml'), dump(configuration))
}
