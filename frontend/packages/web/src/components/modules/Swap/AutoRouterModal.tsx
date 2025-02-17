import { Route, TokenMetadataType } from "@/utils/types";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Box,
} from "@chakra-ui/react";
import { formatNumberWithSuffix } from "@/utils/conversion";
import { ReactFlow, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { RoundCross } from "@/assets/svg";

import TokenNode from "./TokenNode";

interface AutoRouterProps {
  tokenIn: TokenMetadataType;
  tokenOut: TokenMetadataType;
  routes?: Route[];
  isOpen: boolean;
  onClose: () => void;
  inputTokenAmount: string | undefined;
  outputTokenAmount: string | undefined;
}

export const AutoRouter = ({
  isOpen,
  onClose,
  routes,
  tokenIn,
  tokenOut,
  inputTokenAmount,
  outputTokenAmount,
}: AutoRouterProps) => {
  const nodes: any = [];
  const edges: any = [];

  if (!routes?.length) return <></>;
  const nodeStyles = {
    backgroundColor: "#47272D", // Example color
    color: "#ffff", // Example text color
    borderRadius: "12px",
    padding: "15px",
    fontSize: "16px",
    fontWeight: "700",
    minWidth: 200,
  };
  const inputTokenNode = {
    id: tokenIn.address,
    sourcePosition: "right",
    type: "input",
    data: {
      label: (
        <div className="flex items-center justify-start">
          <img src={tokenIn?.icon!} width={40} height={40} className="mr-2" />
          <p className="font-bold">
            {inputTokenAmount
              ? formatNumberWithSuffix(parseFloat(inputTokenAmount))
              : ""}{" "}
            {tokenIn.symbol}
          </p>
        </div>
      ),
    },
    position: { x: 0, y: 0 },
    style: { ...nodeStyles },
  };

  let yPosition = 0;

  let longestPath = 2;

  const createdRoutes: any[] = [];
  routes.slice(0, 1).map((route) => {
    const subRoutes: any[] = [];
    const { path } = route.route;

    longestPath = longestPath > path.length ? longestPath : path.length;
    if (path.length > 2) {
      path.map((tokenAddress, index) => {
        if (index === 0 || index === path.length - 1) {
          return;
        } else {
          subRoutes.push({
            id: tokenAddress,
            sourcePosition: "right",
            targetPosition: "left",
            data: { label: tokenAddress.split(".")[0].toUpperCase() },
            position: { x: index * 250, y: 0 },
            style: { ...nodeStyles },
          });
        }
      });
    } else {
      createdRoutes.push({ length: 0, path: [] });
    }

    if (subRoutes.length) {
      createdRoutes.push({ length: path.length - 2, path: subRoutes });
    }

    yPosition = yPosition + 80;
  });

  const outputTokenNode = {
    id: tokenOut.address,
    sourcePosition: "right",
    targetPosition: "left",
    data: {
      label: (
        <div className="flex items-center justify-start">
          <img src={tokenOut?.icon!} width={40} height={40} className="mr-4" />
          <p className="font-bold">
            {outputTokenAmount
              ? formatNumberWithSuffix(parseFloat(outputTokenAmount))
              : ""}{" "}
            {tokenOut.symbol}
          </p>
        </div>
      ),
    },
    position: { x: (longestPath - 1) * 250, y: 0 },
    style: { ...nodeStyles },
  };

  nodes.push(inputTokenNode);
  for (const createdRoute of createdRoutes) {
    if (createdRoute.length) {
      createdRoute.path.map((path, index) => {
        if (index === 0) {
          nodes.push(path);
          edges.push({
            id: `${inputTokenNode.id}-${path.id}`,
            source: inputTokenNode.id,
            type: "straight",
            target: path.id,
            animated: false,
            style: { stroke: "#aa99a4", strokeWidth: 3 },
          });
          if (createdRoute.length === 1) {
            edges.push({
              id: `${path.id}-${outputTokenNode.id}`,
              source: path.id,
              type: "straight",
              target: outputTokenNode.id,
              animated: false,
              style: { stroke: "#aa99a4", strokeWidth: 3 },
            });
          }
        } else if (index === createdRoute.length - 1) {
          nodes.push(path);
          edges.push({
            id: `${createdRoute.path[index - 1].id}-${path.id}`,
            source: createdRoute.path[index - 1].id,
            type: "straight",
            target: path.id,
            animated: false,
            style: { stroke: "#aa99a4", strokeWidth: 3 },
          });
          edges.push({
            id: `${path.id}-${outputTokenNode.id}`,
            source: path.id,
            type: "straight",
            target: outputTokenNode.id,
            animated: false,
            style: { stroke: "#aa99a4", strokeWidth: 3 },
          });
        } else {
          nodes.push(path);
          edges.push({
            id: `${createdRoute.path[index - 1].id}-${path.id}`,
            source: createdRoute.path[index - 1].id,
            type: "straight",
            target: path.id,
            animated: false,
            style: { stroke: "#aa99a4", strokeWidth: 3 },
          });
        }
      });
    } else {
      edges.push({
        id: `${inputTokenNode.id}-${outputTokenNode.id}`,
        source: inputTokenNode.id,
        type: "straight",
        target: outputTokenNode.id,
        animated: false,
        style: { stroke: "#aa99a4", strokeWidth: 3 },
      });
    }
  }
  nodes.push(outputTokenNode);

  const proOptions = { hideAttribution: true };

  nodes.forEach((node) => {
    node.connectable = false; // Disable connection handles
  });

  const autoRouterPath = () => {
    return (
      <ReactFlow
        style={{ background: "#2B011A", color: "black", fontWeight: "bold" }}
        nodes={nodes}
        edges={edges}
        fitView
        proOptions={proOptions}
        panOnScroll={false} // Disable panning on scroll
        zoomOnScroll={false} // Disable zooming on scroll
        zoomOnDoubleClick={false} // Disable zooming on double click
        panOnDrag={false} // Disable panning on drag
        nodesDraggable={false} // Disable dragging nodes
        zoomOnPinch={false} // Disable zooming on pinch
        preventScrolling={false}
        maxZoom={0.7}
      ></ReactFlow>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent
        backgroundColor="#4d3059"
        color="white"
        maxW={{ base: "90%", sm: "300px", xl: "45%" }}
      >
        <ModalHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl text-white tracking-tighter font-bolder leading-6 flex items-center">
              Routing
            </h2>
            <button onClick={onClose}>
              <RoundCross />
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          {/* <Box bg="#2B011A" borderRadius="lg" width="full" height={200}>
            {autoRouterPath()}
          </Box> */}
          <div className="w-full h-auto relative flex items-center justify-between">
            <div className="w-full  overflow-x-scroll scroll-container">
              {routes?.map((item, i) => {
                const { route } = item;
                let LENGTH = route.pools.length;
                return (
                  <section
                    key={i}
                    className="my-3 flex items-center justify-between"
                  >
                    <p className="font-bold text-white text-sm mr-4">
                      {item?.percent}%
                    </p>
                    <div className="flex items-center justify-between w-full z-10">
                      {/* <div className="bg-[#47272D] text-white rounded-lg px-3 py-2 text-sm font-bold  min-w-[160px]">
                        <div className="flex items-center justify-start">
                          {tokenIn?.icon ? (
                            <img
                              src={tokenIn?.icon!}
                              width={25}
                              height={25}
                              className="mr-2"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
                          )}
                          <p className="font-bold text-white text-sm">
                            {inputTokenAmount
                              ? formatNumberWithSuffix(
                                  parseFloat(inputTokenAmount)
                                )
                              : ""}{" "}
                            {tokenIn.symbol}
                          </p>
                        </div>
                      </div> */}
                      {/* <div className="flex-grow h-[4px] bg-white-500 min-w-[20px]" /> */}

                      {route?.pools?.length > 1 ? (
                        route?.pools?.map((p, i) => {
                            let amountIn = p?.swap_path?.amount_in;
                            let amountOut = p?.swap_path?.amount_out;

                            if(i === LENGTH - 1){
                              return(
                                <>
                                <>
                                <TokenNode key="in" tokenIn={i===0 && tokenIn.isNear && tokenIn}  address={p?.swap_path?.token_in} amount={amountIn} />
                                <div className="w-full flex flex-col items-center justify-center" >
                                <p className="text-sm font-bold mb-2" >{p?.liquidity_provider}</p>
                                <div className="flex-grow h-[4px] bg-white-500 min-w-[100px] w-full mb-6"></div>
                                </div>
                                </>
                                <>
                                <TokenNode key="out" tokenIn={i===0 && tokenIn.isNear && tokenIn}  address={p?.swap_path?.token_out} amount={amountOut} />
                                </>
                                </>
                              )
                            }
                            return (
                              <>
                              <TokenNode tokenIn={i===0 && tokenIn.isNear && tokenIn}  address={p?.swap_path?.token_in} amount={amountIn} />
                              <div className="flex flex-col items-center justify-center" >
                              <p className="text-sm font-bold mb-2" >{p?.liquidity_provider}</p>
                              <div className="flex-grow h-[4px] bg-white-500 min-w-[100px] mb-6"></div>
                              </div>
                              </>
                            );
                          })
                      ) : (route?.pools?.map((p, i) => {
                        let amountIn = p?.swap_path?.amount_in;
                        let amountOut = p?.swap_path?.amount_out;

                          return(
                            <>
                            <>
                            <TokenNode key="in" tokenIn={i===0 && tokenIn.isNear && tokenIn}  address={p?.swap_path?.token_in} amount={amountIn} />
                            <div className="w-full flex flex-col items-center justify-center" >
                            <p className="text-sm font-bold mb-2" >{p?.liquidity_provider}</p>
                            <div className="flex-grow h-[4px] bg-white-500 min-w-[100px] w-full mb-6"></div>
                            </div>
                            </>
                            <>
                            <TokenNode key="out" tokenIn={{}}  address={p?.swap_path?.token_out} amount={amountOut} />
                            </>
                            </>
                          )
                      }))}
                      {/* <div className="flex-grow h-[4px] bg-white-500 min-w-[20px]" />
                      <div className="bg-[#47272D] text-white rounded-lg px-3 py-2 text-sm font-bold min-w-[160px]">
                        <div className="flex items-center justify-start">
                          {tokenOut?.icon ? (
                            <img
                              src={tokenOut?.icon!}
                              width={25}
                              height={25}
                              className="mr-2"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[#594661] border border-white border-opacity-20 mr-2"></div>
                          )}
                          <p className="font-bold text-white text-sm">
                            {outputTokenAmount
                              ? formatNumberWithSuffix(
                                  parseFloat(outputTokenAmount)
                                )
                              : ""}{" "}
                            {tokenOut.symbol}
                          </p>
                        </div>
                      </div> */}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};
