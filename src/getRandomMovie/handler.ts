import { AttributeValue, DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, Handler } from 'aws-lambda';

type LambdaHandler = Handler<APIGatewayProxyEventV2, APIGatewayProxyResultV2>;

const docClient = new DynamoDBClient({});
const tableName = 'movies';
export const lambdaHandler: LambdaHandler = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.queryStringParameters?.genre) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'No query string parameter provided' }),
            };
        }

        const genre = event.queryStringParameters.genre;
        const { Items } = await getMoviesByGenre(genre);
        if (!Items) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: `No Items found for genre '${genre}'` }),
            };
        }
        const randomItem = await getRandomItem(Items);
        const ParsedItems = await parseQueryResult(randomItem);
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

const getMoviesByGenre = async (genre: string) => {
    const queryCommandInput = {
        TableName: tableName,
        Select: 'ALL_ATTRIBUTES',
        IndexName: 'genreIndex',
        ExpressionAttributeNames: {
            '#pk': 'genre',
        },
        ExpressionAttributeValues: {
            ':pkVal': { S: genre },
        },
        KeyConditionExpression: `#pk = :pkVal`,
    };
    const queryCommand = new QueryCommand(queryCommandInput);
    return await docClient.send(queryCommand);
};

const getRandomItem = (Items: Item[]): Item => {
    return Items[Math.floor(Math.random() * Items.length)];
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
