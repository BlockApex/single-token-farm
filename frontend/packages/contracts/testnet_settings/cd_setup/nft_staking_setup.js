const nearAPI = require("near-api-js");
const { BN } = require("near-workspaces");

const {
  connect,
  keyStores,
  accountCreator: { UrlAccountCreator },
} = nearAPI;

const {
  registerContracts,
  deployToken,
  deployNft,
  generateRandom,
  parseAccountName,
} = require("./utils");

// All project tokens to be deployed
// always use 6 decimals
const projectTokens = {
  generic: {
    spec: "ft-1.0.0",
    name: "NEKO",
    symbol: "NEKO",
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' version='1.1' id='Layer_1' x='0px' y='0px' width='46px' height='46px' viewBox='0 0 46 46' enable-background='new 0 0 46 46' xml:space='preserve'%3E%3Cimage id='image0' width='46' height='46' x='0' y='0' href='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAuCAYAAABXuSs3AAAABGdBTUEAALGPC/xhBQAAACBjSFJN AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAA CXBIWXMAAC4jAAAuIwF4pT92AAAAB3RJTUUH5gQVFS8KdqrjugAAE7dJREFUaN6dmnmQ3dV15z/3 /ra3d79e1K9b3Y260S7UsiQQmHWMsCFgwQQnMF7whLKcOA5xypSNpybBxGUnM2GSEkk5M2Q8NeUI TBJXGAw4GCwEBkuAkNECtNBGa+n99fr6rb/l3ps/XqtRG+HB/lXdrnqvfv1+n3Peued8z7lP8Gtc n7th7aLXRutYpKKVRpsrpJSXW7a9znGcTttxG6VlxQC00n4URTNhEAwppfu1YZ8QvGZb4rgQ1M7/ vEefP/KhWcSvC2y0Rhu9VCt9o+04t6UbspvbOrrbOro67VxHF9nWDpKpNI7jAZqwOkZ5cj8zY28w Nl5jZCyMxieifLGofxFF5ikpeVZIMSzPI/kwBvxK8EXAxmC07tBa3xVPJO/q6lm+Zv2lV8rVa1fS mhkkJs4gpQG3BxFbASbC1I5C9SCEeTAh2kCtZshPRhw76fPWkaoZHArfqdb0TinFI0IwIj6kAeLD QCOEE4XB7a4Xu2/56ks2Xb31ZtZsuIxk0oWZH2BKezAmQkWaINQEkYNSCmECbFviug6OY2FZ5z/O UK5o3jnus3dfmXcH/IN+YB60bfH/gOD/By9+FbQxBmNMzhh9f1t7190fu/m341uuuYFkugHULHr2 3yiO/JiR0VmGhuaYmixTrfjoSCEwSCGQlsTxHJLpGC2tKTo6MixpTRKPO2AAUTdg/4EqL+4pVcfz 4feFEN8WgtFz3r8QvPhgaI3RZq20rL9b+5HLtt76n+6mu2cFqClU6QCjJ5/j7YOvcfrUJEQRLRmX tmaPbMYjEbOwpQCtiUJFrRpRLIXMliIKPlgJj86eZlasaKGxIUbdAsPQSMRTzxU5crT2gtZ8RQj6 PwhefBC01maT47jfu/JjN27adufdpDMupvgyk2ee5fW9r3Py5DjNaY81FzfS2Z4mmXSRlgUCjKkv bcBog1YGHURE1YDaXI3ZmRqjswElIele0czaNa3EYzZgKFXg354v88rr5YNhxHYpOHAhePF+aIPR eq3tuI/8h9+6bdMn7/g9Yo5PNPkD+vf/mD173iXmWFzW18ZFnWlcx677y5j5/1+8tAFjxPw9oCND VA0IZqvMTdcYnqkRJW02bM7R3pZCYAgiwTMvVvnZ3srBKDJ3Xcjz1jnwvt7Wc+A5adnfu2rrzVfd 9pkvEnMq1Ea/z8s//SGvvHKG1T1Zrr+yi9ySJELUgd7bbu8HN0Ysfo1AOjZ20sONu6SkDWXNiYEZ jG3INnpYQtPb7VCpifbBkXC1MewSghLAmwMT74Gfl0EcrfV/W79hxZ133HUnSess1bHH2P3Mj+h/ e5zrtnSweX0brisvuNPrYO8ZoH8Zet5KraHia+Z8Q2BJXGGTjGzODhYJULQ0edhCc1GXw/iU6RnP q4SU7AJUX28rbw5MYJ//UKXMp3Jt7t3bbqiR8v+BYK7Eyy8c49jRCa7d0snS9gyD4zWCUNPU4NCU cRDi/JA437OLjTj3Xs3XvHF0jr1vVZkqxVEqpLvJ57reFLlYA2f7S1gWrOxtIGErbr7OJT8R3T2a j35uSfFP50LGei+26XBd+fe3fDzT1bfOweiAAweH2bdvkC0b2kkkEzz+wiRP7DG8fjLFnsNlxvIF upa4JGP2+8AXeXveAD/QPPXzKfae6mH5xt9h06Wf4KqP38HZqRh79h9gZYtHox1nZKxMosGQTtik YxrLtuwTp/XFSvFjISj29bZi9fW2og1obf5o9Qrvc9tuzOA4kpGROZ597jirerLkco3836enCBtv 5t4/3cFtd3yBjR/dxqmJDE/vOszS5oDWRg+tPyCu59cLv5jhWPEyNq6+muDxZ1jz+D8ze/woV/3h l3lnsMj4wDssX5LCUi6j0yWW5GwcS9DSYBgcM7n8tJlEsEcI5sG1WRqPy7/edlOmtbvLJfAVu54/ iQ4jrrx0KS8dKDAcXsHfPPQ/GTp0kEN/+RfMvHuSm7Z/kRXrt/JPT7xKW3qW5kYPrS8c12dGK+w9 fTHrV13H4Hcf5TMDR7iiUqBrcJB9o6Os/uxdPPeTZ+lrj+FIB79sUaXCkhYH1zLY0nDsNB2R4kkp mJPzm+Wm7k5nzarlLkZpBgamOHN6mkvXL8GxLQ4cD/nUnf+Z46/vY/gLX+Q/PvkkV3/3u7z06U+T TSe55788zE/f6mR8yl/YLwvxAWhtOHTKY8vVd3D2X3dxzeQ4y3WZUAgywLJXXiEWhrhNXUzPRSgt 8ESc8VMWM7M1tFKs6NR0tZnVWvNbAFJrYrYtbutbGxMJzxD4IYffHKU549LTlcEPNOXAo7Orizef eJrG2ZCYkHQIwa379nHg859H6og7f/9B9h7LMlfyKRR98tM1hvIVhsYrnDxbpKnn48jBGRJHBviI KiDnrTJC0F4qEY0M09TezXQpQiuJ1hJRTXHmdIhWmrijWLvMCNvmVm2I20qbVU1Ze/PKXhe0ZiJf YmiowEfXtxKLOehCDYSFEDA2OUdOukht0EBaCG4+dIifbN/OFY/+gI03fIMDb/wjXjxDJYwRRBY1 P2C2MIdx4cxLz9ISFTBRBTGfHgyQApicpKGphcqUQWuJUmBpj5FBi+U9AcmYxcUdmkzC2TxTFKts Y7gi12ovacmCVorTZ2YR2tDVnl6orUIIjDFUQ40vrYWiY4CMEHxi3z5e+ON7uH7nI2zech227SAt CykEBoOKFKVykdFPj3Lw1Vf5Xzt3snnPHm7WGlcIPEDOzBBPJwmVqHtcgdaC8kyc/ESBZUsFTSlD a6PdOj0nPiql4PKOnG27lib0IwaH52hOu2Qy3kIZl/PeEcYwJ13UeRJHA83AktdfZ2JkmEQijuva 2JZASrCkwHVtmrJZ1q1dy+e+8AXufeIJTt1/P3+bTlMwhhhgT00hpQVGolR9aS2JfI/RsbpTXUuR yypbCC6Xti3WtbVIhFFUqwHT01VaGmPYTl0NCAFSCixpYVsWU9KjJJ0FdGkM7zoO1S99id41a/gw V2tTE/c+8AC5B/87f5VJMQskp6fRUYglLJQSaC1QSmCUzeSkRRhECKNpbYiwLdZJxxadjWmBUYpy KaBWi2hMekgp58EFFgqhAlzHoSBdzth1MSSMYdDzOHPffVx3//3EXPdDgQNYQnD3HdvY9OU7+ZtE jKhQQFcrOMJG6brHjRGAoFy0qfkKozUNcYVtmU5pOyIb9wxoTaUaopUh7tkL8tS2JLb2YXyARCZF ZOCwm6VqJPlkkvyf/zlXf/ObJGOx+dSnyefzzM7O/krwt/v7+d7D/xvPgtbbr+eHYYCMIlzbPq+Q 1Vfg2/g1DbqeXWyLRmlJPFtqjFKEQYQxYM1vQGMgGZM0ZmD8yEE+cuUl+GmPU8Zlf+dK/P/xIBu/ /vUFT09OTvK1r32NG264ga9+9avs3r0brfX7oHft2sUnb7mF7/zDTvrdblpWXkKYy/B2/1skHHfB 08YIlDFoJQnDOqMlNJYwnjxXMYzWmPmHaPWeta4juWZTgp/seZFNq3J8csd/Ze29v0fnP/8jPX/4 ZVxrQRnz0EMPsWPHDlatWsW3vvUtoiji6NGji6BrtRoPPfQQZ86c4Z577uHPvvlNrvrU57lsVQ+z I4PzGeyc3jHz3hcYXWdknlEqjR9G9bGDLevpLwjMArw2sLYnSY0JJo4dZusVvXzm3rtYuWX9ovap VCqxe/duAK699lq6u7vp6+tjbGxsEXi1WmVkZITe3l6SySRhGFKqVOle0szFnW3kizXE/CcrDZE2 SGmw0BilCUNQGl9GkZmp+vW6H3PqKaxUVqjILIRLGBmSXoykLWDgMEyPgbAXAVmWRXNzMw888ADJ ZJLHHnuMhx9+mCiKFt2XyjRw7XXXsXPnTpLJJDfedBP3feWP6MnGubgzx3ixyrkCEum6x21b4UgN 2lDxIdJiVoahGZqdq38NcVfguZJCMSSomveUHpCMeSQSSVh7LfR8BGxnEVA8Hmf79u1s3bqVkZER PvvZz7J//342b9pEeXCQ2f2vMPf6ywRHD7P9t29jemqK559/nlOnTvG7t97CuhW9NKeTlIJoQV0G kUYbiHkBrmUwylAoW0RKDNmRon98ymzRGjwHGtM204UahYmI5rhbj7GaQIQRVd+n4byY/uVr27Zt 9Pf3k0gk2LFjB79zxx1EJ07ws+98m0tSeZoTGp3wWJbNku27nZV/dj/JVJKluTZ4cxeWWNwl+ZHC YGhI13CEQUUwOWcTadFva232jeTVXX6I7QhDR7PH4XyV0VMBpWmBiqBaMkRzVU4MDpEbH4Dmrnpl Ou8K/BoIQV9fH319fQvvH3vhRQpnh5jtlLQnNNI1CDWMyp+gc9X2hft0Ist0qYJnW4AgUIpQGZAR rdkawhj8QDBWcCJj2CeF4LXxCZWfLAgwms5WFy0jpko1ipOG0jREgaQlbrHvyAkYPgH50+/ztpCS /MgglVJxQSoAdFxzDS0bNnBizHBsVFMe86nOpHA2f2LB4JnpScanJhmcmKEh5mIMVEOF0hCPV1jS EIAyTJUsJkv2hBC8am3oXVIIQ65uaTCrupsDPEcwMuUzW9RkvQaMrmsG17I4eGaKdcsuIitqkG0H L7Foczqux9T4MHOFGYQAL5bAa2yg7bLLsDKNFGQjalkfDb/7ByQuvZbpyXEKM5NIIRDTYzzywx+x OpvGtSzmagGRNnR1TbC8rQYa3hpO8s548iXgYVtKaqEyT/a/az656SIj4q5hTVeMFydLzNVqpOwU SoNnOTS7VR7f+wZfzzXD2z+DvushmX1vgyaSdPWuQkUhQeBjjEEIQaqri/Vf+oN6HhZiQW0mUmka m5dgCcPLT75FpVQhu6yNoh8SaXC8Khd3FJEaqoHgWD5hIi2esqWpSgApeG4oL945MSQxWnFRq0Ou STBcmSSM6pVLKcnylgyH+t/hxbdOQmEcDu+GQn4BXEURE2NDTOZHcR0PUast7DZTLmMGBhBK1UNL KfADRgYHCI6/wb8+81N6GlP10UWo0MawtGOSJckIowwDkzGGC95RIfgJzPecAuaCSGb8gBtWL/WJ 2ZqkJzk2VgIdIy6SaC2whE3Skjx94Dg9HTk6UjZMDoLtQipLqVQCDI3ZFmzXRY+Ook+cgMlJzMgI wnHQAwMwM4MeHsFtbSFRzvPMY9/nR7tf46ruHKUgIlKQSM+yZXWepIBqINl9spl82d1hCfPMQrMs 6tJgYK5qXZ+OqfbOpoCUJ9BG8+5EkRhpbBNDa0HKdbGN4l9efRvb9VjZmsGaHYG5SbxUhnhTG5ZT 1y6ioQERj4NlI3t6kB3tiHQaMFhNKRg/xp6nH+evHnmSLbkmPNvGDzXCqbJh9RBdqQij4PBohjdG MocM4htSUASw3hyYODd+KyotCtNF65aLWnwnHVO0pOqbZKhQIU4DlnExQDbu0exZPPvGEfYeP4sw hkZdI1kYgdlR8MugItAK4bmIVByhAihOIcp5xOwZ8of38n8e/Rf+/vFdbGxpoDWVoBoqjAxZsXyQ 9W0VRARjRY9dA621km/fJ6V5RVCfHwpYPIJTWjy0uqP25dsvnSHpKSo1w8+P1xidSNEue/FIYDAI 6jri9HSR41MllOPS25ljQ28nqzrbyLU0kcmkcVxvPu35FObmODUyziv977LnrRNIP2BzRyuebeFH GiMDli0bYstFBdwIyqHk6RM5jk+nHpbC/AnzA/8F8PPhjSEnBI9euqy89cZLZnEtQ8U3vHbK5+x4 nFaxjASZBT0hqGeIuVrAcKHMSLFKIVQYaeG4No5t18t3GFHzA4RStMY8eprSpD0PP1JE2oBT4eKe YTa2F3EVBJFg95lWDow3vmAMnxOC0XPQAIuVUp1lTBv+5MCZ5E5H6k0fW1Ugbhuu6nFp8GocGTlO JeygUbRh46DnW+d0zGVNzGNNmyDSGj9U+JEiUBpjBLYUOPMNdKQ1tUhRDhQaRSw9zbreMVY2+Fgh +JHg58PNHMo3HNRGfEUIM/rLmAvC41ysz38FE9qIX4wW3MvKvmxfmvGJ24olKYuWpGZGzTLhz6G1 xDIOwlgLwkgbwAgsKXEsC9eysKRAmbr2qIYKP9JERiG8OZZ2DbNl+QTdsRARQjmw+NngEg7kGw9G Wn5RCHP4XFhccLB/gZDBwFop+LvlLdWt1y+fIZf2wUCIYcyPODYmmJhOoKqNWFEaS3sIU+/U9blG YH7V7VEYGeAmSrS1FFjeVibnRlhB/eRivBLjpeFW3i2kXpj3dP+FoC8Ivgi+/ienEfe3JMK7L+8q xC9pK5KwFdIxGMcw4xuGCjA2IykUXWo1DxW6GG2DmR9R2BGxWEhDyqet0SeXjGgQBunXpWolsuif bmB/vqk6XfO+LzDfRjD6QdAfCP5LmeZctrndsfQ3uhtqGze2z9HbWCZuK6QF0gbjGCIbagqqIUT1 AoltQcwGVxvswIBvMEF9nliNLE7NJTk0lWWwlDgYavmgJcxvflx4Ifh6NyQ6tOGumK0/n0v5a1Zk S6KnoULWC/AshRODeIvAcuvxLgCtDLUpTTCnURH4SjLju5wuJjlZSJuxSvwdX8tHBDwihBk+H+g3 OqD9QAPq5zhLteEmS5pbk47a3BwL2lrjvt0c82lpUWSyGlsahIBKwTCbFxRDh6maS74ai6Z9N1+O 7F8oLZ6SgmcFZvjDnij/WuAfED4YQ0wZsdIgrhCYyy1p1tnSdNqWyVrCeABKCT/SYjYyYlAZccQY 8ZoQZp8lzDHBb/4jhH8HsQSGthsv6IwAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDQtMjFUMjE6 NDc6MDgrMDA6MDDs4phyAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTA0LTIxVDIxOjQ3OjA5KzAw OjAwO8gregAAAABJRU5ErkJggg=='/%3E%3C/svg%3E",
    decimals: 6,
    totalSupply: "1000000000000000000000",
    baseName: "generic",
  },
};

