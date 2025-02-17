import { Button, TopCard } from "@/components";
import PageContainer from "@/components/PageContainer";
import useCookieJar, { Vault } from "@/hooks/modules/vault/hooks";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import React, { useEffect, useState } from "react";
import { Tab } from "@headlessui/react";
import { Box, SimpleGrid } from "@chakra-ui/react";
import { VaultCard } from "@/components/Vault/VaultCard";
import { UnstakeDisplay } from "@/components/Vault/MyVault";
import { vaultConfigs } from "@/hooks/modules/vault/config";
import { useTokenPriceStore } from "@/stores/token-price-store";
import { formatUnits } from "viem";

const stepItems = [
  {
    element: ".top-card",
    title: "JUMP Vaults",
    intro: (
      <div>
        <span>
          On this page you can see the available Vaults where you can stake your xJUMP.
        </span>
      </div>
    ),
  },
  {
    element: "#vaults-card",
    title: "Vault Information",
    intro: (
      <div>
        <span>
          Each Vault has different active statues, lockup periods,token rewards,  rewards amounts, and fill limits.
        </span>
      </div>
    ),
  },
  {
    element: "#vaults-card",
    title: "Exiting Vaults",
    intro: (
      <div>
        <span>
          If you exit the vault before the end of the lockup period, all accrued rewards are burned, however all deposited xJUMP is retained.
        </span>
      </div>
    ),
  },
  {
    element: "#my-vault",
    title: "My Vaults",
    intro: (
      <div>
        <span>
          All active vaults you have participated in are displayed here for you to claim rewards once the locking period is over.
        </span>
      </div>
    ),
  },
];
const renderTab = ({ selected }, title: string, id?: string) => {
  return (
    <div className="text-[20px] font-bold cursor-pointer" id={id ? id : undefined}>
      {title}
      {selected && <div className="w-full border-b-[2px] border-b-[#6E3A85] mt-2"></div>}
    </div>
  );
};

const renderSearchbar = ({ onChange }: { onChange: any }) => {
  return (
    <div className="relative h-min">
      <input
        type="text"
        placeholder="Search vault"
        className="placeholder:text-white-400 w-full lg:w-[354px] text-white bg-white-500 rounded-sm border-0 m-0 leading-[16px] text-3.5 py-3 pl-4 pr-12"
        name="search"
        onChange={(e) => onChange(e.currentTarget.value)}
        id="search"
      />
      <button
        type={"submit"}
        className="absolute inset-0 left-auto px-4 flex justify-center items-center hover:stroke-white-300"
      >
        <MagnifyingGlassIcon className="fill-white-300 w-5 h-5" />
      </button>
    </div>
  );
};


