export default () => ({
  mongoUrl: process.env.MONGO_URI,
  port: process.env.PORT,
  aws: {
    accessKey: process.env.AWS_ACCESS_KEY_ID,
    secretKey: process.env.AWS_SECRET_ACCESS_KEY,
    cognitoPoolId: process.env.COGNITO_POOL_ID,
    region: process.env.AWS_REGION,
    cognitoClientId: process.env.COGNITO_CLIENT_ID,
  },
});
