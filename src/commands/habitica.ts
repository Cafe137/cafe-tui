import axios from 'axios'
import { Command, Group, Parser } from 'cafe-args'
import { Types } from 'cafe-utility'
import { requireEnv } from '../utility'

export function registerHabiticaCommands(parser: Parser) {
    parser.addGroup(
        new Group('habitica', 'Habitica commands')
            .withCommand(
                new Command('list', 'List tasks', {
                    alias: 'l'
                }).withFn(async () => {
                    const userId = requireEnv('HABITICA_USER_ID')
                    const apiToken = requireEnv('HABITICA_API_TOKEN')
                    const client = requireEnv('HABITICA_CLIENT')
                    const response = await axios.get('https://habitica.com/api/v3/tasks/user', {
                        headers: {
                            'x-api-user': userId,
                            'x-api-key': apiToken,
                            'x-client': client
                        }
                    })
                    console.log(response.data)
                })
            )
            .withCommand(
                new Command('complete', 'Complete task')
                    .withPositional({
                        key: 'taskId',
                        description: 'Task ID',
                        required: true
                    })
                    .withFn(async context => {
                        const userId = requireEnv('HABITICA_USER_ID')
                        const apiToken = requireEnv('HABITICA_API_TOKEN')
                        const client = requireEnv('HABITICA_CLIENT')
                        const taskId = Types.asString(context.arguments.taskId)
                        const response = await axios.post(
                            `https://habitica.com/api/v3/tasks/${taskId}/score/up`,
                            {},
                            {
                                headers: {
                                    'x-api-user': userId,
                                    'x-api-key': apiToken,
                                    'x-client': client
                                }
                            }
                        )
                        console.log(response.data)
                    })
            )
    )
}
