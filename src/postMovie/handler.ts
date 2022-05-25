import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda';
import Ajv, { JSONSchemaType } from 'ajv';

type LambdaHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;
type RequestBody = {
    movieId: string;
    userId: string;
    username: string;
    title: string;
    overview: string;
    genre: string;
};
const requestBodySchema: JSONSchemaType<RequestBody> = {
    type: 'object',
    properties: {
        movieId: { type: 'string' },
        userId: { type: 'string' },
        username: { type: 'string' },
        title: { type: 'string' },
        overview: { type: 'string' },
        genre: { type: 'string' },
    },
    required: ['movieId', 'userId', 'username', 'title', 'overview', 'genre'],
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
        const requestBody: RequestBody = JSON.parse(event.body);
        if (!validate(requestBody))
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'ERROR: request body invalid',
                }),
            };
        const putItemCommandInput: PutItemCommandInput = {
            TableName: tableName,
            Item: {
                movieId: { S: requestBody.movieId },
                userId: { S: requestBody.userId },
                username: { S: requestBody.username },
                title: { S: requestBody.title },
                overview: { S: requestBody.overview },
                genre: { S: requestBody.genre },
                createdAt: { S: new Date().toISOString() },
                grinningScore: { N: '0' },
            },
        };
        const putItemCommand = new PutItemCommand(putItemCommandInput);
        await docClient.send(putItemCommand);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'successfully added new item' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};
