import PageContainer from "@/components/PageContainer";
import { parseRawIDOData } from "@/components/modules/telos-testnet/helper/helper";
import MantleProjectInfo from "@/components/modules/telos-testnet/launchpad/project-info";
import MantleProjectInvestment from "@/components/modules/telos-testnet/launchpad/project-investment";
import MantleProjectStats from "@/components/modules/telos-testnet/launchpad/project-stats";
import MantleUserArea, {
  MantleStatusEnum,
} from "@/components/modules/telos-testnet/launchpad/project-user-area";
import {
  useERC20Metadata,
  useMantleIdoProjectQuery,
} from "@/hooks/modules/telos-testnet/launchpad";
import { Spinner } from "@chakra-ui/react";
import { StatusEnum } from "@near/apollo";
import { parse } from "date-fns";
import { JsonRpcProvider } from "ethers";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router";
import { twMerge } from "tailwind-merge";
import { telosTestnet } from "viem/chains";
import { useAccount, useContractWrite } from "wagmi";
const TELOS_TESTNET_LAUNCHPAD_CONTRACT =
  "0x8fC60f2E8D707A8589b4F8c6EEA1b56A0A230a69";
export default function Project() {
  const [whitelistInput, setWhitelistInput] = useState("");
  const { id } = useParams();
  const { address } = useAccount();
  const [tab, setTab] = useState("pool");

  const [projectDeatils, setProjectDetails] = useState({
    id: "",
    name: "",
    description: "",
    logo: null,
    website: null,
    whitepaper: null,
    owner: "",
  });
  const { project, isLoading, isError, isFetching, isRefetching } =
    useMantleIdoProjectQuery(id || "");

  const parsedProject = parseRawIDOData(project);
  const status = useCallback(() => {
    if (!parsedProject) return MantleStatusEnum.Upcoming;
    if (parseInt(parsedProject.privateStartTime) * 1000 > Date.now()) {
      return MantleStatusEnum.Upcoming;
    }

    if (
      parseInt(parsedProject.privateStartTime) * 1000 < Date.now() &&
      parseInt(parsedProject.privateEndTime) * 1000 > Date.now()
    ) {
      return MantleStatusEnum.Private;
    }

    if (
      parseInt(parsedProject.publicStartTime) * 1000 < Date.now() &&
      parseInt(parsedProject.publicEndTime) * 1000 > Date.now()
    ) {
      return MantleStatusEnum.Public;
    }

    if (parseInt(parsedProject.publicEndTime) * 1000 < Date.now()) {
      return MantleStatusEnum.Closed;
    }

    return MantleStatusEnum.Upcoming;
  }, [parsedProject]);
  useEffect(() => {
    if (!parsedProject) return;
    const id = parsedProject.id;
    if (!id) return;
    fetchProjectDeatils(id);
    async function fetchProjectDeatils(id) {
      const res = await fetch(
        `https://jump-pg-prisma-api-production.up.railway.app/api/telos-testnet-projects/${id}`
      );
      const data = await res.json();
      setProjectDetails(data);
    }
  }, [parsedProject?.id]);

  useEffect(() => {
    const url =
      "https://jump-pg-prisma-api-production.up.railway.app/api/fetch/telos-testnet/" +
      id;
    fetch(url).then((res) => res.json().then((data) => console.log(data)));
  }, []);

  const {
    name: saleTokenName,
    symbol: saleTokenSymbol,
    decimals: saleTokenDecimals,
  } = useERC20Metadata(parsedProject?.saleToken || "");

  const {
    name: vestingTokenName,
    symbol: vestingTokenSymbol,
    decimals: vestingTokenDecimals,
  } = useERC20Metadata(parsedProject?.vestingToken || "");

  /**function addToWhiteListMany(
        uint256 _id,
        address[] memory _investors,
        uint256[] memory _allowanceAmounts
    ) */

  const { writeAsync: addToWhiteListMany } = useContractWrite({
    address: TELOS_TESTNET_LAUNCHPAD_CONTRACT,
    abi: [
      {
        inputs: [
          {
            internalType: "uint256",
            name: "_id",
            type: "uint256",
          },
          {
            internalType: "address[]",
            name: "_investors",
            type: "address[]",
          },
          {
            internalType: "uint256[]",
            name: "_allowanceAmounts",
            type: "uint256[]",
          },
        ],
        name: "addToWhiteListMany",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "addToWhiteListMany",
    //the list of input will be
    /**
     *  address [space] amount
     *  address [space] amount
     */

    value: "0" as any,
  });

  async function handleWhitelist() {
    const addresses = whitelistInput
      .split("\n")
      .map((line) => line.split(" ")[0])
      .filter((line) => !!line);
    const amounts = whitelistInput
      .split("\n")
      .map((line) => line.split(" ")[1])
      .filter((line) => !!line);

    console.log(addresses, amounts);

    if (addresses.length != amounts.length) {
      toast.error("Address and amount mismatch,please check again");
      return;
    }

    if (!addToWhiteListMany) {
      toast.error("Something went wrong, please try again later");
    } else {
      const tx = await addToWhiteListMany({
        args: [
          parsedProject?.id,
          addresses as any,
          amounts.map((amount) => BigInt(amount)),
        ],
      });
      const provider = new JsonRpcProvider("https://testnet.telos.net/evm");
      await toast.promise(provider.waitForTransaction(tx.hash, 2), {
        loading: "Waiting for transaction to confirm",
        success: "Transaction confirmed",
        error: "Transaction failed",
      });
    }
  }

  if (parsedProject?.id == "0")
    return <PageContainer>Project not found</PageContainer>;
  if (!address) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-white text-xl">Please connect your wallet</div>
        </div>
      </PageContainer>
    );
  }
  if (isFetching || isRefetching)
    return (
      <PageContainer>
        <div className="flex items-center justify-center h-screen">
          <Spinner thickness="4px" width={128} height={128} />
        </div>
      </PageContainer>
    );

  return (
    <PageContainer>
      <div className=" flex justify-center flex-col  space-y-[24px] xl:space-y-[0xp] xl:space-x-[24px] xl:flex-row ">
        <div className="xl:max-w-[748px] w-full">
          <MantleProjectInfo
            projectName={projectDeatils?.name}
            projectDescription={projectDeatils?.description}
            image={projectDeatils?.logo || ""}
            projectStatus={status() || MantleStatusEnum.Upcoming}
            projectSubTitle={parsedProject?.vestingToken}
            website={projectDeatils?.website || ""}
            whitepaper={projectDeatils?.whitepaper || ""}
          />

          <div className="bg-[rgba(255,255,255,0.1)] p-[24px] rounded-[20px] w-full relative details">
            <div className="flex-grow space-x-[24px] mb-[67px]">
              <button
                onClick={() => setTab("pool")}
                className={twMerge(
                  "py-[10px] px-[24px] rounded-[10px] text-white border border-[rgba(255,255,255,0.1)]",
                  tab === "pool" && "bg-white text-[#431E5A] border-white"
                )}
              >
                <span className="font-[700] text-[16px] tracking-[-0.04em]">
                  Pool details
                </span>
              </button>

              <button
                onClick={() => setTab("investiments")}
                disabled={!address}
                className={twMerge(
                  "py-[10px] px-[24px] rounded-[10px] text-white border border-[rgba(255,255,255,0.1)] disabled:cursor-not-allowed disabled:opacity-[0.5]",
                  tab === "investiments" &&
                    "bg-white text-[#431E5A] border-white"
                )}
              >
                <span className="font-[700] text-[16px] tracking-[-0.04em]">
                  My investments
                </span>
              </button>
            </div>

            {tab === "pool" && parsedProject && (
              <MantleProjectStats
                projectData={parsedProject}
                saleTokenSymbol={saleTokenSymbol}
                vestingTokenSymbol={vestingTokenSymbol}
                saleTokenName={saleTokenName}
                vestingTokenName={vestingTokenName}
                vestingTokenDecimals={18}
                saleTokenDecimals={18}
              />
            )}

            {tab === "investiments" && parsedProject && (
              <MantleProjectInvestment
                projectData={parsedProject}
                saleTokenSymbol={saleTokenSymbol}
                vestingTokenSymbol={vestingTokenSymbol}
                saleTokenName={saleTokenName}
                vestingTokenName={vestingTokenName}
              />
            )}
          </div>
        </div>
        {parsedProject && (
          <MantleUserArea
            projectData={parsedProject}
            saleTokenSymbol={saleTokenSymbol || ""}
            disabled={
              status() === MantleStatusEnum.Upcoming ||
              status() === MantleStatusEnum.Closed
            }
          />
        )}
      </div>
      {projectDeatils?.owner == address && (
        <div className="flex flex-col gap-3 justify-center items-center">
          <label className="text-white">whitelist wallet addresses</label>
          <textarea
            className="bg-white/10 backdrop-blur-md rounded-lg p-2 w-1/2"
            rows={5}
            value={whitelistInput}
            onChange={(e) => setWhitelistInput(e.target.value)}
          />
          <label className="text-white">whitelist amount</label>

          <button
            onClick={handleWhitelist}
            className="bg-white/10 backdrop-blur-md rounded-lg p-2 w-1/2"
          >
            whitelist
          </button>
        </div>
      )}
    </PageContainer>
  );
}
