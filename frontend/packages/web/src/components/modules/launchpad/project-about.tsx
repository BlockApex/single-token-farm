import { Card } from "@/components";
import { Text, Flex, Skeleton } from "@chakra-ui/react";
import { LaunchpadListing } from "@near/apollo";

export function ProjectAbout({
  launchpadProject,
  isLoading,
}: {
  isLoading: boolean;
  launchpadProject: LaunchpadListing;
}) {
  return (
    <Card className="w-full col-span-12 lg:col-span-6 xl:col-span-6">
      <Flex className="flex-col space-y-[12px] h-full w-full">
        <Text
          fontWeight="800"
          fontFamily="Inter"
          letterSpacing="-0.05em"
          fontSize="40px"
          as="h1"
        >
          About
        </Text>

        <Skeleton
          isLoaded={!isLoading}
          className="w-full min-h-[48px] rounded-[16px]"
        >
          <Text children={launchpadProject?.description_project} />
        </Skeleton>
      </Flex>
    </Card>
  );
}