// All nfts to be deployed and their respective project tokens
const nftsArray = [
  {
    nft: {
      name: "RealBirds",
      symbol: "REALBIRDS",
      base_uri: "https://api.therealbirds.com/metadata",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreihwwqgpgrvquv2elnv3vkduhmtbhxbbh6v44ujqu5x2chgu3jhncm?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "Secret Skellies Society",
      symbol: "BONEZ",
      base_uri:
        "https://bafybeiewqydtijclzgpdgeymx7opqa7n37sz2jvaaa7l64v5dvmusva434.ipfs.dweb.link",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreigynjl2dymbl42lm746rfy3gejgpo6xddcqaa75jku4u42ifig2wa?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "The Undead Army",
      symbol: "UNDEAD",
      base_uri:
        "https://bafybeie2yio33xzp6rhjpxsgq2zplo57laygx5oikwyvxt5x654llwers4.ipfs.dweb.link",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreief64oulyor53cnwy5lvvsw7fg4jegcf6kvktkahgauwk63qx2njm?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "NEAR Meerkat Kingdom",
      symbol: "NMK",
      base_uri:
        "https://bafybeiht5jof3n265j3jd3rm2sfg6anf567sfgcgqko4oepf77a6ewe3um.ipfs.dweb.link",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreifa2m5phwxxyyqapzlgcdr7c26rot4r6jm6dqgityc2nkb5tsvceq?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "Good Fortune Felines",
      symbol: "GFF",
      base_uri:
        "https://ewtd.mypinata.cloud/ipfs/QmNtWmU8LuNNexpcw3djhGcdudkUarX8oiovGCZrwrhYR4",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafybeign242fzlinls3uyvjv4xmgcq37vcxb36bioavfu7zxd4xpb3molu?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "Nephilim",
      symbol: "NEPH",
      base_uri:
        "https://ewtd.mypinata.cloud/ipfs/QmbrThqCsndQAqoCrSGogy43Bsbjkmay7nFsALz3W5ZLRv",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafybeibmgxr3sewd4wpbbz54cp7zbfex46zvwup5netmhlls2wkf7cpnyu?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "El Café Cartel - Gen 1",
      symbol: "CARTEL",
      base_uri:
        "https://bafybeienu3old5yt7c23yftcb7pjx2oux7pyaliwgo4btzjbjjvqvjz4nm.ipfs.dweb.link/",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafybeihkcxg5zpywkt4n3iuliaa6oriz35zsyhx54ou3onypxevqzyazza?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "Near Tinker Union",
      symbol: "NTU",
      base_uri: "https://ipfs.fleek.co/ipfs",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreidixsebqzucoj3sbwpt3xnogteirtqwhkifzflc72oy5qtkk3rgku?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "The Dons",
      symbol: "DONS",
      base_uri:
        "https://bafybeidc6bxn6txfks2usyz4guflzmdi5qt4ek7rwmqyurzg3qhq6w3zhe.ipfs.dweb.link/",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreiamzni6oq4jg3ztxbewrty57qnj3gbqjokfly7gssgs6nu2qmjima?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "Near Future: Classic Art",
      symbol: "NFCA",
      base_uri:
        "https://ewtd.mypinata.cloud/ipfs/QmbQJTTPHRdAH5jXYDZeooewu9sm4NwqWT7JtYch7VXeun",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreicfyhfkbhqrdglsyxghl7vx2djkhr2inbtsrbllbokdrj6jvglnl4?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "NEARton NFT",
      symbol: "NRTN",
      base_uri:
        "https://bafybeieru7nk7ps324zqjcnaaykzyrukffnept73jo2pvukjyvoob2vfzy.ipfs.dweb.link",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreibql42tly53kang244kjdaqityi246w37qubgujxeeuloma7lbx6u?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "Antisocial Ape Club",
      symbol: "ASAC",
      base_uri:
        "https://ipfs.io/ipfs/bafybeicj5zfhe3ytmfleeiindnqlj7ydkpoyitxm7idxdw2kucchojf7v4",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafybeigc6z74rtwmigcoo5eqcsc4gxwkganqs4uq5nuz4dwlhjhrurofeq?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "Mara",
      symbol: "MARA",
      base_uri:
        "https://ipfs.io/ipfs/bafybeibvdkthkvso4lrxaxazfof2qs6bkjwikfubktiojlksz3tj5txdyi",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafybeihyxgz6xf5skpkcxmkpelnxqwywzc5ixofmznxuhn7ytljttrrnky?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "MR. BROWN",
      symbol: "MRBRN",
      base_uri:
        "https://cloudflare-ipfs.com/ipfs/QmP3shtToBeoeHizRtvgUPJTeGbcVn2rdZhERSwEiQHtJh",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreib7swm5bevrsdqcy4ntppdkk2ssn5a3crm66jamna4npohs7wmf44?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
  {
    nft: {
      name: "Bullish Bulls",
      symbol: "thebullishbulls",
      base_uri:
        "https://bafybeiduuiztwwrphs4t7q5bl4xoidbemnbzkps2kzioflk2msacaw7yiu.ipfs.dweb.link",
    },
    token: projectTokens.generic,
    db_metadata: {
      collection_image:
        "https://paras-cdn.imgix.net/bafkreiebgkqhsdsww5vowwxgcjcqey2ga57vb5jroiz6ebgwrlzpi24e6m?w=800&auto=format,compress",
      collection_modal_image: null,
    },
  },
];

/*
 * This setup create a NFT + TOKEN pair for each listing
 * Must then pass select RPS, interval, min period and penalty to build each
 */
async function nftStakingSetup(execution_data) {
  console.log("Start NFT staking setup");

  let { connAccountMap } = execution_data;

  // Add owner as guardian
  await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.nftStaking.accountId,
    methodName: "add_guardian",
    args: { guardian: connAccountMap.ownerAccount.accountId },
    attachedDeposit: new BN(1),
  });

  // Create Partner Marketplace Token
  const partnerSupply = "1000000000000000000000000000000";
  const partnerMetadata = {
    spec: "ft-1.0.0",
    name: "Few and Far",
    symbol: "FAR",
    icon: "data:image/svg+xml,%3Csvg width='100px' height='100px' viewBox='0 0 100 100' version='1.1' xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink'%3E%3Ctitle%3EArtboard%3C/title%3E%3Cdefs%3E%3CradialGradient cx='21.9880676%25' cy='68.8403727%25' fx='21.9880676%25' fy='68.8403727%25' r='109.542893%25' id='radialGradient-1'%3E%3Cstop stop-color='%23B2CF67' offset='0%25'%3E%3C/stop%3E%3Cstop stop-color='%2375CED7' offset='56.5969187%25'%3E%3C/stop%3E%3Cstop stop-color='%23B6B7F8' offset='100%25'%3E%3C/stop%3E%3C/radialGradient%3E%3C/defs%3E%3Cg id='Artboard' stroke='none' stroke-width='1' fill='none' fill-rule='evenodd'%3E%3Crect id='Rectangle' fill='url(%23radialGradient-1)' x='0' y='0' width='100' height='100'%3E%3C/rect%3E%3Cpath d='M82.7692451,41.106498 L83,83 L41.3398092,83 L41.3398092,75.6400766 L75.6459075,75.6400766 L75.456591,41.1482042 L82.7692451,41.106498 Z M65.0417464,41.0894066 L65.2911892,65.1743472 L41.3389967,65.1743472 L41.3389967,57.8144237 L57.9021584,57.8144237 L57.7290922,41.1662769 L65.0417464,41.0894066 Z M57.6605158,33.8261435 L57.6605158,41.1860669 L41.0973541,41.1860669 L41.2704203,57.833396 L33.9577661,57.9102663 L33.7083233,33.8261435 L57.6605158,33.8261435 Z M57.6601908,16 L57.6601908,23.3599234 L23.3540925,23.3599234 L23.543409,57.850978 L16.2307549,57.8926843 L16,16 L57.6601908,16 Z' id='Combined-Shape' fill='%23FFFFFF'%3E%3C/path%3E%3C/g%3E%3C/svg%3E",
    reference: null,
    reference_hash: null,
    decimals: 18,
  };
  await deployToken(
    "partnertoken",
    partnerSupply,
    partnerMetadata,
    execution_data
  );

  // Add partner marketplace as contract_token
  await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.nftStaking.accountId,
    methodName: "add_contract_token",
    args: { token_id: connAccountMap.partnertoken.accountId },
    attachedDeposit: new BN(1),
  });

  // Deposit contract_tokens to NFT Staking Contract
  await registerContracts(
    [connAccountMap.nftStaking],
    [connAccountMap.partnertoken]
  );
  await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.partnertoken.accountId,
    methodName: "ft_transfer_call",
    args: {
      receiver_id: connAccountMap.nftStaking.accountId,
      amount: partnerSupply,
      msg: JSON.stringify({
        type: "Deposit",
        data: { type: "ContractTreasury" },
      }),
    },
    attachedDeposit: new BN(1),
    gas: new BN("300000000000000"),
  });

  // deposit lockedJUMP to NFT staking contract

  const lockedAmount = partnerSupply;
  await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.jumpTokenAccount.accountId,
    methodName: "ft_transfer_call",
    args: {
      receiver_id: connAccountMap.lockedTokenAccount.accountId,
      amount: lockedAmount,
      msg: JSON.stringify({
        type: "Mint",
        account_id: connAccountMap.ownerAccount.accountId,
      }),
    },
    attachedDeposit: new BN(1),
    gas: new BN("300000000000000"),
  });

  await connAccountMap.ownerAccount.functionCall({
    contractId: connAccountMap.lockedTokenAccount.accountId,
    methodName: "ft_transfer_call",
    args: {
      receiver_id: connAccountMap.nftStaking.accountId,
      amount: lockedAmount,
      msg: JSON.stringify({
        type: "Deposit",
        data: { type: "ContractTreasury" },
      }),
    },
    attachedDeposit: new BN(1),
    gas: new BN("300000000000000"),
  });

  // deploy all reward tokens
  for (token in projectTokens) {
    await deployToken(
      token,
      projectTokens[token].totalSupply,
      projectTokens[token],
      execution_data
    );
    await registerContracts(
      [connAccountMap.nftStaking],
      [connAccountMap[token]]
    );
  }

  // deploy all contracts and add to NFT staking contract
  for (collection of nftsArray) {
    const collectionName = parseAccountName(collection.nft.name);
    const collectionAddress =
      execution_data.accountMap.prefix + collectionName + ".testnet";
    const tokenAddress =
      execution_data.accountMap.prefix + collection.token.baseName + ".testnet";
    await deployNft(
      collectionName,
      {
        spec: "nft-1.0.0",
        ...collection.nft,
      },
      execution_data
    );

    await execution_data.connAccountMap.ownerAccount.functionCall({
      contractId: execution_data.connAccountMap.faucet.accountId,
      methodName: "nft_register",
      args: {
        account_id: collectionAddress,
      },
      gas: new BN(300000000000000),
    });

    const collection_rps = {};
    // randomize considering decimals
    collection_rps[connAccountMap.lockedTokenAccount.accountId] =
      generateRandom(100000000000000, 1000000000000000).toString();
    collection_rps[connAccountMap.partnertoken.accountId] = generateRandom(
      100000000000000,
      1000000000000000
    ).toString();
    collection_rps[tokenAddress] = generateRandom(1000, 5000).toString();
    const createStakingPayload = {
      collection_address: collectionAddress,
      collection_owner: connAccountMap.ownerAccount.accountId,
      token_address: tokenAddress,
      collection_rps,
      min_staking_period: "10000000000000",
      early_withdraw_penalty: "500000000000",
      round_interval: "10000",
      start_in: "0",
    };

    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap.nftStaking.accountId,
      methodName: "create_staking_program",
      args: {
        payload: createStakingPayload,
      },
      attachedDeposit: new BN(1),
      gas: new BN(300000000000000),
    });

    // deposit tokens to program
    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap.nftStaking.accountId,
      methodName: "transfer",
      args: {
        operation: { type: "ContractToCollection" },
        collection: {
          type: "NFTContract",
          account_id: collectionAddress,
        },
        token_id: connAccountMap.lockedTokenAccount.accountId,
        amount: "1000000000000000000000000",
      },
      attachedDeposit: new BN(1),
      gas: new BN(300000000000000),
    });

    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap.nftStaking.accountId,
      methodName: "transfer",
      args: {
        operation: { type: "CollectionToDistribution" },
        collection: {
          type: "NFTContract",
          account_id: collectionAddress,
        },
        token_id: connAccountMap.lockedTokenAccount.accountId,
        amount: "1000000000000000000000000",
      },
      attachedDeposit: new BN(1),
      gas: new BN(300000000000000),
    });

    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap.nftStaking.accountId,
      methodName: "transfer",
      args: {
        operation: { type: "ContractToCollection" },
        collection: {
          type: "NFTContract",
          account_id: collectionAddress,
        },
        token_id: connAccountMap.partnertoken.accountId,
        amount: "1000000000000000000000000",
      },
      attachedDeposit: new BN(1),
      gas: new BN(300000000000000),
    });

    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap.nftStaking.accountId,
      methodName: "transfer",
      args: {
        operation: { type: "CollectionToDistribution" },
        collection: {
          type: "NFTContract",
          account_id: collectionAddress,
        },
        token_id: connAccountMap.partnertoken.accountId,
        amount: "1000000000000000000000000",
      },
      attachedDeposit: new BN(1),
      gas: new BN(300000000000000),
    });

    await connAccountMap.ownerAccount.functionCall({
      contractId: tokenAddress,
      methodName: "ft_transfer_call",
      args: {
        receiver_id: connAccountMap.nftStaking.accountId,
        amount: "1000000000000",
        msg: JSON.stringify({
          type: "Deposit",
          data: {
            type: "CollectionTreasury",
            collection: {
              type: "NFTContract",
              account_id: collectionAddress,
            },
          },
        }),
      },
      attachedDeposit: new BN(1),
      gas: new BN(300000000000000),
    });

    await connAccountMap.ownerAccount.functionCall({
      contractId: connAccountMap.nftStaking.accountId,
      methodName: "transfer",
      args: {
        operation: { type: "CollectionToDistribution" },
        collection: {
          type: "NFTContract",
          account_id: collectionAddress,
        },
        token_id: tokenAddress,
        amount: "1000000000000",
      },
      attachedDeposit: new BN(1),
      gas: new BN(300000000000000),
    });
  }
}

module.exports = { nftStakingSetup, nftsArray, parseAccountName };
