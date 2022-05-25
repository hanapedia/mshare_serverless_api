import {
    AttributeValue,
    DynamoDBClient,
    QueryCommand,
    QueryCommandInput,
    ScanCommand,
    ScanCommandInput,
} from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda';

type LambdaHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;
type QueryParams = {
    pathParameterKey: 'userId' | 'genre' | 'title';
    pathParameterValue: string;
};

const docClient = new DynamoDBClient({});
const tableName = 'movies';
export const lambdaHandler: LambdaHandler = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.queryStringParameters) {
            const scanParams: ScanCommandInput = {
                TableName: tableName,
                Limit: 50,
            };
            const scanCommand = new ScanCommand(scanParams);
            const { Items } = await docClient.send(scanCommand);
            if (!Items) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'No Items found' }),
                };
            }
            const ParsedItems = parseQueryResult(Items);
            return {
                statusCode: 200,
                body: JSON.stringify(ParsedItems),
            };
        }
        const queryStringParametes = event.queryStringParameters;
        const queryParams: QueryParams = queryStringParametes.userId
            ? {
                  pathParameterKey: 'userId',
                  pathParameterValue: queryStringParametes.userId,
              }
            : queryStringParametes.genre
            ? {
                  pathParameterKey: 'genre',
                  pathParameterValue: queryStringParametes.genre,
              }
            : queryStringParametes.title
            ? {
                  pathParameterKey: 'title',
                  pathParameterValue: queryStringParametes.title,
              }
            : ({} as QueryParams);
        if (!queryParams) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'ERROR: provide valid query parameter',
                }),
            };
        }
        const { Items } = await queryByParameter(queryParams);
        if (!Items) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'No Items found' }),
            };
        }
        const ParsedItems = parseQueryResult(Items);
        return {
            statusCode: 200,
            body: JSON.stringify(ParsedItems),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify(error),
        };
    }
};

const queryByParameter = async ({ pathParameterKey, pathParameterValue }: QueryParams) => {
    const queryCommandInput: QueryCommandInput = {
        TableName: tableName,
        Select: 'ALL_ATTRIBUTES',
        IndexName: `${pathParameterKey}Index`,
        ExpressionAttributeNames: {
            '#attrName': pathParameterKey,
        },
        ExpressionAttributeValues: {
            ':attrVal': { S: pathParameterValue },
        },
        KeyConditionExpression: '#attrName = :attrVal',
    };
    const command = new QueryCommand(queryCommandInput);
    return await docClient.send(command);
};

type Item = {
    [key: string]: AttributeValue;
}[];
type ParsedItem = {
    [key: string]: string;
};
const parseQueryResult = (Items: Item) => {
    const ParsedItems: ParsedItem[] = Items.map((item) => {
        const parsedItem = {} as ParsedItem;
        for (const attributeKey in item) {
            parsedItem[attributeKey] = parseAttributeValue(
                item[attributeKey] as AttributeValue.SMember | AttributeValue.NMember,
            );
        }
        return parsedItem;
    });
    return ParsedItems;
};

const parseAttributeValue = (attrVal: AttributeValue.SMember | AttributeValue.NMember) => {
    if (attrVal.S) return attrVal.S;
    if (attrVal.N) return attrVal.N;
    return '';
};
