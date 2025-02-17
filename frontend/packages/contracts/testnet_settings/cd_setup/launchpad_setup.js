const nearAPI = require("near-api-js");
const { BN } = require("near-workspaces");

const {
  registerContracts,
  deployToken,
  parseAccountName,
  increaseTimeStamp,
} = require("./utils");

const tokenArray = [
  {
    spec: "ft-1.0.0",
    name: "NEKO",
    symbol: "NEKO",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Layer_1' x='0px' y='0px' width='46px' height='46px' viewBox='0 0 46 46' enable-background='new 0 0 46 46' xml:space='preserve'%3E%3Cimage id='image0' width='46' height='46' x='0' y='0' href='data:image/png;base64,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 OjAwO8gregAAAABJRU5ErkJggg=='/%3E%3C/svg%3E",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "0",
      project_name: "NEKO",
      description_token:
        "NEKO is NEAR Protocol`s first meme coin. It features a deflationary design and intuitive tokenomics that reward holders by taxing sellers.",
      description_project:
        "It is quite difficult to get the general public excited about cryptocurrencies and NFTs. The space can be intimidating for some newcomers, but meme coins have proven to be an effective onboarding strategy in the past.",
      discord: null,
      twitter: "https://twitter.com/goodfortuneNFT",
      telegram: null,
      website: null,
      whitepaper: null,
    },
  },
  {
    spec: "ft-1.0.0",
    name: "Flux Token",
    symbol: "FLX",
    icon: "data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg width='140px' height='140px' viewBox='0 0 140 140' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3EFlux Logo New%3C/title%3E%3Cdefs%3E%3CradialGradient cx='50%25' cy='0%25' fx='50%25' fy='0%25' r='248.533062%25' gradientTransform='translate(0.500000,0.000000),scale(1.000000,0.393939),rotate(90.000000),translate(-0.500000,-0.000000)' id='radialGradient-1'%3E%3Cstop stop-color='%23FE84FC' offset='0%25'%3E%3C/stop%3E%3Cstop stop-color='%232ED1FF' offset='100%25'%3E%3C/stop%3E%3C/radialGradient%3E%3C/defs%3E%3Cg id='logos' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Cg id='Group' transform='translate(-143.000000, -251.000000)'%3E%3Cg id='Group-2' transform='translate(0.000000, 251.000000)'%3E%3Cg id='Flux-Logo' transform='translate(143.000000, 0.000000)'%3E%3Cg id='Flux-Logo-New' transform='translate(70.000000, 70.000000) rotate(90.000000) translate(-70.000000, -70.000000) '%3E%3Ccircle id='Oval' fill='%23FFFFFF' cx='70' cy='70' r='70'%3E%3C/circle%3E%3Crect id='Rectangle' fill='%230F0E25' transform='translate(70.000000, 83.000000) rotate(90.000000) translate(-70.000000, -83.000000) ' x='57' y='50' width='26' height='66' rx='13'%3E%3C/rect%3E%3Cpath d='M50,30 C57.1797017,30 63,35.8202983 63,43 L63,96 L63,96 L50,96 C42.8202983,96 37,90.1797017 37,83 L37,43 C37,35.8202983 42.8202983,30 50,30 Z' id='Rectangle' fill='%230F0E25'%3E%3C/path%3E%3Cpath d='M63,44 L76,44 C83.1797017,44 89,49.8202983 89,57 L89,97 C89,104.179702 83.1797017,110 76,110 C68.8202983,110 63,104.179702 63,97 L63,44 L63,44 Z' id='Rectangle' fill='url(%23radialGradient-1)'%3E%3C/path%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "1",
      project_name: "Flux",
      description_token: "Build your protocol on secure data",
      description_project:
        "Flux is the trustless data layer for web3. Flux is a cross-chain oracle that provides smart contracts with access to economically secure data feeds on anything. Flux’s Economically Secured Oracle enables protocols to request crowdsourced, API, and Price Feed Data from any on or off-chain source. Flux is partnered with top validator companies across crypto like Figment.",
      discord: "https://discord.com/invite/wsNwx2N75B",
      twitter: "https://t.me/fluxprotocol",
      telegram: "https://twitter.com/fluxprotocol",
      website: "https://www.fluxprotocol.org/",
      whitepaper: null,
    },
  },
  {
    spec: "ft-1.0.0",
    name: "ChainLink Token",
    symbol: "LINK",
    icon: "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Ccircle fill='%232A5ADA' cx='16' cy='16' r='16'/%3E%3Cpath d='M16 6l-1.799 1.055L9.3 9.945 7.5 11v10l1.799 1.055 4.947 2.89L16.045 26l1.799-1.055 4.857-2.89L24.5 21V11l-1.799-1.055-4.902-2.89L16 6zm-4.902 12.89v-5.78L16 10.22l4.902 2.89v5.78L16 21.78l-4.902-2.89z' fill='%23FFF'/%3E%3C/g%3E%3C/svg%3E",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "2",
      project_name: "Chainlink",
      description_token:
        "Securely connect smart contracts with off-chain data and services",
      description_project:
        "Chainlink decentralized oracle networks provide tamper-proof inputs, outputs, and computations to support advanced smart contracts on any blockchain.",
      discord: "https://discord.com/invite/chainlink",
      twitter: "https://twitter.com/chainlink",
      telegram: "https://t.me/chainlinkofficial",
      website: "https://chain.link/",
      whitepaper: null,
    },
  },
  {
    spec: "ft-1.0.0",
    name: "PARAS",
    symbol: "PARAS",
    icon: "data:image/png;base64,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",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "3",
      project_name: "Paras",
      description_token: "Governance toke for the Paras Marketplace",
      description_project:
        "Launched in December 2020, Paras is a digital art card marketplace built on NEAR that offers artists more control of their creations and digital scarcity for collectors—using NEAR as the medium of exchange between creators and collectors. The name Paras (pronounced Pa-RAS) translates to “face” or “persona,” and “equal,” in Bahasa Indonesian. The vision for Paras is to create a space for artists to cultivate and act on compounded momentum.",
      discord: null,
      twitter: null,
      telegram: null,
      website: "https://paras.id/",
      whitepaper: null,
    },
  },
  {
    spec: "ft-1.0.0",
    name: "PembRock",
    symbol: "PEM",
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cGF0aCBmaWxsPSIjMUUxRTFGIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0xMTMuMiAxNzAuNDJhODMuNTEgODMuNTEgMCAwIDAgNzAuNy04Mi42IDgzLjUgODMuNSAwIDAgMC01Ljc4LTMwLjYxbDEzLjY4LTIzLjg3aC0yOC4wOGE4My4xIDgzLjEgMCAwIDAtNjMuMi0yOS4wNiA4My4xIDgzLjEgMCAwIDAtNjMuMiAyOS4wNkg4LjU4TDIyLjcgNTcuNzhhODMuNSA4My41IDAgMCAwLTUuNTUgMzAuMDUgODMuNTEgODMuNTEgMCAwIDAgNzAuNiA4Mi41N2wxMi43NyAyMi4xMSAxMi42Ny0yMi4xWiIgY2xpcC1ydWxlPSJldmVub2RkIi8+PHBhdGggZmlsbD0iI0VBRUNFRiIgZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTAwLjUzIDcuOTJBNzguNjYgNzguNjYgMCAwIDAgNDAuNjEgMzUuNmwtMS4xOCAxLjE3SDE2LjY1TDI4LjIzIDU3LjFsLS42OCAxLjc3Yy0zLjQgOC44Ny02LjA3IDE4LjEtNi4wNyAyOC4yIDAgMzkuNzcgMjkuMDMgNzMuMTQgNjYuOTQgNzlsMS44Ni4zIDEwLjM0IDE3Ljc5IDEwLjA2LTE3Ljc4IDEuODctLjNjMzcuOTUtNS44MSA2Ny4wMy0zOC44IDY3LjAzLTc4LjYxIDAtMTAuMy0yLjI0LTIwLjEzLTUuNzgtMjkuMTVsLS42OS0xLjc4IDExLjE4LTE5Ljc3aC0yMi42NWwtMS4xOC0xLjE3YTc4LjY2IDc4LjY2IDAgMCAwLTU5LjkzLTI3LjY3Wk0zNS44NCAyOS4wNEE4Ni40OCA4Ni40OCAwIDAgMSAxMDAuNTQgMGE4Ni40OCA4Ni40OCAwIDAgMSA2NC42OCAyOS4wNGgzMi42N0wxODEuODEgNTcuMmMzLjQ2IDkuNDMgNS42NSAxOS42MyA1LjY1IDMwLjI2IDAgNDMuMTItMzEuMDIgNzguOTUtNzEuODMgODYuMTRMMTAwLjY1IDIwMGwtMTUuMy0yNi40MmMtNDAuNzctNy4yMy03MS43NC00My40NC03MS43NC04Ni41MyAwLTEwLjQgMi42Mi0xOS45OSA1LjkzLTI5LjI1TDMgMjkuMDRoMzIuODRaIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiLz48cGF0aCBmaWxsPSIjRjY4MjFGIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGQ9Im0zMS44NSA0NS40MSA2OC43NSAxMjAuNDIgOC4wNi0xNC4xMi0yNy40Ny00OC4xM2gyNC4zTDcyLjMzIDQ1LjRIMzEuODVabTQ5LjE5IDAgNDQuMTUgNzcuMzIgNy42Ny0xMy40NC0yOC4xOC00OS4zNGg4LjM3bDIzLjk5IDQyLjAyTDE0NSA4OGwtMTYuMDItMjguMDVoMTYuNDJsLTQuNDMgNy43NiA3LjgxIDEzLjcgMjAuNTctMzZIODEuMDRaTTU2LjMgNTkuOTVsMTYuNjIgMjkuMTFoOC42N0w2NC45NyA1OS45NUg1Ni4zWk00NC4yIDg0LjZhNTYuNjUgNTYuNjUgMCAwIDAgMzEuMDUgNTQuMTJsNi4zMiAxMS4wMWE2NC40NSA2NC40NSAwIDAgMS00NS4yOS02MS43YzAtNC45Ny41Ni05LjggMS42LTE0LjQ0bDYuMzMgMTEuMDJabTc5LjY1LTQ3LjlhNTUuNDYgNTUuNDYgMCAwIDAtMjMuNjYtNS4yNyA1NS40NSA1NS40NSAwIDAgMC0yMy42NSA1LjI2SDYxLjVhNjMuMjYgNjMuMjYgMCAwIDEgMzguNy0xMy4xNmMxNC41NCAwIDI3Ljk1IDQuOSAzOC43IDEzLjE2aC0xNS4wNVoiIGNsaXAtcnVsZT0iZXZlbm9kZCIvPjxwYXRoIGZpbGw9IiNGNjgyMUYiIGQ9Ik00NC4xIDg4LjAyYzAtMS4xNC4wNC0yLjI4LjEtMy40MWwtNi4zLTExLjAyYTY1LjI2IDY1LjI2IDAgMCAwLTEuNiAxNC40MyA2NC40NSA2NC40NSAwIDAgMCA0NS4yOCA2MS43MWwtNi4zMS0xMWE1Ni42NSA1Ni42NSAwIDAgMS0zMS4xNS01MC43Wm0xMTMuMTIgMGMwLTEuMTQtLjItMi4yOC0uMjctMy40MWw2LjI1LTExLjAyYTY1LjMxIDY1LjMxIDAgMCAxIDEuODQgMTQuNDMgNjQuNDUgNjQuNDUgMCAwIDEtNDUuMjkgNjEuNzFsNi4zMS0xMWE1Ni42NSA1Ni42NSAwIDAgMCAzMS4xNi01MC43WiIvPjwvc3ZnPg==",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "4",
      project_name: "Pembrock Finance",
      description_token:
        "Welcome to the first leveraged yield farming application on NEAR Protocol.",
      description_project:
        "PembRock couples lenders and yield farmers who are rewarded for providing liquidity within the NEAR ecosystem. We are supporting all major farms and assets on Ref.Finance",
      discord: "https://discord.com/invite/JZ94hj8vaD",
      twitter: "https://twitter.com/PembrockFi",
      telegram: "https://t.me/pembrock_finance",
      website: "https://pembrock.finance/",
      whitepaper: "https://docs.pembrock.finance/",
    },
  },
  {
    spec: "ft-1.0.0",
    name: "Uniswap",
    symbol: "UNI",
    icon: "data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Ccircle fill='%23FF007A' fill-rule='nonzero' cx='16' cy='16' r='16'/%3E%3Cg fill='%23FFF'%3E%3Cpath d='M12.261 5.767c-.285-.044-.297-.05-.163-.07.257-.04.865.015 1.284.114.977.233 1.866.828 2.816 1.885l.252.28.36-.057c1.52-.245 3.067-.05 4.36.547.356.164.917.491.987.576.023.026.064.199.091.383.096.637.048 1.125-.146 1.49-.106.198-.112.26-.041.43a.416.416 0 00.372.236c.322 0 .668-.52.828-1.243l.064-.287.126.143c.692.784 1.235 1.853 1.328 2.613l.025.199-.117-.18c-.2-.31-.4-.522-.658-.693-.464-.307-.955-.411-2.255-.48-1.174-.062-1.839-.162-2.497-.377-1.121-.365-1.686-.852-3.018-2.599-.591-.776-.957-1.205-1.32-1.55-.827-.786-1.639-1.198-2.678-1.36z' fill-rule='nonzero'/%3E%3Cpath d='M22.422 7.5c.03-.52.1-.863.242-1.176.056-.124.109-.226.117-.226a.773.773 0 01-.055.204c-.103.304-.12.72-.049 1.203.09.614.142.702.79 1.365.305.311.659.703.787.872l.233.306-.233-.219c-.285-.267-.941-.79-1.086-.864-.097-.05-.112-.049-.172.01-.055.056-.067.138-.074.529-.012.608-.095 1-.296 1.39-.108.21-.125.166-.027-.073.073-.178.08-.256.08-.845 0-1.184-.141-1.468-.966-1.956a9.046 9.046 0 00-.764-.396 2.916 2.916 0 01-.374-.182c.023-.023.827.211 1.15.336.482.185.561.209.62.186.039-.015.058-.129.077-.464zm-9.607 2.025c-.579-.797-.937-2.02-.86-2.934l.024-.283.132.024c.248.045.675.204.875.326.548.333.786.772 1.027 1.898.071.33.164.703.207.83.068.203.328.678.54.987.152.222.05.327-.286.297-.514-.047-1.21-.527-1.659-1.145zm8.905 5.935c-2.707-1.09-3.66-2.036-3.66-3.632 0-.235.008-.427.017-.427.01 0 .115.077.233.172.549.44 1.164.628 2.865.876 1.001.147 1.565.265 2.085.437 1.652.548 2.674 1.66 2.918 3.174.07.44.029 1.265-.086 1.7-.09.344-.367.963-.44.987-.02.006-.04-.071-.046-.178-.028-.568-.315-1.122-.798-1.537-.549-.471-1.286-.847-3.089-1.572zm-1.9.452a4.808 4.808 0 00-.131-.572l-.07-.206.129.144c.177.2.318.454.436.794.091.259.101.336.1.757 0 .414-.011.5-.095.734a2.32 2.32 0 01-.571.908c-.495.504-1.13.782-2.048.898-.16.02-.624.054-1.033.075-1.03.054-1.707.164-2.316.378a.488.488 0 01-.174.042c-.024-.025.39-.272.733-.437.483-.233.963-.36 2.04-.539.532-.089 1.082-.196 1.221-.239 1.318-.404 1.995-1.446 1.778-2.737z' fill-rule='nonzero'/%3E%3Cpath d='M21.06 18.116c-.36-.773-.442-1.52-.245-2.216.021-.074.055-.135.075-.135a.73.73 0 01.189.102c.166.112.498.3 1.383.782 1.105.603 1.735 1.07 2.164 1.602.375.467.607.999.719 1.647.063.367.026 1.25-.068 1.62-.297 1.166-.988 2.082-1.972 2.616a2.53 2.53 0 01-.288.143c-.014 0 .038-.133.117-.297.33-.692.369-1.366.118-2.116-.153-.459-.466-1.02-1.097-1.966-.734-1.1-.914-1.394-1.095-1.782zm-10.167 4.171c1.005-.848 2.254-1.45 3.393-1.635.49-.08 1.308-.048 1.762.068.728.186 1.38.604 1.719 1.101.33.486.473.91.62 1.852.06.372.123.745.142.83.11.488.327.879.595 1.075.425.311 1.158.33 1.878.05a.981.981 0 01.236-.074c.026.026-.336.269-.592.397a2.014 2.014 0 01-.983.238c-.66 0-1.208-.335-1.665-1.02-.09-.135-.292-.538-.45-.897-.482-1.1-.72-1.436-1.28-1.803-.489-.32-1.118-.377-1.591-.145-.622.305-.795 1.1-.35 1.603.177.2.507.373.777.406a.83.83 0 00.939-.83c0-.332-.128-.52-.448-.665-.437-.197-.907.033-.905.444.001.175.077.285.253.365.113.05.115.055.023.036-.401-.084-.495-.567-.172-.888.387-.386 1.188-.216 1.463.31.116.221.129.662.028.928-.225.595-.883.907-1.55.737-.454-.116-.639-.241-1.186-.805-.951-.98-1.32-1.17-2.692-1.384l-.263-.041.3-.253z' fill-rule='nonzero'/%3E%3Cpath d='M6.196 3.35l.096.117c3.708 4.54 5.624 6.896 5.746 7.064.2.278.125.527-.219.723-.191.109-.585.219-.781.219-.223 0-.474-.107-.657-.28-.129-.123-.65-.901-1.853-2.768a188.53 188.53 0 00-1.712-2.633c-.049-.046-.048-.045 1.618 2.936 1.046 1.872 1.4 2.533 1.4 2.622 0 .18-.05.274-.272.522-.37.413-.535.877-.655 1.837-.134 1.077-.51 1.837-1.554 3.138-.61.762-.71.902-.865 1.209-.194.386-.247.603-.269 1.091-.023.516.022.85.18 1.343.138.432.282.718.65 1.288.318.493.501.859.501 1.002 0 .114.022.114.515.003 1.179-.266 2.136-.735 2.675-1.309.333-.355.411-.551.414-1.038.001-.318-.01-.385-.096-.568-.14-.298-.395-.546-.957-.93-.737-.504-1.051-.91-1.138-1.467-.072-.457.011-.78.419-1.634.421-.884.526-1.26.597-2.151.045-.576.108-.803.274-.985.172-.19.328-.255.755-.313.696-.095 1.139-.275 1.503-.61.316-.292.448-.573.468-.995l.016-.32-.177-.206c-.254-.296-2.355-2.614-6.304-6.956l-.106-.115-.212.165zM7.91 19.732a.566.566 0 00-.174-.746c-.228-.152-.583-.08-.583.118 0 .06.033.104.108.143.127.065.136.139.037.288-.101.152-.093.286.023.377.186.146.45.065.59-.18zm5.524-7.176c-.327.1-.644.447-.743.81-.06.221-.026.61.064.73.145.194.286.245.666.242.744-.005 1.39-.324 1.466-.723.062-.327-.223-.78-.614-.98-.202-.102-.631-.143-.839-.079zm.87.68c.115-.163.064-.34-.13-.458-.372-.227-.934-.04-.934.312 0 .174.293.365.561.365.18 0 .424-.107.503-.219z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "5",
      project_name: "Uniswap",
      description_token:
        "Swap, earn, and build on the leading decentralized crypto trading protocol.",
      description_project:
        "The Octopus Network is a NEAR-based multichain interoperable crypto-network for launching and running Web3.0 Substrate-based, EVM compatible application-specific blockchains, aka appchains. The Octopus Network, backed by top VCs including Digital Currency Group and Electric Capital, is committed to unleashing a new wave of innovation for Web3.0.",
      discord: "https://discord.com/invite/FCfyBSbCU5",
      twitter: "https://twitter.com/uniswap/",
      telegram: null,
      website: "https://uniswap.org/",
      whitepaper: "https://uniswap.org/",
    },
  },
  {
    spec: "ft-1.0.0",
    name: "Pixeltoken",
    symbol: "PXT",
    icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAANdJREFUWIXll70RwjAMhWUuNGwARVgEmuyQJRgo7AA7uGESGioaGlpTcK+w7nR+gcIyfJ1zys/7dHKSsO53SSqyqHlzEZFu7gm364Wq22z3VF07BpB8CANXn971JRP+Dejk8fSgLoz6kgm/Btjk58MqW4/TM6svmfBrQIOkSAiO92W2Hmc+gF8D6BV6h17qhOxUWPg18C16OizaN2AlxXTEFEWkxZ2QRe8DoJQctG8AIDH4vS8iFjY5aM8Au8Ox+DdgvRUBO+8W/g0AbUIf/5TqBsLf/x2/ADJHSOenTxC2AAAAAElFTkSuQmCC",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "6",
      project_name: "Crypto Hero",
      description_token:
        "A blockchain game focused on PvE with a P2E raid system.",
      description_project:
        "Cryptoheroes is a blockchain based game, focused on PvE looting, trading and forging items as well as fighting bosses with friends to earn PXT.Enter dangerous dungeons on your own, defeat evil minions and gather loot to improve your strenght! Join raids with allies to defeat more evil bosses in epic fights and compete for weekly pixeltoken treasures! Each raid consist of 8 players and the top 20 raid teams are rewarded each week. You can also place your items on the marketplace or reforge them to improve your existing gear.",
      discord: "https://discord.com/invite/xFAAa8Db6f",
      twitter: "https://twitter.com/CryptoHeroGame",
      telegram: "https://t.me/pixeltoken_community",
      website: "https://ecosystem.pixeldapps.co/?page=cryptohero",
      whitepaper: null,
    },
  },
  {
    spec: "ft-1.0.0",
    name: "marma j token",
    symbol: "marmaj",
    icon: "data:image/jpeg;base64,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",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "7",
      project_name: "Marmaj",
      description_token:
        "Leverages Web3 technology to support social good initiatives.",
      description_project:
        "The Marma J Foundation leverages Web3 technology to support social good initiatives in the Web3 space. Our goal is to spread love and positivity by developing and managing various projects that support the open web ecosystem.",
      discord: null,
      twitter: "https://twitter.com/itsmarmaj",
      telegram: "https://t.me/marmajdao",
      website: "https://marmaj.org/",
      whitepaper: null,
    },
  },
  {
    spec: "ft-1.0.0",
    name: "HAPI",
    symbol: "HAPI",
    icon: "data:image/svg+xml,%3Csvg version='1.1' id='Layer_2' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' x='0px' y='0px' width='600px' height='600px' viewBox='0 0 600 600' enable-background='new 0 0 600 600' xml:space='preserve'%3E %3Cg%3E %3Cg%3E %3Cpath fill='%23141414' d='M263.7,122.8c-3.6,0.3-7.1,0.9-10.7,1.8c-24.5,6-40.3,18.1-50.4,31c24.5-4.7,49.9,1.3,67.3,7.4 c0.5,0.2,1,0.4,1.6,0.6c-2.7-4.2-5.2-9-7.2-14.4C261.2,141.1,261.6,131.6,263.7,122.8z'/%3E %3Cpath fill='%23141414' d='M201.2,197.7c-9.8-1.1-19.1-2.1-24.6-2.1c-0.7,0-1.4,0-2,0.1c-38.1,2.6-67.2,37.3-69.1,82.4 c-1.4,32.2,13.5,53.1,23.3,63.4c-1.5-12.5-0.1-25,4.3-37.3c11.7-32.6,34.3-42.1,60.6-53.1c10.8-4.5,22.5-9.5,34.3-16.6l50.1-39.6 c-10.1,2.2-24.4,4.5-42.9,5.3C227.1,200.6,213.9,199.1,201.2,197.7z'/%3E %3Cpath fill='%23141414' d='M319.1,176.5c-0.5,1.1,0.9,2.1,1.8,1.2c5.3-5.4,16.3-14.3,30.8-14.2c15.6,0.1,35.5,10.2,40.5,22.1 c4,9.8-6.6,16.5-6.6,16.5l0,0c-2.5-2.7-8-6.3-18.2-6.6c-15-0.5-25.3,12.1-24.1,12.9c7.5,4.7,17.3,3.7,23.1,3.5 c5.8-0.2,15.1-2.5,17.8-3.5c4.7-1.8,11.7-7.8,14.9-16.1c2.5-6.5,8.4-28.7-25.2-34.4C352.7,154.3,327,159.6,319.1,176.5z'/%3E %3Cpath fill='%23141414' d='M473.1,225.1c-0.5-0.6-1.1-1.3-1.7-2l-0.3-0.3c-3.9-4.4-7.6-8.3-9.4-10.1c1.2-4.2,4-16.2,1-26.1 c-2.3-7.7-6.8-15.5-9.2-19.4l-0.8-1.2h0c-0.4-0.6-0.8-1.2-1.1-1.7c-0.3-0.4-0.5-0.7-0.6-1l-0.2-0.7c-2.5-7-8.6-22.3-16.4-28.1 l59.4-91.7c2.3-3.5-2.1-7.5-5.4-5l-86.8,66.5c-8.7-12.3-21.1-21.8-21.8-22.4c-0.8-0.6-2-0.7-2.9-0.2c-0.9,0.5-1.4,1.6-1.3,2.6 c0,0.1,0.6,5.9-2.9,17.6c7.5,2.7,13.9,6,19.3,9.7l-4.5,3.5c-8.8-5.7-20-10.5-34.3-12.6c-17.7-2.6-31.9,1-42.1,10.7c0,0,0,0,0,0 c5.9,3.8,13.1,8.7,17,12.4c0.8,0.7,1.5,1.5,2.2,2.3c-3.1,0.9-6.2,1.9-9.3,2.9c-0.3-0.2-0.5-0.5-0.8-0.7c-1.9-1.7-4.4-3.4-7-5.3 c-5.4-3.8-11.7-8.3-15.8-14c-2.2-3.1-3.8-6.5-4.3-10.4c-0.3-2.4-1-4-2.2-4.9c0,0,0,0,0,0c0,0,0,0,0,0c-0.6-0.5-2.8-2-5.8,0.3 c-2,1.6-4.4,5.3-6.5,10.3c-5.2,12.3-8.7,32.1-1.8,46.1c1.2,2.3,2.4,4.5,3.7,6.6c-0.4,1-0.7,2.1-0.9,3.1c-0.6,3.4-0.9,7.8-1.2,12.7 c-19.8-8.3-50.5-17.5-78.5-10.7c-23.9,5.8-39.4,17.5-49.6,30c7.4-3.1,15.2-5,23.5-5.6c5.6-0.4,16.4,0.8,27.9,2.1 c11.8,1.3,25.3,2.8,32.9,2.4c19.2-0.8,33.7-3.3,43.5-5.6c0,5.4,0.1,11.1,0.4,16.9c0.7,16.8,2.5,34.3,5,46.5 c3.6,17.9,16.5,55.2,31.4,64.6c5.5,3.5,13.5,8.2,22.9,13.4c-2.5,6.4-5.1,15.1-5.1,23.5c0,15.2,5.2,26.6,11,37 c4.6,8.2,9.6,15.7,12.8,24c2.5,6.5-2.7,27.7-5.6,38.9c-1.2,4.5-1.9,7.3-1.7,7c3.7-5.1,7.5-10.8,11.3-16.8 c15.3-24.2,19.4-47,19.5-48l0.2-1.4l-1.1-1c-0.2-0.2-17.2-15.7-18.3-33.3c-0.4-6.9,1-11.5,4.3-13.8c0.5-0.3,1-0.6,1.6-0.9 c7.5,3.7,15,7.3,22.2,10.5c2.8,3.5,9,9.4,11.8,12c3.4,3.2,6.9,7.8,12.2,7.8c5.3,0,15.9,0,21.3,0s13.1,0,17.3-2.1 c4.2-2.1,10.9-5.6,11-12.6c0-1.5,0.4-3.9,0.9-6.8c3.7-4.9,4.1-10.6,4.8-19.2c0.5-5.7,1.7-15.5,3-25.9c2-15.7,4.1-32,3.9-37.9 c-0.2-8.2-1.1-14.3-1.4-16.2C475.3,249.4,479.5,232.4,473.1,225.1z M318,310.6c-13.3-8.4-25.6-44.6-29-61.2 c-4.8-23.9-6.9-68.5-3.9-86.8c2.7-16.7,49-34.5,81.7-35.6c1.9-0.1,3.8-0.1,5.6-0.1c1,0,2,0,3,0c-0.1,4.9,1.3,15.6,13.8,25.5 c13.9,11,30.4,5,30.4,5l12.1-18.7c4.5,3.5,9.4,12.7,13,22.1c-0.9-0.4-1.9-0.7-3.1-0.9c-8.1-1.3-31.6-0.9-24,31.3 c1,4,5.2,9.4,17.2,22.3c2.8,3,5.1,5.3,7,7.2c5.6,5.6,7.4,7.4,7.5,11.8c0,0.3-0.2,1.6-0.4,3c-0.8-0.6-1.9-1.1-3.4-1 c-3.6-0.2-33.7,5.6-42.4,15.1c-1.7,1.9-4.5,2.6-6.7,1.4c-0.1-0.1-0.2-0.1-0.3-0.2c-1.4-0.8-2.3-1.9-2.8-3.5 c-1.3-5.1,2.9-13.2,4.6-16c0.6-1,0.3-2.3-0.6-2.9c-1-0.6-2.3-0.3-2.9,0.6c-0.1,0.2-0.9,1.5-1.9,3.5c-3.3,6.6-8.2,12.2-14.3,16.3 c-9.8,6.6-24,15.2-35.5,18.2c-18,4.7-24.9-8.2-25.2-8.8c-0.5-1-1.8-1.4-2.8-0.9c-1,0.5-1.5,1.8-0.9,2.8 c0.1,0.1,6.3,12.1,21.5,12.1c0.6,0,1.4-0.1,2.2-0.2c4.3-0.5,8.6,0.5,12.3,2.7c3.5,2.1,8,4.7,12.5,7c12.6,6.3,14.7,6.2,19.5,5.4 c1.1-0.2,49.8-2.4,80.1-8.2l3.6,0.2c2.4,0.1,4.3,2.3,4,4.7l0,0.1c-0.2,1.4-1,2.6-2.2,3.3c-2.7,1.5-6.5,3.5-9.9,4.9 c-1.6,0.6-3.3,1.2-5.1,1.6c-5.5,1.3-11.1,1.6-11.1,1.6s-5.4,1.2-13.5,2.1c-3.4,0.4-7.2,0.7-11.3,0.9c-14,0.7-13,1.6-24.8,1 c-2.9-0.1-5.7-0.3-8.3-0.6c-2.5-0.3-3.2,3.4-0.7,4c6.1,1.5,13.3,2.6,21.3,2.5c1,0,1.9,0,2.9,0c12.8-0.1,24.4,7.5,29.4,19.3 c2.1,5,4.1,12,5.4,18.5c1.8,8.4-5.3,16.1-13.8,15.3c-12.5-1.3-26.6-4.8-34.6-8.3C365.3,338.1,332.4,319.8,318,310.6z M448.7,169.2 l1.2,1.9c2.4,4,5.9,10.5,7.9,16.9c3.1,10.4-1.4,24.4-1.4,24.5l-0.5,1.5l1.1,1.1c0,0.1,5,5.2,10.3,11.1l0.1,0.2 c0.6,0.7,1.2,1.3,1.8,2c3.7,4.3,1.9,17-0.1,23.9l-0.2,0.6l0.1,0.6c0,0,0.3,1.5,0.6,3.9c-2.7,0.3-4.7,2.7-4.4,5.5l0.8,7.5l-8.6,0.1 l-13.5-15.3c-1-1.2-1-3,0.2-4c0,0,0,0,0,0c7.1-6.4,8.1-9.5,8.3-10.7c0.9-5.4,1.2-7.4,1.2-8.1c0-6.1-2.9-9-8.7-14.8 c-1.9-1.9-4.2-4.2-6.9-7.1c-0.6-0.6-1.1-1.2-1.7-1.8c2.1,0.6,4.9,1.2,8.5,1.5c8.4,0.7,10.9-1.4,10.9-1.4s1.5-2.7-1.1-6.6 c-2.6-3.9-6.2-6.7-13.2-6.9c-5-0.2-9.5,3.7-11.7,6c-0.9-1-2.9-4.7-3.8-10.9c-1.5-9.7,2.1-14.2,4.7-16.4c4.6-3.9,10.9-7.7,14.4-7.5 c0.9,0.1,1.9,0.2,2.7,0.4C447.8,167.7,448.2,168.4,448.7,169.2z M463.4,332.9c-0.7,8.2-1.1,12.8-3.8,16.5c-2.3,3.1-7.3,0.8-6.6-3 c0.4-2.1,0.7-4.3,0.8-6.4c0.3-10.7-4.9-20.9-6.7-27.7c0,0,0-0.1,0-0.1c-0.9-3.8,1.2-7.7,4.8-9.3c1.6-0.7,3.4-1.6,5.3-2.6 c4.6-2.3,9.9,1.3,9.2,6.4l0,0.1C465.2,317.2,463.9,327.1,463.4,332.9z M385.1,249.4c1.8-1.3,4.4-0.8,5.6,1.2 c0.8,1.4,1.9,2.9,3.4,4.1c4.5,3.7,9.8,3.5,13.2,3.5c3.3,0,5.4-0.6,6-0.8c0,0,0,0,0,0c2.4-0.5,4.3,2,3.1,4.2 c-2.6,4.8-6.1,11.1-6.5,11.4c-0.7,0.5-22.8,5.1-25.6,5.4s-11.6,1.2-18.2-3c-2.8-1.7-5.5-3.7-7.7-5.3c-1.7-1.2-1.4-3.8,0.4-4.7 C368.8,260.4,378.7,253.9,385.1,249.4z M436.8,263.8l8.3,9.1c1.5,1.7,0.5,4.4-1.7,4.7c-5,0.6-10,1.2-14.9,1.7 c-2.3,0.2-3.9-2.3-2.7-4.3c1.9-3,4.3-7,6.5-10.8C433.2,262.6,435.5,262.4,436.8,263.8z M396.4,117.1l83.5-69.1l-76.9,76.9 c-2.5,2.4-6.6,1.6-8.1-1.5h0C393.9,121.2,394.5,118.5,396.4,117.1z'/%3E %3Cpath fill='%23141414' d='M196.6,258.1c-25.6,10.7-45.8,19.2-56.4,48.7c-15.1,42,9.4,88.5,62.5,120.1c-17.4-68,3.5-93.1,22.1-115.3 c6.4-7.7,12.5-15,16.9-23.7c12.9-25.8,12.3-50.5,11.1-62C233.7,242.5,214.1,250.8,196.6,258.1z'/%3E %3C/g%3E %3Cg%3E %3Cpath d='M201.6,477.1h-9.1l-2.8,17.1h-14.3l2.8-17.1h-9.1l-2.8,17.1h-9.3l-1.5,9.1h9.3l-2.3,14h-9.4l-1.5,9.1h9.4l-2.8,17.1h9.1 l2.8-17.1h14.3l-2.8,17.1h9.1l2.8-17.1h9.3l1.5-9.1h-9.3l2.3-14h9.4l1.5-9.1h-9.4L201.6,477.1z M186,517.4h-14.3l2.3-14h14.3 L186,517.4z'/%3E %3Cpolygon points='260.8,505.3 230,505.3 230,477.1 218,477.1 218,543.6 230,543.6 230,515.4 260.8,515.4 260.8,543.6 272.9,543.6 272.9,477.1 260.8,477.1 '/%3E %3Cpath d='M307.1,477.1l-23.4,66.4h12.8l5.5-16.4h25l5.5,16.4h12.8l-23.4-66.4H307.1z M305.3,517.5l9-26.8h0.5l9,26.8H305.3z'/%3E %3Cpath d='M394,480c-3.5-1.9-7.8-2.9-12.9-2.9h-24.9v66.4h12v-22.4H381c5.1,0,9.4-0.9,12.9-2.8s6.2-4.5,7.9-7.8 c1.8-3.3,2.7-7.1,2.7-11.3c0-4.2-0.9-8-2.7-11.3C400.1,484.5,397.4,481.9,394,480z M390.9,505.4c-0.9,1.8-2.3,3.2-4.2,4.3 c-1.9,1-4.3,1.6-7.3,1.6h-11.1v-24h11c3,0,5.5,0.5,7.4,1.5c1.9,1,3.3,2.4,4.2,4.2c0.9,1.8,1.4,3.9,1.4,6.2 S391.8,503.6,390.9,505.4z'/%3E %3Crect x='417.1' y='477.1' width='12' height='66.4'/%3E %3C/g%3E %3C/g%3E %3C/svg%3E",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "8",
      project_name: "Hapi",
      description_token: "Onchain Cybersecurity Protocol for DeFi.",
      description_project:
        "HAPI is a cross-chain protocol, aimed at creating new cybersecurity standards for DeFi market by providing real-time data on stolen funds and compromised wallets.",
      discord: "https://discord.com/invite/HdGXqF32Jc",
      twitter: "https://twitter.com/i_am_hapi_one",
      telegram: "https://t.me/hapiHF",
      website: "https://hapi.one/",
      whitepaper: "https://hapi-one.gitbook.io/hapi-protocol/",
    },
  },
  {
    spec: "ft-1.0.0",
    name: "oinfinance",
    symbol: "OIN",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 974.66 974.66'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bisolation:isolate;%7D.cls-2%7Bfill:%235a8dff;%7D.cls-3%7Bfill:%23fff;%7D.cls-4,.cls-5%7Bfill:%231b57f6;%7D.cls-5%7Bmix-blend-mode:multiply;%7D%3C/style%3E%3C/defs%3E%3Cg class='cls-1'%3E%3Cg id='图层_1' data-name='图层 1'%3E%3Ccircle class='cls-2' cx='487.33' cy='484.76' r='473.82'/%3E%3Ccircle class='cls-3' cx='487.33' cy='484.76' r='358.99'/%3E%3Cpath class='cls-4' d='M487.33,98.08c-213.55,0-386.67,173.12-386.67,386.68S273.78,871.43,487.33,871.43,874,698.31,874,484.76,700.88,98.08,487.33,98.08ZM368.59,297.83a9,9,0,0,1,12.71-.14,287,287,0,0,0,137.53,75,110.56,110.56,0,0,1,51.78,28.2,9,9,0,0,1-12.49,12.93,92.54,92.54,0,0,0-43.3-23.61,304.9,304.9,0,0,1-146.09-79.66A9,9,0,0,1,368.59,297.83Zm216.7,197.36a9,9,0,0,1,17.93,1.3c-1.86,25.6-15.92,49.6-38.58,65.86-18.31,13.13-40.08,19.87-63.28,19.87a130.41,130.41,0,0,1-32.7-4.3,9,9,0,0,1,4.52-17.4c29.91,7.76,58.67,3.23,81-12.78C572.48,534.61,583.82,515.45,585.29,495.19Zm-9.7-47.57a15.39,15.39,0,1,1,12.8,17.6A15.39,15.39,0,0,1,575.59,447.62Zm-244-118.07a9,9,0,0,1,12.71,0,335.48,335.48,0,0,0,163.36,90.53c30.07,6.9,50.7,33.19,48,61.16-1.64,17.07-9.08,30.42-21.52,38.59-8.23,5.41-18.1,8.14-28.9,8.14a76.36,76.36,0,0,1-23.39-3.91,9,9,0,1,1,5.52-17.1c14.54,4.69,27.64,3.93,36.9-2.15,7.73-5.08,12.39-13.82,13.49-25.29,2-20.88-15.76-37.71-34.1-41.92a353.42,353.42,0,0,1-172.1-95.35A9,9,0,0,1,331.59,329.55Zm-30,41.34a9,9,0,0,1,12.71-.23c36.29,35,81.18,62.68,133.43,82.22a9,9,0,0,1-3.15,17.41,8.89,8.89,0,0,1-3.14-.58c-54.58-20.41-101.55-49.38-139.62-86.11A9,9,0,0,1,301.56,370.89ZM452.39,512.8a15.39,15.39,0,1,1-12.8-17.6A15.38,15.38,0,0,1,452.39,512.8ZM278.9,429.48a9,9,0,0,1,12.54-2.07c38.33,27.47,67.76,43.32,105.66,61.43a9,9,0,1,1-7.75,16.21c-38.8-18.53-69-34.79-108.38-63A9,9,0,0,1,278.9,429.48Zm-4.46,60.34A9,9,0,0,1,287,487.67c45.31,32,91.6,55,137.57,68.37a9,9,0,0,1-2.5,17.62,8.76,8.76,0,0,1-2.51-.36c-47.9-13.9-96-37.78-142.94-70.95A9,9,0,0,1,274.44,489.82Zm18.28,73.95a9,9,0,0,1,12.38-2.89c44.19,27.46,93.91,45,123.06,51.75,27.43,6.32,56.78,9,65.69,9,77.91,0,141.29-63.38,141.29-141.29,0-65.78-46.6-123.81-110.81-138L516,340.57l0-.24a257.48,257.48,0,0,1-100.58-53,9,9,0,1,1,11.69-13.66A239.17,239.17,0,0,0,528.3,324.87l8.22,1.9,0,.16c68.06,19,116.62,82.18,116.62,153.46,0,87.82-71.45,159.27-159.27,159.27-9.61,0-40.9-2.87-69.72-9.51-30.5-7-82.46-25.38-128.52-54A9,9,0,0,1,292.72,563.77ZM493.85,688.36l-9-.07c-5.35-.12-10.74-.42-16.1-.9a302.94,302.94,0,0,1-109.22-31.85,9,9,0,1,1,8.2-16,284.85,284.85,0,0,0,102.64,29.94,225.63,225.63,0,0,0,23.34.87l7.29-.11c101.46-3.78,182.84-87.49,182.84-189.86,0-89.16-63.2-167.31-150.26-185.83l-.12,0-.11,0a206.73,206.73,0,0,1-49.14-18.68A9,9,0,0,1,492.69,260,188.85,188.85,0,0,0,537.56,277h0c95.18,20.37,164.23,105.85,164.23,203.35C701.82,595.07,608.53,688.36,493.85,688.36Z'/%3E%3Cpath class='cls-5' d='M144.68,484.76c0-206.19,161.39-374.67,364.73-386-7.27-.41-14.58-.64-21.94-.64-213.56,0-386.68,173.12-386.68,386.68S273.91,871.43,487.47,871.43c7.36,0,14.67-.23,21.94-.64C306.07,859.42,144.68,690.94,144.68,484.76Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E",
    decimals: 6,
    totalSupply: "1000000000000000000000000000000",
    db_metadata: {
      listing_id: "9",
      project_name: "Oin Finance",
      description_token: "The Gateway to DeFi.",
      description_project:
        "OIN Finance, The Gateway to DeFi. OIN will be the first DeFi platform to provide liquidity mining and loans on Ontology, and ultimately on other top platforms through cross-chain functionality. Our platform will build the bridge technology to seamlessly integrate Ethereum to start into our ecosystem, opening up to all of the current DeFi space. Cross-chain technology is crucial in DeFi and its growth as a legitimate financial infrastructure, after all, traditional finance also integrates the whole world, its currencies, and its different financial systems.",
      discord: null,
      twitter: "https://twitter.com/FinanceOin",
      telegram: "https://t.me/OIN_Finance_Eng",
      website: "https://oin.finance/",
      whitepaper: "https://oin-finance.gitbook.io/925/",
    },
  },
];

