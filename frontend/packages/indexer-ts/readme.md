# TypeScript Indexer

The indexer is built using [Near Lake Framework](https://near-indexers.io/docs/projects/near-lake-framework "Near Lake Framework Docs") which pulls block data from a S3 bucket maintained by Pagoda Inc.

## Data pull logic

index.ts exposes the function to be run on every pulled block of data. It picks every single successful transaction and sends it over to the processor.

The processor reads the contract in which the transaction was executed and only routes transactions from the application's smart contracts (defined in .env) to the process event function.

The process event function then identifies the contract and event type of the transaction and executes the DB writing logic for that transaction.

## DB writing logic

In order to make the indexer reliable and rebootable, each DB transaction is composed of multiple committed queries, in case any of the queries fail, the entire transaction is rolled back.

Each transaction inserts a unique key identifying the transaction in the DB, in case a duplicate transaction is attempted, it will be denied and rolled back because of the duplicate unique key. This allows the indexer to be rebooted from any block height without risking the curruption of DB data.

When rebooting the indexer, it looks up all the transactions inserted in the DB to find the latest inserted block and restarts indexing from that block on (actually, it is recommended to use a BLOCK_REDUNDANCY parameter, which is set to 100 and means that the indexer will start indexing from the latest inserted transaction block minus BLOCK_REDUNDANCY).

