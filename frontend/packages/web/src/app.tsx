import { Toaster } from "react-hot-toast";
import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { Header, Nav, ReportButton } from "./components";
import { BrowserRouter as Router, useNavigate, useRoutes } from "react-router-dom";
import { useWalletSelector } from "@/context/wallet-selector";
import { getTransactionState, getTransactionsAction } from "./tools";
import routes from "virtual:generated-pages-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Toast } from "./components";
import ScrollToTop from "@/tools/ScrollToTop";
import { connectDefaultNear, nearConfigs } from "./utils/config";
import {
  RPCSelector,
  calculateRPCPing,
} from "@/components/modules/Swap/RPCSelector";
import CircleGradientIcon from "@/components/modules/Swap/StyledIcons/CircleIcon";
import { GiSettingsKnobs } from "react-icons/gi";
import { useTheme } from "./hooks/theme";
import { useRPCStore } from "@/stores/rpc-store";
import { rpcData } from "@/utils/rpc";
import LostWithdraw from "./components/LostWithdraw";


const Pages = () => {
  const filteredRoutes = routes.map((item) => {
    if (item.children) {
      return {
        ...item,
        children: item.children?.filter((children) => {
          if (
            !children.path?.includes("tutorial") &&
            !children.path?.includes("config")
          ) {
            return children;
          }
        }),
      };
    }

    return item;
  });
  return useRoutes(filteredRoutes);
};

const transactionHashes = new URLSearchParams(window.location.search).get(
  "transactionHashes"
);

const officialRPC = {
  name: "Official NEAR RPC",
  url: nearConfigs.nodeUrl,
};

function App() {
  let rpcPingRetries = 0;
  const allowedRPCPingRetries = 3;
  const { accountId } = useWalletSelector();
  const [isRPCSelectorOpen, setIsRPCSelectorOpen] = useState<boolean>(false);
  const [lostOpen, setLostOpen] = useState(false);
  const { jumpGradient, glassyWhiteOpaque } = useTheme();

  const { selectedRPC, selectRPC, account, setAccount } = useRPCStore()


  useEffect(() => {
    if (!accountId || !transactionHashes) {
      return;
    }

    (async () => {
      if (transactionHashes) {
        window.localStorage.setItem("lastTransactionHashes", transactionHashes);
      }

      const transactions = transactionHashes.split(",");

      const states: any[] = [];

      for (let i = 0; i < transactions.length; i++) {
        const state = await getTransactionState(transactions[i], accountId);

        states.push(state);
      }

      const action = getTransactionsAction(states);

      if (!action) {
        return;
      }

      toast.custom(({ visible }) => <Toast visible={visible} {...action} />);
    })();
  }, [accountId]);

  // calculate rpc ping and set rpc.
  useEffect(() => {
    if (!selectedRPC.ping) {
      
      if (rpcPingRetries < allowedRPCPingRetries) {
        rpcPingRetries = rpcPingRetries + 1;
        calculateRPCPing(selectedRPC.url).then((value) => {
          selectRPC({
            ...selectedRPC,
            ping: parseFloat(value?.toFixed(2) || "0"),
          });
        });
      }
    }
  }, [selectedRPC, rpcPingRetries]);

  const setConnectedAccount = async () => {
    if (accountId) {
      if (!account || !account?.accountId) {
        const near = await connectDefaultNear(nearConfigs);
        const response = await near.account(accountId as string);
        setAccount(response)
      }
    }
  }


  useEffect(() => {
    
    setConnectedAccount()
  }, [accountId])


  const cardBg = useColorModeValue(jumpGradient, jumpGradient);

  return (
    <Router>
      {accountId ? (
      <Flex
      align="center"
      onClick={() => {
        setLostOpen(true);
      }}
      fontWeight="bold"
      fontSize="14px"
      my={2}
      pl="20px"
      pr="20px"
      color="#B4A3A9"
      as="button"
      bg={cardBg}
      borderRadius="lg"
      className="fixed bottom-[60px] right-[24px] z-40 cursor-pointer hover:opacity-[0.95] space-x-[12px]"
    >
      <Text ml="4px" mr="4px">
        Lost & Withdraw
      </Text>
      
    </Flex>
      ):""}

      <Flex
        align="center"
        onClick={() => {
          setIsRPCSelectorOpen(true);
        }}
        fontWeight="bold"
        fontSize="14px"
        my={2}
        pl="20px"
        pr="20px"
        color="#B4A3A9"
        as="button"
        bg={cardBg}
        borderRadius="lg"
        className="fixed bottom-[20px] right-[24px] z-40 cursor-pointer hover:opacity-[0.95] space-x-[12px]"
      >
        <Text ml="4px" mr="4px">
          {selectedRPC?.name}
        </Text>
        <CircleGradientIcon />
        <Text ml="4px">{selectedRPC?.ping}(ms)</Text>
        <Box ml="4px">
          <GiSettingsKnobs
            style={{ transform: "rotate(-90deg)", color: "white" }}
          />
        </Box>
      </Flex>
      {/* <ReportButton />
      <ScrollToTop /> */}
      <Header />
      <div className="w-full flex">
        <Nav />
        <Pages />
      </div>
      <Toaster position="top-center" />
      <RPCSelector
        isOpen={isRPCSelectorOpen}
        onClose={() => {
          setIsRPCSelectorOpen(false);
        }}
      />
      <LostWithdraw open={lostOpen} handleClose={() => setLostOpen(false)} />
    </Router>
  );
}

export default App;


