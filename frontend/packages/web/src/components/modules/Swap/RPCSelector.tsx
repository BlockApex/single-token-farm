import { useEffect, useState } from "react";

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
  Flex,
  Input,
} from "@chakra-ui/react";
import CircleGradientIcon from "./StyledIcons/CircleIcon";
import toast from "react-hot-toast";
import { useRPCStore } from "@/stores/rpc-store";


interface DefaultRPCType {
  name: string;
  url: string;
  ping: number;
}

interface RPCSelectorProps {
  isOpen: boolean;
  onClose: () => void;

}

const nearNetwork = import.meta.env.VITE_NEAR_NETWORK;

const rpcData: DefaultRPCType[] =
  nearNetwork.toLowerCase() === "mainnet"
    ? [
      {
        name: "Official NEAR RPC",
        url: "https://rpc.mainnet.near.org",
        ping: 0,
      },
      { name: "Lava RPC", url: "https://near.lava.build", ping: 0 },
      {
        name: "Fast Near RPC",
        url: "https://free.rpc.fastnear.com",
        ping: 0,
      },
    ]
    : [
      {
        name: "Official NEAR RPC",
        url: "https://rpc.testnet.near.org",
        ping: 0,
      },
    ];

export const calculateRPCPing = async (rpcUrl: string) => {
  const start = performance.now();
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "ping",
        method: "health",
        params: [],
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const end = performance.now();
    return end - start;
  } catch (error) {
    console.error(`Error pinging ${rpcUrl}:`, error);
    return null;
  }
};

export const fixDecimalPoints = (value: number) => {
  if (value) {
    return parseFloat(value.toFixed(2));
  } else {
    return 0;
  }
};

export const RPCSelector = ({
  isOpen,
  onClose,

}: RPCSelectorProps) => {
  let initialPingSelected = false;

  const [customRPCName, setCustomRPCName] = useState<string>("");
  const [customRPCUrl, setCustomRPCUrl] = useState<string>("");
  const { rpcList, selectedRPC, addRPC, selectRPC, setDefaultRPCs } = useRPCStore()


  useEffect(() => {
    const pingEndpoints = async () => {
      if (!initialPingSelected) {
        let newRpcs: DefaultRPCType[] = [];
        for (const rpc of rpcList) {
          const ping = await calculateRPCPing(rpc.url);
          newRpcs.push({
            name: rpc.name,
            url: rpc.url,
            ping: fixDecimalPoints(ping!)
          })
        }
        setDefaultRPCs(newRpcs)

        initialPingSelected = true;
      }
    };
    pingEndpoints();
  }, [initialPingSelected]);

  const addCustomRPC = async () => {
    let exist = rpcList.filter((r) => r.url === customRPCUrl)
    if (exist.length) {
      toast.error("RPC already exist");
      return
    }

    const ping = await calculateRPCPing(customRPCUrl);
    if (!ping) {
      toast.error("Rpc not available to connect, can not ping the rpc url.");
    } else {
      addRPC({
        name: customRPCName,
        url: customRPCUrl,
        ping: fixDecimalPoints(ping),
      });
      setCustomRPCName("");
      setCustomRPCUrl("")
      onClose();
    }
  };



  const rpcListRenderer = () => {
    return (
      <>
        {rpcList?.map(({ name, url, ping }, index) => (
          <Flex
            key={name}
            id={`${index + 1}`}
            bg="#47272d"
            borderRadius="xl"
            align="center"
            justify="space-between"
            mt={5}
            mb={5}
            as="button"
            width="full"
            pl={6}
            pr={6}
            className="relative"
            onClick={() => {
              // if (selectedRPC && selectedRPC.url !== url) {
                selectRPC({
                  name,
                  url,
                  ping: ping,
                });
              // }
              onClose();
              setTimeout(()=>{
                window.location.reload();
              },1000)
            }}
          >
            <Text py={2} fontSize={14} fontWeight="bold">
              {name}
            </Text>
            <Flex align="center" justifyContent="flex-end">
              <CircleGradientIcon />
              <Text ml={1} fontWeight="bold" color={"#a89d9e"}>
                {/* {fixDecimalPoints(pings[url])}ms */}
                {ping} ms
              </Text>
              {selectedRPC?.url === url ? (
                <div className="ml-2 rounded-full bg-green p-2 w-4 h-4 flex items-center justify-center" >
                  <small className="text-xs" >✓</small>
                </div>
              ) : ""}
            </Flex>
          </Flex>
        ))}
      </>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent backgroundColor="#4d3059" color="white" mt={40}>
        <ModalHeader pb={0}>RPC Selector</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box bg="#2B011A" mt={4} borderRadius="xl" p={4}>
            {rpcListRenderer()}
          </Box>
          <Box pl={3} fontSize={14} mt={4} fontWeight="bold">
            <Text m={1}>Network Name</Text>
            <Input
              borderRadius="xl"
              bg="#47272d"
              border="none"
              value={customRPCName}
              onChange={(e) => setCustomRPCName(e.target.value)}
            />
            <Text m={1}>RPC Url</Text>
            <Input
              borderRadius="xl"
              bg="#47272d"
              border="none"
              value={customRPCUrl}
              onChange={(e) => setCustomRPCUrl(e.target.value)}
            />
            <Flex justifyContent="center" mt={4}>
              <Button
                bg="#71597a"
                h="44px"
                w="84px"
                borderRadius="xl"
                fontSize={16}
                fontWeight="medium"
                onClick={() => {
                  addCustomRPC();
                }}
              >
                Add
              </Button>
            </Flex>
          </Box>
        </ModalBody>
        <ModalFooter pb={0} />
      </ModalContent>
    </Modal>
  );
};
