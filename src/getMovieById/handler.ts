import { AttributeValue, DynamoDBClient, GetItemCommand, GetItemCommandInput } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda';

type LambdaHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;
const docClient = new DynamoDBClient({});
const tableName = 'movies';
export const lambdaHandler: LambdaHandler = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.pathParameters?.movieId)
            return {
                statusCode: 400,
                body: JSON.stringify({
                    message: 'ERROR: provide query parameter',
                }),
            };
        const getCommandParam: GetItemCommandInput = {
            TableName: tableName,
            Key: {
                movieId: {
                    S: event.pathParameters?.movieId,
                },
            },
        };
        const getItemCommand = new GetItemCommand(getCommandParam);
        const { Item } = await docClient.send(getItemCommand);
        if (!Item) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'No Items found' }),
            };
        }
        const ParsedItems = parseQueryResult(Item);
        return {
            statusCode: 200,
            body: JSON.stringify(ParsedItems),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Entity not found',
            }),
        };
    }
};

type Item = {
    [key: string]: AttributeValue;
};
type ParsedItem = {
    [key: string]: string;
};
const parseQueryResult = (Items: Item) => {
    const parsedItem = {} as ParsedItem;
    for (const attributeKey in Items) {
        parsedItem[attributeKey] = parseAttributeValue(
            Items[attributeKey] as AttributeValue.SMember | AttributeValue.NMember,
        );
    }
    return parsedItem;
};

const parseAttributeValue = (attrVal: AttributeValue.SMember | AttributeValue.NMember) => {
    if (attrVal.S) return attrVal.S;
    if (attrVal.N) return attrVal.N;
    return '';
};
