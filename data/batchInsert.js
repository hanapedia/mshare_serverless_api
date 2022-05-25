const AWS = require('aws-sdk');
const data = require('./dummyDataBatchWrite.json');
AWS.config.update({ region: 'ap-northeast-1' });

// const formattedData = data.map((item) => ({
//   PutRequest: {
//     Item: {
//       KEY: { S: item.youtubeTitleId },
//       title: { S: item.title },
//       overview: { S: item.overview },
//       genre: { S: item.genre },
//       grinningScore: { N: `${item.grinningScore}` },
//       createdAt: { S: item.createdAt },
//       username: { S: item.userName },
//       userId: { S: item.userId },
//     },
//   },
// }));

// const params = {
//   RequestItems: {
//     movies: formattedData,
//   },
// };

// const db = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
// db.batchWriteItem(params, (error, data) => {
//   if (!error) {
//     console.log('Success', data);
//   }
//   console.log('Failed', error);
// });
const db = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
let params;
data.forEach((item) => {
  params = {
    TableName: 'movies',
    Item: {
      movieId: { S: item.youtubeTitleId },
      title: { S: item.title },
      overview: { S: item.overview },
      genre: { S: item.genre },
      grinningScore: { N: `${item.grinningScore}` },
      createdAt: { S: item.createdAt },
      username: { S: item.userName },
      userId: { S: item.userId },
    },
  };
  db.putItem(params, function (err, data) {
    if (err) {
      console.log('Error', err);
    } else {
      console.log('Success', data);
    }
  });
});

// Call DynamoDB to add the item to the table
