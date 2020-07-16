
import { FetchError } from "node-fetch";

import { CosmosClient, PermissionMode, Database, User } from "@azure/cosmos";

import { Token, TokenResponse } from "./interfaces";

/**
 * Configuration related to Cosmos DB connection.
 */
const COSMOS_CONFIG = {
  /**
   * Endpoint or Host address for CosmosDB.
   */
  endpoint: process.env.COSMOS_HOST,
  /**
   * Primary Master key required to authenticate to the CosmosDB to generate tokens.
   */
  primaryKey: process.env.COSMOS_PRIMARY_KEY,
  /**
   * The database on which the tokens are genearted.
   */
  database: process.env.COSMOS_DB,
  /**
   * A string representation of Key-Value pairs with single quotes instead of double quotes.
   * The key is the containerId and value is Partition key for that particular container
   * For example: "{'container1': 'partitionKey1', 'container2': 'partitionKey2'}"
   */
  containers: JSON.parse(process.env.COSMOS_CONTAINERS?.replace(/'/g, '"')),
  /**
   * Expiry time for which token can be used in seconds.
   */
  resourceTokenExpirySeconds: Number.parseInt(process.env.EXPIRY_TIME_SECONDS),
}

/**
 * Custom error to capture error thrown during Connecting to CosmosDB
 */
export class CosmosError extends Error {
  /**
   * Response code of request made tp CosmosDB.
   */
  code: number;
  /**
   * Message to understand the reason of error.
   */
  message: string;
  /**
   * Underlying error thrown by Cosmos API.
   */
  orgError: Error;

  constructor(code: string, message: string, error: Error) {
    super();
    this.code = Number.parseInt(code.toString());
    this.message = message;
    this.orgError = error;
    this.stack = error.stack;
  }
}

/**
 * Cosmos DB API client which will be used for making API calls to CosmosDB.
 */
// Creating the Client statically
const client = new CosmosClient({
  endpoint: COSMOS_CONFIG.endpoint,
  key: COSMOS_CONFIG.primaryKey,
});

/**
 * Generate a Resource Token to restrict access of users.
 * Instead of using a MasterKey on CosmosDB, which will have All-Access on all DBs, Containers
 * and Items.
 * 
 * Design the schema of CosmosDB with this concept in mind. If you want user level security,
 * then userId or any key with uniqueness at a user level should be the partition key of the container.
 * Note: PartitionKey need not be unique for a container. As in there can be multiple
 * items in a container with same userId
 * 
 * For example: For a social media or messaging app, Messages can be a container with items like
 * {id: 'xxx', uid: 'sam', mesage: 'hello world'} having "uid" as partition key.
 * Then you can generate Resource Tokens so that "sam" can only access his messages.  
 * 
 * @param userId User Id to identify CosmosDB user. User will be created if not already exists.
 * @param partitionKeyValue Optional partition key value on which the user gets access.
 * If empty or undefined, userId will be used.
 * 
 * @throws CosmosError on error from @azure/cosmos API
 */
// TODO: Add a readOnly param to make read only permission
export async function getUserResourceToken(userId: string, partitionKeyValue?: string): Promise<TokenResponse> {

  var database: Database;
  // On first API call, the client might throw error.
  try {
    ({ database } = await client.databases.createIfNotExists({ id: COSMOS_CONFIG.database }))
  } catch (error) {
    var msg: string;

    /// Auth error
    if (error.code === 401) {
      msg = "The input authorization token can't serve the request. Check `COSMOS_PRIMARY_KEY` env variable.";
    } else if (error instanceof FetchError) {
      msg = 'Unable to contact Cosmos DB. Check `COSMOS_HOST` env variable.';
      error.code = '404';
    } else {
      // Unknown error
      throw new CosmosError(
        error.code ?? 500,
        'Unknown error. Please check Functions Log.',
        error
      );
    }
    throw new CosmosError(error.code, msg, error);
  }

  var user: User;
  partitionKeyValue = partitionKeyValue ?? userId;
  // Create user if not exists
  try {
    await database.users.create({ id: userId })
    user = (await database.user(userId).read()).user;
  } catch (_) {
    user = (await database.user(userId).read()).user;
  }

  // If no partition key value is supplied then use userId as partition key value
  const tokens: Map<string, Token> = new Map();
  // For each container create a resource token
  for (const containerId in COSMOS_CONFIG.containers) {
    const partitionKey = '/' + COSMOS_CONFIG.containers[containerId];
    // If container does not exist create container
    const { container } = await database.containers.createIfNotExists({
      id: containerId,
      partitionKey: { paths: [partitionKey] }
    });

    const permissionId = 'permission-' + userId + '-' + containerId;
    // Delete existing permission if it exists
    try {
      await user.permission(permissionId).delete()
    } catch (_) {
    }
    const resourceToken = (await user.permissions.create(
      {
        id: permissionId,
        permissionMode: PermissionMode.All,
        resource: container.url,
        resourcePartitionKey: [partitionKeyValue],
      }, {
      resourceTokenExpirySeconds: COSMOS_CONFIG.resourceTokenExpirySeconds,
    }
    )).resource._token
    const token = {
      permissionId,
      partitionKeyValue,
      url: container.url,
      mode: PermissionMode.All,
      token: resourceToken
    }
    tokens[containerId] = token as Token;
  }

  return { userId, tokens };
}

export default getUserResourceToken;
