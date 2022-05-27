import { SQSHandler } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import Ajv, { JSONSchemaType } from 'ajv';

type RequestBody = {
    grinningScore: string;
};
const requestBodySchema: JSONSchemaType<RequestBody> = {
    type: 'object',
    properties: {
        grinningScore: { type: 'string' },
    },
    required: ['grinningScore'],
    additionalProperties: false,
};

const tableName = 'movies';
const docClient = new DynamoDBClient({});
const ajv = new Ajv();
const validate = ajv.compile(requestBodySchema);

export const lambdaHandler: SQSHandler = async ({ Records }) => {
    try {
        for (const index in Records) {
            const { body } = Records[index];
            const JsonBody = JSON.parse(body);
            if (!validate(JsonBody)) {
                console.log('invalid body', JsonBody);
                return;
            }
            const movieId = Records[index].attributes.MessageGroupId;
            if (!movieId) {
                console.log('no message group id provided');
                return;
            }

            const updateCommandParam: UpdateItemCommandInput = {
                TableName: tableName,
                Key: {
                    movieId: {
                        S: movieId,
                    },
                },
                ExpressionAttributeValues: {
                    ':attrVal': { N: JsonBody.grinningScore },
                },
                UpdateExpression: 'SET grinningScore = grinningScore + :attrVal',
            };
            const updateCommand = new UpdateItemCommand(updateCommandParam);
            try {
                await docClient.send(updateCommand);
                console.log('Score successfuly updated. movieId:', movieId);
            } catch (error) {
                console.log('Failed to update movieId:', movieId);
            }
        }
        return;
    } catch (error) {
        console.log('failed to update score');
        return;
    }
};