const VaultPage = () => {
  const {
    fetchTokenPrices,
    tokenPrices,
  } = useTokenPriceStore();
  const { vaults, needStorage, stakedByUser, claimableReward, recoverReward, stakeBalance, burntList } = useCookieJar();
  const [currentVaults, setCurrentVaults] = useState(vaults);

  useEffect(() => {
    (async () => await fetchTokenPrices())();
  }, []);
  useEffect(() => {
    setCurrentVaults(vaults)
  }, [vaults]);
  
  return (
    <PageContainer>
      <TopCard
        gradientText="xJump Staking Vaults"
        bigText="Stake xJUMP and Earn Token Rewards"
        bottomDescription={`
        Earn popular Near ecosystem tokens by locking up your xJUMP for a specified period of time! If a user exits the vault early there is no loss of staked xJUMP, however all accrued token rewards are automatically burned.
        `}
        jumpLogo
        stepItems={stepItems}
      />

      <Tab.Group>
        <div className="flex flex-wrap justify-between w-full gap-y-4">
          <Tab.List className="flex gap-10 w-full lg:w-auto">
            <Tab as="div" className="outline-none">
              {(props) => renderTab(props, "Jump Vaults")}
            </Tab>

            <Tab as="div" className="outline-none">
              {(props) => renderTab(props, "My Vaults", "my-vault")}
            </Tab>
          </Tab.List>
          {renderSearchbar({
            onChange: (s: string) => {
              if (!s) {
                setCurrentVaults(vaults)
              } else {
                setCurrentVaults(vaults.filter(item => item.name.search(s) > -1))
              }
            }
          })}
        </div>
        <div className="w-full bg-[#FFFFFF1A] rounded-[24px] p-6">
          <div className="font-bold text-[24px] text-white mb-4">Total Burned</div>
          <SimpleGrid
            spacing={"24px"}
            columns={[1, 2, 3, 4]}
          >
            {burntList && Object.entries(burntList).map((item, index) => {
              const vaultConfig = vaultConfigs.find(x => x.contract_id === item[0])
              if (!vaultConfig) {
                return null;
              }
              return (
                <Box key={`burnt-${index}`} className="w-full bg-[#FFFFFF1A] rounded-[8px] p-3 flex gap-2">
                  <img className="w-[40px] h-full" src={vaultConfig?.reward_token.icon} alt={vaultConfig?.reward_token.name} />
                  <div className="flex flex-col gap-1">
                    <div className="text-[#FFFFFF99] font-[500] text-[12px]">Total {vaultConfig.reward_token.name}</div>
                    <div className="font-bold text-[14px]">{Intl.NumberFormat("en-US").format(Number(
                      formatUnits(BigInt(item[1]), vaultConfig.reward_token.decimal)))}</div>
                  </div>
                </Box>
              )
            })}

          </SimpleGrid>
        </div>
        <Tab.Panels>
          <Tab.Panel>
            <div className="ProjectList space-y-[24px]">
              <SimpleGrid
                spacing={"24px"}
                columns={[1, 2, 3, 4]}
              >
                {currentVaults.map((vault: Vault, index) => {
                  return <VaultCard
                    key={index}
                    stakeBalance={stakeBalance?.[vault.vaultConfig.contract_id]}
                    vault={vault}
                    index={index}
                    needStorage={needStorage?.[vault.vaultConfig.contract_id]}
                    tokenPrices={tokenPrices}
                  />
                })}
              </SimpleGrid>
              <div className="mt-6 text-[#FFA500] py-2 px-3 bg-[#FFA50014] rounded-sm">
                **Note: After staking xJUMP in the Jump Vault, your xJUMP is locked until the vault distribution begins.
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            <div className="ProjectList space-y-[24px]">
              <div>
                <SimpleGrid
                  spacing={"24px"}
                  columns={[1, 2, 3, 4]}
                  className={"mb-6"}
                >
                  {
                    claimableReward && Object.entries(claimableReward).map(item => {
                      const config = vaultConfigs.find(x => x.contract_id === item[0]);
                      if (!config) return null;
                      if (!item) return null;
                      return (
                        item[1] && Number(item[1]) > 0 && (
                          <div
                            key={item[0]}
                            style={{
                              backgroundColor: "#FFFFFF1A",
                            }}
                            className="py-5 px-6 rounded-lg"
                          >
                            <h2>Claimable Reward</h2>
                            <div className="text-[14px] flex justify-between py-2 items-center">
                              <div>
                                Amount:
                              </div>
                              <div style={{ color: "#fff" }} className="font-bold flex items-center">
                                {formatUnits(BigInt(item[1].toString()), config.reward_token.decimal).toString()}
                                <img className="ml-1 w-[24px]" src={config.reward_token?.icon} alt="reward-icon" />
                              </div>
                            </div>

                            <Button color="primary" full onClick={() => recoverReward(config)}>
                              Claim
                            </Button>
                          </div>
                        )
                      )
                    })
                  }

                </SimpleGrid>
                <SimpleGrid
                  spacing={"24px"}
                  columns={[1, 2, 3, 4]}
                >
                  {stakedByUser &&
                    stakedByUser.length > 0 &&
                    stakedByUser.map((stake: any) => {
                      return (
                        <UnstakeDisplay
                          key={stake.id}
                          id={stake.id}
                          staked_amount={stake.staked_amount}
                          vault_id={stake.vault_id}
                          config={stake.vaultConfig}
                          tokenPrices={tokenPrices}
                        />
                      );
                    })}
                </SimpleGrid>
              </div>
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

    </PageContainer>
  );
}

export default VaultPage;