import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda';
import { DynamoDBClient, UpdateItemCommand, UpdateItemCommandInput } from '@aws-sdk/client-dynamodb';
import Ajv, { JSONSchemaType } from 'ajv';

type LambdaHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;
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

export const lambdaHandler: LambdaHandler = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body)
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'ERROR: required request body not found',
                }),
            };
        const JsonBody = JSON.parse(event.body);
        if (!validate(JsonBody)) {
            console.log('invalid body', JsonBody);
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'ERROR: invalid request body',
                }),
            };
        }

        const movieId = event.pathParameters?.movieId;
        if (!movieId) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'ERROR: provide query parameter',
                }),
            };
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
        await docClient.send(updateCommand);
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'successfully updated the score',
            }),
        };
    } catch (error) {
        console.log('failed to update score');
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal server error',
            }),
        };
    }
};
