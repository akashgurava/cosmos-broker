import { AzureFunction, Context, HttpRequest } from "@azure/functions";

import { CosmosError, getUserResourceToken } from "./cosmos";
import { TokenResponse, ErrorResponse } from "./interfaces";

interface Response {
  status: number,
  headers: { 'Content-Type': string },
  body: ErrorResponse | TokenResponse
}

async function getResponse(userId: string, partitionKeyValue: string): Promise<Response> {

  if (userId) {
    var tokens: TokenResponse;
    try {
      tokens = await getUserResourceToken(userId, partitionKeyValue);
    } catch (error) {
      if (error instanceof CosmosError) {
        const code = error.code ?? 500;
        return {
          status: code,
          headers: { 'Content-Type': 'application/json' },
          body: {
            errorCode: code,
            message: error.message,
            orgError: error.orgError,
            tokens: {}
          },
        }
      }
      // Any other error
      return {
        status: Number.parseInt(error.errorCode ?? '500'),
        headers: { 'Content-Type': 'application/json' },
        body: {
          errorCode: Number.parseInt(error.errorCode ?? '500'),
          message: error.message,
          orgError: error,
          tokens: {}
        },
      };
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: tokens
    };
  }
  else {
    return {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
      body: {
        errorCode: 400,
        message: 'userId is required',
        orgError: Error('userId is required'),
        tokens: []
      }
    };
  };
}

const cosmosBroker: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {

  const userId: string = (req.query.userId || (req.body && req.body.userId));
  const partitionKeyValue: string = (req.query.partitionKeyValue || (req.body && req.body.partitionKeyValue));

  const response = await getResponse(userId, partitionKeyValue);
  context.res = response;
};

export default cosmosBroker;
