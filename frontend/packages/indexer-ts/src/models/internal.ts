import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  DataTypes,
  Sequelize,
} from "sequelize";

export class ProcessedEvent extends Model<
  InferAttributes<ProcessedEvent>,
  InferCreationAttributes<ProcessedEvent>
> {
  declare block_height: string;
  declare transaction_hash: string;
  declare event_index: string;
}

export function initializeInternalTables(sequelize: Sequelize) {
  ProcessedEvent.init(
    {
      block_height: {
        type: DataTypes.DECIMAL(21),
        primaryKey: true,
      },
      transaction_hash: {
        type: DataTypes.TEXT,
        primaryKey: true,
      },
      event_index: {
        type: DataTypes.DECIMAL(21),
        primaryKey: true,
      },
    },
    {
      tableName: "processed_events",
      sequelize,
      timestamps: false,
    }
  );
}
