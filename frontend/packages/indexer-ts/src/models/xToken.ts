import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  Sequelize,
} from "sequelize";

export class xTokenRatio extends Model<
  InferAttributes<xTokenRatio>,
  InferCreationAttributes<xTokenRatio>
> {
  declare key_column: CreationOptional<number>;
  declare time_event: Date;
  declare base_token_amount: string;
  declare x_token_amount: string;
}

export function initializeXToken(sequelize: Sequelize) {
  xTokenRatio.init(
    {
      key_column: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      time_event: {
        type: DataTypes.DATE,
      },
      base_token_amount: {
        type: DataTypes.DECIMAL(40),
      },
      x_token_amount: {
        type: DataTypes.DECIMAL(40),
      },
    },
    {
      tableName: "x_token_ratios",
      sequelize,
      timestamps: false,
    }
  );
}
