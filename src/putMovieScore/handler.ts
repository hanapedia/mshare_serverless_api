import { SQSHandler } from 'aws-lambda';

export const lambdaHandler: SQSHandler = async (event) => {
    event.Records.forEach((record) => {
        const { body } = record;
        console.log(body);
    });
    return;
};
