import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Optional,
  Sequelize,
  NonAttribute,
  ForeignKey,
} from "sequelize";

export class LaunchpadInvestor extends Model<
  InferAttributes<LaunchpadInvestor>,
  InferCreationAttributes<LaunchpadInvestor>
> {
  declare account_id: string;
  declare staked_token: string;
  declare last_check: Date;
}

export class Listing extends Model<
  InferAttributes<Listing>,
  InferCreationAttributes<Listing>
> {
  declare listing_id: string;
  declare public: boolean;
  declare status: string;
  declare project_owner: string;
  declare project_token: string;
  declare price_token: string;

  declare open_sale_1_timestamp: Date;
  declare open_sale_2_timestamp: Date;
  declare final_sale_2_timestamp: Date;
  declare liquidity_pool_timestamp: Date;

  declare total_amount_sale_project_tokens: string;
  declare token_allocation_size: string;
  declare token_allocation_price: string;
  declare allocations_sold: string;
  declare liquidity_pool_project_tokens: string;
  declare liquidity_pool_price_tokens: string;
  declare fraction_instant_release: string;
  declare fraction_cliff_release: string;
  declare cliff_timestamp: Date;
  declare end_cliff_timestamp: Date;
  declare fee_price_tokens: string;
  declare fee_liquidity_tokens: string;
  declare dex_id: string;
}

export class ListingMetadata extends Model<
  InferAttributes<ListingMetadata>,
  InferCreationAttributes<ListingMetadata>
> {
  declare listing_id: ForeignKey<Listing["listing_id"]>;
  declare project_name: string;
  declare description_token: string;
  declare description_project: string;
  declare discord: string;
  declare twitter: string;
  declare telegram: string;
  declare website: string;
  declare whitepaper: string;
}

export class Allocation extends Model<
  InferAttributes<Allocation>,
  InferCreationAttributes<Allocation>
> {
  declare account_id: string;
  declare listing_id: ForeignKey<Listing["listing_id"]>;

  declare quantity_withdrawn: string;
  declare total_quantity: string;
  declare total_allocation: string;
}

export function initializeLaunchpad(sequelize: Sequelize) {
  LaunchpadInvestor.init(
    {
      account_id: {
        type: DataTypes.TEXT,
        primaryKey: true,
      },
      staked_token: {
        type: DataTypes.DECIMAL(40),
      },
      last_check: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "launchpad_investors",
      sequelize,
      timestamps: false,
    }
  );

  const statusEnum = [
    "unfunded",
    "funded",
    "sale_finalized",
    "pool_created",
    "pool_project_token_sent",
    "pool_price_token_sent",
    "liquidity_pool_finalized",
    "cancelled",
  ];

  Listing.init(
    {
      listing_id: {
        type: DataTypes.DECIMAL(21),
        primaryKey: true,
      },
      public: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      status: {
        type: DataTypes.ENUM(...statusEnum),
      },
      project_owner: {
        type: DataTypes.TEXT,
      },
      project_token: {
        type: DataTypes.TEXT,
      },
      price_token: {
        type: DataTypes.TEXT,
      },
      open_sale_1_timestamp: {
        type: DataTypes.DATE,
      },
      open_sale_2_timestamp: {
        type: DataTypes.DATE,
      },
      final_sale_2_timestamp: {
        type: DataTypes.DATE,
      },
      liquidity_pool_timestamp: {
        type: DataTypes.DATE,
      },

      total_amount_sale_project_tokens: {
        type: DataTypes.DECIMAL(40),
      },
      token_allocation_size: {
        type: DataTypes.DECIMAL(40),
      },
      token_allocation_price: {
        type: DataTypes.DECIMAL(40),
      },
      allocations_sold: {
        type: DataTypes.DECIMAL(21),
      },
      liquidity_pool_project_tokens: {
        type: DataTypes.DECIMAL(40),
      },
      liquidity_pool_price_tokens: {
        type: DataTypes.DECIMAL(40),
      },
      fraction_instant_release: {
        type: DataTypes.DECIMAL(40),
      },
      fraction_cliff_release: {
        type: DataTypes.DECIMAL(40),
      },
      cliff_timestamp: {
        type: DataTypes.DATE,
      },
      end_cliff_timestamp: {
        type: DataTypes.DATE,
      },
      fee_price_tokens: {
        type: DataTypes.DECIMAL(40),
      },
      fee_liquidity_tokens: {
        type: DataTypes.DECIMAL(40),
      },
      dex_id: {
        type: DataTypes.DECIMAL(21),
      },
    },
    {
      tableName: "listings",
      sequelize,
      timestamps: false,
    }
  );

  ListingMetadata.init(
    {
      listing_id: {
        type: DataTypes.DECIMAL(21),
        primaryKey: true,
      },
      project_name: {
        type: DataTypes.TEXT,
      },
      description_token: {
        type: DataTypes.TEXT,
      },
      description_project: {
        type: DataTypes.TEXT,
      },
      discord: {
        type: DataTypes.TEXT,
      },
      twitter: {
        type: DataTypes.TEXT,
      },
      telegram: {
        type: DataTypes.TEXT,
      },
      website: {
        type: DataTypes.TEXT,
      },
      whitepaper: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "listings_metadata",
      sequelize,
      timestamps: false,
    }
  );

  Listing.hasOne(ListingMetadata, {
    foreignKey: {
      name: "listing_id",
    },
  });
  ListingMetadata.belongsTo(Listing);

  Allocation.init(
    {
      account_id: {
        type: DataTypes.TEXT,
        primaryKey: true,
      },
      listing_id: {
        type: DataTypes.TEXT,
        primaryKey: true,
      },
      quantity_withdrawn: {
        type: DataTypes.TEXT,
      },
      total_quantity: {
        type: DataTypes.TEXT,
      },
      total_allocation: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "allocations",
      sequelize,
      timestamps: false,
    }
  );

  Listing.hasMany(Allocation, {
    foreignKey: {
      name: "listing_id",
    },
  });
  Allocation.belongsTo(Listing);
}