async function launchpadSetup(execution_data) {
  console.log("Start launchpad setup");

  let { connAccountMap } = execution_data;

  // Add owner as guardian
  await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.launchpad.accountId,
    methodName: "assign_guardian",
    args: { new_guardian: connAccountMap.launchpad.accountId },
    attachedDeposit: new BN(1),
  });

  let counter = 0;
  let nowTimestamp = Math.floor(Date.now() / 1000).toString();
  for (token of tokenArray) {
    // Allow creation of listing on owner's behalf
    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap.launchpad.accountId,
      methodName: "toggle_authorize_listing_creation",
      args: {},
      attachedDeposit: new BN(1),
    });

    let name = parseAccountName(token.name);
    await deployToken(name, token.totalSupply, token, execution_data);

    await registerContracts([connAccountMap.launchpad], [connAccountMap[name]]);

    const listingPreSaleTokens = "1000000000000000000000000";
    const listingAllocationSize = "1000000000000000000000";
    const listingAllocationPrice = "10000000";
    const listingLPtokens = "0";
    const listingLPprice = "0";
    const listing_data = {
      project_owner: connAccountMap.ownerAccount.accountId,
      project_token: connAccountMap[name].accountId,
      price_token: connAccountMap.usdtTokenAccount.accountId,
      listing_type: "Public",
      open_sale_1_timestamp_seconds: increaseTimeStamp(nowTimestamp, 1),
      open_sale_2_timestamp_seconds: increaseTimeStamp(nowTimestamp, 2),
      final_sale_2_timestamp_seconds: increaseTimeStamp(nowTimestamp, 3),
      liquidity_pool_timestamp_seconds: increaseTimeStamp(nowTimestamp, 4),
      total_amount_sale_project_tokens: listingPreSaleTokens,
      token_allocation_size: listingAllocationSize,
      token_allocation_price: listingAllocationPrice,
      liquidity_pool_project_tokens: listingLPtokens,
      liquidity_pool_price_tokens: listingLPprice,
      fraction_instant_release: "1000",
      fraction_cliff_release: "5000",
      cliff_timestamp_seconds: increaseTimeStamp(nowTimestamp, 5),
      end_cliff_timestamp_seconds: increaseTimeStamp(nowTimestamp, 6),
      fee_price_tokens: "0",
      fee_liquidity_tokens: "0",
    };

    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap.launchpad.accountId,
      methodName: "create_new_listing",
      args: { listing_data },
      attachedDeposit: new BN(1),
    });
    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap[name].accountId,
      methodName: "ft_transfer_call",
      args: {
        receiver_id: connAccountMap.launchpad.accountId,
        amount: listingPreSaleTokens,
        msg: JSON.stringify({
          type: "FundListing",
          listing_id: counter.toString(),
        }),
      },
      attachedDeposit: new BN(1),
      gas: new BN("300000000000000"),
    });

    counter += 1;
    nowTimestamp = increaseTimeStamp(nowTimestamp, 1);
  }
}

module.exports = { launchpadSetup, tokenArray };
