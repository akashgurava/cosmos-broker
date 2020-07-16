import { PermissionMode } from "@azure/cosmos";


/**
 * A token generated on CosmosDB.
 */
export interface Token {
  /**
   * Permission ID for the token generated.
   * This is normally permissionId = 'permission-' + userId + '-' + containerId.
   */
  permissionId: string,
  /**
   * The partition key value on which the token/user has access to.
   * If partitionKeyValue is not passed in the request then userId will be used.
   */
  partitionKeyValue: string,
  /**
   * The URL which the token/user has access to.
   * This is generally container url.
   */
  url: string,
  /**
   * Mode of operations the token/user can perform.
   * Can be PermissionMode.all or PermissionMode.read.
   */
  mode: PermissionMode,
  /**
   * The token string.
   * If using REST API, This token needs to be encoded before sending request.
   */
  token: string
}

/**
 * A success response with collection of tokens generated for a CosmosDB Database.
 */
export interface TokenResponse {
  /**
   * User ID of user
   */
  userId: string,
  /**
   * A map of colletionId and `Token`.
   */
  tokens: Map<string, Token>,
}

/**
 * A error response sent when a function fails exexuting properly.
 */
export interface ErrorResponse {
  /**
   * Status code or error.
   */
  errorCode: number,
  /**
   * Message of error.
   */
  message: string,
  /**
   * Original error.
   */
  orgError: Error,
  /**
   * An empty tokens object. so that clients do not fail un expectadly on functon error
   */
  tokens: {},
}
