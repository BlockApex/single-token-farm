import React from "react";
import { ConnectConfig } from "near-api-js";
import { NearEnvironment, NearProvider } from "react-near";

export const ProviderNear: React.FC<
  {
    environment?: NearEnvironment;
    children?: React.ReactNode;
  } & Partial<ConnectConfig>
> = NearProvider as any;
