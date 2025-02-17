import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
} from "@chakra-ui/react";
import { Card } from "@/components";

export function ProjectTabUserAllocations({
  projectUserComponent,
  projectAllocationsComponent,
}) {
  return (
    <Card className="col-span-12 lg:col-span-6 xl:col-span-4 relative project-allocations">
      <Flex direction="column" justify="flex-start" height="100%">
        <Tabs variant="soft-rounded" colorScheme="gray" className="h-full">
          <TabList>
            <Tab>User Area</Tab>
            <Tab>Join Project</Tab>
          </TabList>
          <TabPanels className="h-full">
            <TabPanel className="h-full">{projectUserComponent}</TabPanel>
            <TabPanel>{projectAllocationsComponent}</TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </Card>
  );
}
