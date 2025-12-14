// src/cognitoConfig.js
import { CognitoUserPool } from 'amazon-cognito-identity-js';

const poolData = {
  UserPoolId: 'us-east-1_vjf6EIHnc', 
  ClientId: '3u26dmo01veihoa7sofil4uuq1',     
};

export default new CognitoUserPool(poolData);