-- CreateEnum
CREATE TYPE "listing_status" AS ENUM ('unfunded', 'funded', 'sale_finalized', 'pool_created', 'pool_project_token_sent', 'pool_price_token_sent', 'liquidity_pool_finalized', 'cancelled');

-- CreateTable
CREATE TABLE "allocations" (
    "account_id" TEXT NOT NULL,
    "listing_id" DECIMAL(21,0) NOT NULL,
    "quantity_withdrawn" DECIMAL(40,0),
    "total_quantity" DECIMAL(40,0),
    "total_allocation" DECIMAL(21,0),

    CONSTRAINT "allocations_pkey" PRIMARY KEY ("account_id","listing_id")
);

-- CreateTable
CREATE TABLE "launchpad_investors" (
    "account_id" TEXT NOT NULL,
    "staked_token" DECIMAL(40,0),
    "last_check" TIMESTAMPTZ(6),

    CONSTRAINT "launchpad_investors_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "listings" (
    "listing_id" DECIMAL(21,0) NOT NULL,
    "public" BOOLEAN DEFAULT true,
    "status" "listing_status" NOT NULL,
    "project_owner" TEXT,
    "project_token" TEXT NOT NULL,
    "price_token" TEXT NOT NULL,
    "open_sale_1_timestamp" TIMESTAMPTZ(6),
    "open_sale_2_timestamp" TIMESTAMPTZ(6),
    "final_sale_2_timestamp" TIMESTAMPTZ(6),
    "liquidity_pool_timestamp" TIMESTAMPTZ(6),
    "total_amount_sale_project_tokens" DECIMAL(40,0),
    "token_allocation_size" DECIMAL(40,0),
    "token_allocation_price" DECIMAL(40,0),
    "allocations_sold" DECIMAL(21,0),
    "liquidity_pool_project_tokens" DECIMAL(40,0),
    "liquidity_pool_price_tokens" DECIMAL(40,0),
    "fraction_instant_release" DECIMAL(40,0),
    "fraction_cliff_release" DECIMAL(40,0),
    "cliff_timestamp" TIMESTAMPTZ(6),
    "end_cliff_timestamp" TIMESTAMPTZ(6),
    "fee_price_tokens" DECIMAL(40,0),
    "fee_liquidity_tokens" DECIMAL(40,0),
    "dex_id" DECIMAL(21,0),

    CONSTRAINT "listings_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "listings_metadata" (
    "listing_id" DECIMAL(21,0) NOT NULL,
    "project_name" TEXT,
    "description_token" TEXT,
    "description_project" TEXT,
    "discord" TEXT,
    "twitter" TEXT,
    "telegram" TEXT,
    "website" TEXT,
    "whitepaper" TEXT,

    CONSTRAINT "listings_metadata_pkey" PRIMARY KEY ("listing_id")
);

-- CreateTable
CREATE TABLE "processed_events" (
    "block_height" DECIMAL(21,0) NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "event_index" DECIMAL(21,0) NOT NULL,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("block_height","transaction_hash","event_index")
);

-- CreateTable
CREATE TABLE "staked_nfts" (
    "nft_id" TEXT NOT NULL,
    "collection_id" TEXT NOT NULL,
    "owner_id" TEXT,
    "staked_timestamp" TIMESTAMPTZ(6),

    CONSTRAINT "staked_nfts_pkey" PRIMARY KEY ("collection_id","nft_id")
);

-- CreateTable
CREATE TABLE "staking_programs" (
    "collection_id" TEXT NOT NULL,
    "collection_owner_id" TEXT NOT NULL,
    "token_address" TEXT NOT NULL,
    "min_staking_period" DECIMAL(21,0),
    "early_withdraw_penalty" DECIMAL(40,0),
    "round_interval" DECIMAL(21,0),

    CONSTRAINT "staking_programs_pkey" PRIMARY KEY ("collection_id")
);

-- CreateTable
CREATE TABLE "staking_programs_metadata" (
    "collection_id" TEXT NOT NULL,
    "collection_image" TEXT,
    "collection_modal_image" TEXT,

    CONSTRAINT "staking_programs_metadata_pkey" PRIMARY KEY ("collection_id")
);

-- CreateTable
CREATE TABLE "x_token_ratios" (
    "key_column" BIGSERIAL NOT NULL,
    "time_event" TIMESTAMPTZ(6),
    "base_token_amount" DECIMAL(40,0),
    "x_token_amount" DECIMAL(40,0),

    CONSTRAINT "x_token_ratios_pkey" PRIMARY KEY ("key_column")
);

-- AddForeignKey
ALTER TABLE "allocations" ADD CONSTRAINT "allocations_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "listings_metadata" ADD CONSTRAINT "listings_metadata_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("listing_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staked_nfts" ADD CONSTRAINT "staked_nfts_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "staking_programs"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "staking_programs_metadata" ADD CONSTRAINT "staking_programs_metadata_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "staking_programs"("collection_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

