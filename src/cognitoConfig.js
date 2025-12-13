// src/cognitoConfig.js
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_vjf6EIHnc', // Thay bằng User Pool ID thật
  ClientId: '3u26dmo01veihoa7sofil4uuq1',     // Thay bằng App Client ID thật
};

export default new CognitoUserPool(poolData);