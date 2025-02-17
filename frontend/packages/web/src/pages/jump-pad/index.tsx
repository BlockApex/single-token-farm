import { Flex } from "@chakra-ui/react";
import { StatusEnum } from "@near/apollo";
import { TopCard, PreviewProjects, Button } from "@/components";
import { Tutorial } from "@/components";
import PageContainer from "@/components/PageContainer";
import { useChainSelector } from "@/context/chain-selector";
import MantleLaunchpad from "@/components/modules/mantle/launchpad";
import { Link } from "react-router-dom";
import TelosTestnetLaunchpad from "@/components/modules/telos-testnet/launchpad";
import TelosLaunchpad from "@/components/modules/telos/launchpad";

export function Index() {
  const stepItems = [
    {
      element: ".launchpad",
      title: "Launchpad",
      intro: (
        <div>
          <span>
            Jump launchpad is a page where you can stake your xJump, receive
            allocations and invest in crypto projects.
          </span>
        </div>
      ),
    },
    {
      title: "Previews",
      element: ".previews",
      intro: (
        <div className="flex flex-col">
          <span>
            Here you can find some of the latest projects in different stages
          </span>
        </div>
      ),
    },
  ];

  const { chain } = useChainSelector();
  if (chain === "near")
    return (
      <PageContainer>
        <Flex gap={5} className="flex-col lg:flex-row mb-[72px] relative">
          <Tutorial items={stepItems} />

          <TopCard
            gradientText="Token Launchpad "
            bigText="Jump Pad"
            bottomDescription="Jump Pad is a NEAR native token launchpad that empowers crypto currency projects with the ability to distribute tokens and raise capital from the community or private investors. "
            jumpLogo
          />
        </Flex>

        <div className="w-full previews">
          <PreviewProjects title="Sales in progress" status={StatusEnum.Open} />
          <PreviewProjects title="Upcoming sales" status={StatusEnum.Waiting} />
          <PreviewProjects title="Closed sales" status={StatusEnum.Closed} />
        </div>
      </PageContainer>
    );
  if (chain === "mantle")
    return (
      <PageContainer>
        <Flex gap={5} className="flex-col lg:flex-row mb-[72px] relative">
          <Tutorial items={stepItems} />

          <TopCard
            gradientText="Token Launchpad "
            bigText="Jump Pad"
            bottomDescription="Jump Pad is a NEAR native token launchpad that empowers crypto currency projects with the ability to distribute tokens and raise capital from the community or private investors. "
            jumpLogo
            actions={
              <Link
                to="/mantle/projects/create"
                className="text-white flex w-36 items-center justify-center rounded-md "
              >
                <Button
                  className="
							hover:bg-purple-100 hover:text-white transition-all duration-200
							"
                  white
                >
                  Create Project
                </Button>
              </Link>
            }
          ></TopCard>
        </Flex>
        <div className="w-full previews">
          <MantleLaunchpad />
        </div>
      </PageContainer>
    );
  if (chain === "telos-testnet")
    return (
      <PageContainer>
        <Flex gap={5} className="flex-col lg:flex-row mb-[72px] relative">
          <Tutorial items={stepItems} />

          <TopCard
            gradientText="Telos Testnet Token Launchpad "
            bigText="Jump Pad"
            bottomDescription="Jump Pad is a Telos token native launchpad that empowers crypto currency projects with the ability to distribute tokens and raise capital from the community or private investors. "
            jumpLogo
            actions={
              <Link
                to="/telos-testnet/projects/create"
                className="text-white flex w-36 items-center justify-center rounded-md "
              >
                <Button
                  className="
							hover:bg-purple-100 hover:text-white transition-all duration-200
							"
                  white
                >
                  Create Project
                </Button>
              </Link>
            }
          ></TopCard>
        </Flex>
        <div className="w-full previews">
          <TelosTestnetLaunchpad />
        </div>
      </PageContainer>
    );

  if (chain === "telos")
    return (
      <PageContainer>
        <Flex gap={5} className="flex-col lg:flex-row mb-[72px] relative">
          <Tutorial items={stepItems} />

          <TopCard
            gradientText="Telos Testnet Token Launchpad "
            bigText="Jump Pad"
            bottomDescription="Jump Pad is a Telos token native launchpad that empowers crypto currency projects with the ability to distribute tokens and raise capital from the community or private investors. "
            jumpLogo
            actions={
              <Link
                to="/telos/projects/create"
                className="text-white flex w-36 items-center justify-center rounded-md "
              >
                <Button
                  className="
							hover:bg-purple-100 hover:text-white transition-all duration-200
							"
                  white
                >
                  Create Project
                </Button>
              </Link>
            }
          ></TopCard>
        </Flex>
        <div className="w-full previews">
          <TelosLaunchpad />
        </div>
      </PageContainer>
    );

  return <PageContainer>Not supported</PageContainer>;
}

export default Index;