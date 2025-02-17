import { prisma } from "./prisma";
import express from "express";
import cors from "cors";
import { Contract, providers, utils } from "ethers";
import launchadAbi from "./Launchpad.json";
import { Launchpad } from "./contracts/Launchpad";
const provider = new providers.JsonRpcProvider(
  "https://rpc.testnet.mantle.xyz"
);
const contractAddress = "0xD7e40EA7e9FcbCd4E9BF9d986185A0f160DD4a8c";
const LaunchPad = new Contract(
  contractAddress,
  launchadAbi.abi,
  provider
) as Launchpad;
const launchpad = LaunchPad.attach(contractAddress);
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

app.get("/api/mantle-projects/:id", async (req, res) => {
  const { id } = req.params;
  const project = await prisma.mantle_launchpad_metadata.findUnique({
    where: { id },
  });
  res.json(project);
});

app.get("/api/mantle-projects", async (req, res) => {
  const projects = await prisma.mantle_launchpad_metadata.findMany();
  res.json(projects);
});

app.get("/api/fetch/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "No id provided" });
  const project = await launchpad.projects(id);
  if (project.id.toString() == "0")
    return res
      .status(404)
      .json({ success: false, message: "Project not found" });
  const Project = {
    id: project.id.toString(),
    owner: project.owner,
    privateStartTime: new Date(project.privateStartTime.toNumber() * 1000),
    privateEndTime: new Date(project.privateEndTime.toNumber() * 1000),
    publicStartTime: new Date(project.publicStartTime.toNumber() * 1000),
    publicEndTime: new Date(project.publicEndTime.toNumber() * 1000),
    totalSale: utils.formatEther(project.totalSaleAmount.toString()),
    totalSold: utils.formatEther(project.totalSoldAmount.toString()),
    publicPrice: utils.formatEther(project.publicSalePrice.toString()),
    privatePrice: utils.formatEther(project.privateSalePrice.toString()),
    saleToken: project.saleToken,
    vestingToken: project.vestingToken,
  };

  const projectMetadata = await prisma.mantle_launchpad_metadata.upsert({
    where: { id: Project.id },
    create: {
      ...Project,
    },
    update: {
      ...Project,
    },
  });

  res.json({
    success: true,
    data: projectMetadata,
  });
});

app.listen(PORT, () => {
  console.log(`Listening on port http://localhost:${PORT}`);
});
