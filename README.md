# Cosmos Broker

An Azure Functions app to generate Resource Tokens for CosmosDB.

## Introduction

[Azure Cosmos DB](https://azure.microsoft.com/services/cosmos-db/) is a Enterprise grade NoSQL database. Recently, it gained a Free Tier with 5GB storage capacity. So I expolred it as a backend for my Mobile App.

### Features

1. A free NoSQL DB with First class SQL API built-in. Which basically means A NoSQL DB with SQL like query capabilities.
2. Enhanced security with Resource Tokens. So, Developers do not have to bundle MasterKey with the app.

## Requirement

For the 2nd feature to be really useful, we need to have a Secure HTTP API endpoint. This endpoint most probably [Azure App Service](https://azure.microsoft.com/services/app-service/static) or [Azure Functions](https://azure.microsoft.com/services/functions/)(Both have a generous free tier) will act as a Broker. The Master Key to Cosmos DB is stored here and it generates Resource Tokens for App users with permissions only for user's data instead of whole Database/Containers.

That's where this Azure Functions app comes in.

## Usage

1. Install NodeJS 12.x and optionally Yarn
2. Clone this repo
3. Open the repo in VS Code. Install VS Code Azure Functions extension (VS Code might also show a pop-up)
4. Make a copy of local.setings-sample.json as local.setings.json and fill values for all keys in "Values".
    1. COSMOS_HOST: HTTP endpoint for Cosmos DB host,
    2. COSMOS_PRIMARY_KEY: Primary Master key
    3. COSMOS_SECONDARY_KEY: Secondary Master key(optional)
    4. COSMOS_DB: Database on which access is granted
    5. COSMOS_CONTAINERS:A string representation of Key-Value pairs with single quotes instead of double quotes. The key is the containerId and value is Partition key for that particular container. For example: "{'container1': 'partitionKey1', 'container2': 'partitionKey2'}"
5. Install dependencies with `yarn install` or `npm install`
6. Go to Azure Extension sidebar menu and deploy. Fill in the details.
