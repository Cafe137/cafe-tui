import { Command, Parser } from 'cafe-args'
import { Objects, Types } from 'cafe-utility'
import { spawn } from 'child_process'
import inquirer from 'inquirer'

const MAGIC_STRING = 'CAFE_CLI_PROJECT_'

export function registerProjectCommand(parser: Parser) {
    parser.addCommand(
        new Command('project', 'Move between projects quickly', {
            alias: 'p'
        }).withFn(async () => {
            const locations = Objects.filterKeys(process.env, key => key.startsWith(MAGIC_STRING))
            if (Types.isEmptyObject(locations)) {
                throw Error('No projects found')
            }
            const { choice } = await inquirer.prompt({
                name: 'choice',
                type: 'list',
                message: 'Select a project',
                choices: Object.keys(locations).map(x => x.slice(MAGIC_STRING.length))
            })
            const location = locations[`${MAGIC_STRING}${choice}`]
            spawn('zsh', ['-i'], {
                cwd: location,
                env: process.env,
                stdio: 'inherit'
            })
        })
    )
}
