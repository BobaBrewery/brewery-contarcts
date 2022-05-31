const hre = require("hardhat");
const {getSavedContractAddresses} = require('../utils')
const BN = require("bn.js");
const {BigNumber} = require("ethers");
const {ethers, web3} = hre


async function main() {
    const NUMBER_1E18 = "1000000000000000000";
    const contracts = getSavedContractAddresses()[hre.network.name];

    const wallets = [
        "0xf6420bba03Fa50387d74002Ab65c9346b6Add3A2",
        "0x7fe320DEb59F98943A5F12eD40DfF24C2e314438",
        "0xC3973175fe4B37acc9C48EE6a8991A90Cc646cF1",
        "0xaD8942250Ec72c984CD38800eb7DDCf5473F9583",
        "0x67e305e586CeA3C93EB873aeAfAE21F8A077D62D",
        "0x6b52eec81336683dB6F438D4c23e5D5bb3E3B7A3",
        "0xD07A69c2BB642EC18FdE2eE1f2f2399B3380C628",
        "0x153292fBD986978E4bd6EF63DA2Ce9ad9a2Be0b1",
        "0xC5EFC48c5830677b10Dd375CA3a0d6fFdE67e6B6",
        "0xd1F16f8c5Feb569e8DE0834A13cfc0Cd057e12EA",
        "0xec638103489d30688a0C8A3E5312DE6bb306bc66",
        "0x55a501D6c2a2ac98A03aD500fBC58d2B9e49A483",
        "0xbD6BcD5F108B03cB7FACd596d373E4A381018f06",
        "0xa651b90f7D3B5d9acE9f13159B515C956a7cAb8B",
        "0x3956c3fCe9893c02569c261DABD5Db6cE3255f9C",
        "0xBc62D7cE043A24ec329Ed649fED714c12B186685",
        "0x32665214a06004Ce7b7294e2a6C0de49bCEAaa25",
        "0x7152d57Aa0b31F1acdD8096E61526B2ad97Da05c",
        "0x7541879e2c1e43FE04784E98a661F15cC9934122",
        "0x34281b83c5F377420713d6aD3a9aD47999E76df0",
        "0xD025680b72477E1e091F1d4a7B06DDC33fba6Ac7",
        "0x4361811C9850049Fe605D37e55e44B1B6831C572",
        "0xa6C768C265DACaBb41992aA67a0ced41aAE9B286",
        "0x194120C8887f8891C85135119cfb48E7897B27d2",
        "0xE2a025c3B6DE15B79c6AB0C7Dc5Be2661B4D3a08",
        "0x7750A1b0006d2A8CABc03b3FE5EbF55625840460",
        "0xe7b5164d0962E055848617b8dC35ecde1e9300ED",
        "0xB7d5AaEfDc026Ed095e6440D1112411ac2640F14",
        "0x72114c0f9700a7cC9BbBF055530BF53CAB06b334",
        "0x050f20026f1f4e35F9FF66080704375615dA28DF",
        "0x087166Ae1393541238744681088E5e4978EeAC2e",
        "0x9dD51A7f6d28b5956d9376cDFFBedf4bD908fF03",
        "0xea77a7d07Bae4b39f050eFEdCb9DF02969428980",
        "0xAc24A2368E67bbA13d15c20b5B81A45F0F1070FF",
        "0xd9501901821c8e6A7c0dBBf81d5BF274642A590a",
        "0xEF1b20DD49C486fd61DC429E83984ac1a371A529",
        "0xD9022e1C303968fFFE3e9f08E4645c4411B71B4a",
        "0xC43565cDC53adc5c7BefA8ccd5C5cED04930be4C",
        "0x20b303223bdea665F25C89c9FD7ACa5f88fA0618",
        "0x68a65325E98c60956757eD4cDc326Cf6212e112a",
        "0x3866271e555031D59A276BA4531F70fe0eEE839F",
        "0x86112C6eb4eDa09C2d7BAEae41771F8e0688f1ee",
        "0x166a5176B81243486711720e4c7b0B28Fc410632",
        "0xBa0490B15241C6Eb64192FF379e699916221ec0a",
        "0xf3E4D60E1FFa378F79cCCea8e3EBfc77D36bfB8c",
        "0x02007CD5afb1B6B78e0895AeFF5112C5C36789b0",
        "0x93894B7DA015A4549f46918aF59199Ffa2E1a6b8",
        "0x52B885944c5c81a7Dc5e93C32503b72399E8237B",
        "0xbC617325604D60d39AdEFb122A3980d422808A9F",
        "0x2b8896A1f047Ed311C0432178BC92c46D054d61B",
        "0xd08bc1c9AF3975Edc9EEd8FA50EDC6b35cEb3980",
        "0xDF8cA271dDe5CCcB4f245238084A80338486a932",
        "0x74Aa5dD4EF1be6B5177EC7E4B0EBffcEB3a1c925",
        "0x5b12205FA567e52EABb4E1566F1f4343DB38703f",
        "0xe6C2D1e2FFdD6Eb5951463B5519456E28CB4FC6a",
        "0xd4A51016543Edc23f023A821320D8d23Fc955398",
        "0xDB2F74a163603851D12d77ED245875aEe07D632F",
        "0xc6a902566CDCaa9ed5A3ed88b73607238526027A",
        "0x69d1dfF3fb26686c259b16863f29e07E732b0976",
        "0x1CF7C7F6923570083779712bd40ef898108D34ad",
        "0x3746ee1632f521615217548AD5a649142f8040e3",
        "0x9A92a605e6bafCa4D2329543916EFfE4908b1918",
        "0x124FAaD01BddC12fbaCb01FE915F01e9AEad22fA",
        "0x9a33aD04624cbD60016Ac7C941Fe2c2c0ca5d613",
        "0x74c3D884A9f767AE8B37BA22AC7582f3aD1EFa0e",
        "0x5e786D9107C9DEe9574C5f223483E5F691361Cb8",
        "0x54a0B678A40eE8bf24Aba45a0adbabC82836a0ce",
        "0x7d2917AE32F979c385A639A50894debaC22fC872",
        "0xBFA3e65B723532376515b502E2762878449bEE07",
        "0xce291db120b7B7A2EFAd8AF21EF142a17794f8D9",
        "0x68Ea7950883b3611048173e2fEd4b940BB2Affe0",
        "0x0437B8bE9B742152b25fDa40D3A6e885a437802B",
        "0x3Be2d2a09336DaA743C284bD6Adf814eCa8E5C5b",
        "0x0403391021A69f02F0BF7358E5c64Ad83EEE07f6",
        "0x42501D7ad4bACb2E732937B07944C8EFd8099EF3",
        "0xc656396DBfa4E5fd38dB8d6f7D07A3eEF379d405",
        "0xF56057485Ea480a1564E8aAcd10aAef1f0202203",
        "0x87991C0876999CBaDF931Df65029E5548a983Bb8",
        "0xCdc01de4ac2E98bC3aA3d89B89f2AFE40d5f8EA1",
        "0x4f646348eBeF83091B461b6E83e3874Cb7E671Aa",
        "0xF62404bAE3BDe58D5Db25b8E556257f028432c0b",
        "0x70a1610087cF47e22BACB62dfe52EE493496CE69",
        "0x40cA850de4365d312f21bF22Ca0cE89cF543BD33",
        "0x1808B29f7Ceb2C327EF42372793E95Bb10bB06dA",
        "0x19bcBD0486204c87426A646116aEE82f4f7ad9c4",
        "0x00ba1fF778C393201C05Ea359A2e569e1b8b4050",
        "0xC30072862D1DbDB8e3b3eF816C2Ef63705A1d9a1",
        "0xabD8bB6DAFeA4c95cbD3b748ac308727784DAC49",
        "0x7763dE4aCBa0ac8D349e3C7FE34e6882fFdCA90f",
        "0x0B24eBb31Ca0Ce5240ddC0a2383Fa40da7f4c317",
        "0xB010248eF669F813b76B216709ea25DCC8b8f19A",
        "0x9b6a619B83fC86A1099caE99279A6F4FdF13D36B",
        "0x06eBc16E7cd97FA58Dbdd29243B7fAaF24D85446",
        "0x69AdB77416d9d320e50F73CCDf36d0d98D4E81Be",
        "0x9A5cFb67C1003aE2ec61571ACbaaea7c59cCB96d",
        "0xA4017d17aEFd07F2D7c3f3D7c4aCde60107E58aF",
        "0xe4cf4AB9fB0f756aE1D80872CaF7Aa89203C11Dc",
        "0xBf4C47D41Ce6f6dc012c3d8Ed633bE345831e2ae",
        "0xa84B7076d984E7242baB629fDc94561B53e4dD9D",
        "0x11554acfD3e4af067b38115D9C486A2f9E335EB9",
        "0x520f79D5764A415545027b4fACC8809c17D07303",
        "0xd50f1EebFaCf5dE495236bc39272DD35327dC50C",
        "0x2C0cc44B11a6573B357fc356f14b4E30EC1b2ccD",
        "0xc94766771BE7C2af58973Bfad873bc2793a3ad3E",
        "0x27066dFebD6b8FFf0A0EF4BaF77752175Fee8bB3",
        "0x9a1A9AACe80E3400ba982a606Dc6EBC9FA9bD25C",
        "0x2aAf79d2D4dFFB526f232fA84Ee689EF44C633eC",
        "0xC9Ac3dBB5da90CAA90423c6c70DAB22F4B0f1F6b",
        "0x946461Fd653248287410CFa15a7a9F2d01520895",
        "0xBad2507D45A43861F22711959fE3e72371FfD59b",
        "0xd7f15032893CbB1c70edd78e625167B5d9B7BfC2",
        "0x98625E951792b54613941a1428dA27cdBCf6C8E5",
        "0x51D87a57f373543d7d610cB0bD017336573bd3Cd",
        "0x78Fd36cE6f78d029f07a6Eb0989376E54E899CAe",
        "0x716fB21dA692a0523136661be4297748d9a48b0d",
        "0xE4BCF813724ccA0DaCb767f4F96d96038D618E6d",
        "0x1457f3aA5e99683EA228d46f0165Fb6eE9500dd4",
        "0x6A34Bf4A4B2BB3c073139e171a7f6AF75E4a46F0",
        "0xAD8BDd7FF758E54716762B0DdA266d97eC4a48e3",
        "0xa53aE70f1f58Bc664DbAC1cA0C176B5FD8f4CBf3",
        "0x65Ad1A4a5ac82C7Fb5778A2C5fBBbEdc74A10E0A",
        "0x627D3eE864A98aa53c614369086AA658B3186204",
        "0xC88F255155FaEe6E96843F3c9be11c64Fb8F0591",
        "0x28327B286a8a1893c0D57b7FB1768eF49c3A9c6A",
        "0x908644D58309Cf7992ba0037114D77AAE996a59f",
        "0x56e9cc63B4DE4e97C07F0640241A56D22E5Be7f5",
        "0xf5EbE2Bee738efF25EeD4C2e1A68A8890C11c565",
        "0xb08569f098A7F690D5D9343D2217b09454ceebe0",
        "0x1Ca983E590C605A9B7727883aEE363fF49920ad1",
        "0xda8a1370257a25D5EB484B5630EBB6D9A449e324",
        "0xd605880cafa821A376291D6B7e7A7f2fDB255227",
        "0xB66041a1920c35014d100C802B4048dE6005db4b",
        "0xE6d2040aAEa8fd578BBf15f8C266121b6F67d887",
        "0x4cF04e97ae6DE9F870196f90d339DDE51Fb1e906",
        "0xb289A671F4eB24f6dcf2991fD9AB3CF074b4166d",
        "0x8E37E9273d556660BBB3Df689a9d586e86eD2A02",
        "0x65a0a9d5a7224a38A407a7D89f82c4473926C6B9",
        "0x253e6ADA7eeE82ABa1E2719C69c88C6a9538a3d0",
        "0x9331754D799E77f90eBd218385C1F9d95cDeF931",
        "0x73500c09548Cb23B85C8E19fFC53Da8cFc2288D6",
        "0x9e565eF4B6846F4242E9f744E4496dE09Cca321E",
        "0x9B360F5eD2F298e60Cf8096cC050595F6200732b",
        "0xF1c6fa7aF50CE09653C78f25154383bd06891539",
        "0xd8de9c9D1228C2F91f0Da4a3E3cCB481bEC81f47",
        "0x7118b26d494e7e6887693285e4d6B46025F804f3",
        "0xC3aE169686e88C4cac4C456Ca5e522E8B3196A5D",
        "0x9e4B7D9F43d7D44C63f069490F9Cc1AAC985De56",
        "0xEF0d407011A6718DdceE6FF8cdd48Dd99E98675E",
        "0x4A26c4560133DD37Eee3F483e329AED4b884e137",
        "0x4eA8381E53dC52A8fa8Ee7199187B264e02e9060",
        "0x51F73df4C1388A2fA29adC777559ac558AC1F264",
        "0xB9098e4ab78d30f4eD7203CdC7aA70861527f20D",
        "0x5f1Af59903CF38DAac2F12F6654EaF6B05218F30",
        "0x2C1A42200c8468Fd9DaC442145198f836aEFE11A",
        "0xE7e02583C4097FB06bb7ffe260af0F196AC01c5D",
        "0x43636e5A545F065Afd3a7C463804B35f879629f0",
        "0xFCf97e7bb104b865dF1044427F10fd239a40f873",
        "0x81cd0D467185EAceb3512D470c6fC4802496Bc08",
        "0x3Cd62C85415b5d0CbbA6F73B127438F3B7cD9E17",
        "0x7833a18711eFFE29EF166da17ca840A0964349F3",
        "0xF1a955579A5a812FAbAD6457E37c521439B8f082",
        "0x1ba0F564F0a60ff3fcF4195724241817dd51F18B",
        "0x2d78dC4fE1159cEDa6F89590C29c71cc2849B805",
        "0x96536bc18CAfC955fA19f5D451468F12079FC178",
        "0x0e9720D3C4b42690B3b147EbBAC35Eb0fa606B9e",
        "0x2893077304D4BE0ffD6421B5fC14B4A13D0FD505",
        "0xF118209c457CDc75D0C400Ee8bb78784B81C2Ac7",
        "0x1e91123fC6d9b8782b493Bb42b8580b1423be036",
        "0x2aaec20e2d8f6CE5f544F93520594B564bc069EC",
        "0xe07045D75cC6F27b350dcb97EdD8Fa1e917Fd96b",
        "0x13bCb4eD7407baf3Fa80258202764E35D85b1d22",
        "0xeD824763302106e6f49565C9E4F737976360934b",
        "0xc45c6979D98169f14623C3Acc489Ba6A21dFfc23",
        "0x331429c704232Ca998918Ee394Fa56953230FD4C",
        "0x53EeC8cdb310e52da37EE00CEB401f628089522d",
        "0xa69c11227331a869A29695b824E50d557CC89e9e",
        "0x1682f316c42136a68Ac31062746BEa3603A02b5A",
        "0x814A56C9292dAC18bdE6097547bc7097cCfA5F65",
        "0x3F86dC3b4F444b007e407B25eb16a76fd1079443",
        "0x464417a4eC18ACb1Ff0996380441Fad082EdBcC9",
        "0xD7C33D1e66710104475c569F38896f19AE14BB31",
        "0xD4A93143cE1eEdc08B0929B568364c2d64a30C63",
        "0xE2c9871520D74dDe80a59086D3361f9A3d132c90",
        "0xD14C2e1D9f051908b9222185b5344f82AA3AA967",
        "0x4A26C14F906103781935b0AF29167bF052fD2Bcb",
        "0xbB84fB3bb62a10429860454cD5a6d702aa08dAD0",
        "0xB32213698071aa7C6269cdca9f0ec23810AF5f82",
        "0x2DFcAF1347Bb3C4F7589071EeAac411c570b1F78",
        "0x564c0222842276807b9FCcB97C068963A9d2b59d",
        "0x9F43ee48C819F987874ca9D3235eB92e20eC7f23",
        "0x6DFaed2B7433866ff565AAAc317df8332a9e1793",
        "0x6F19295d8d3BD1182b71B2d5dEBDA3192C5d972d",
        "0x9ce65Fe365A7D07fe42b2F7D7d45b82DBc6d97e0",
        "0xc647Cd33BF7897Fc7D299B4B615bb9fF593e3D60",
        "0xEb1f02455a3E1E617CB2e16837f84395f3617a2e",
        "0x41e1ccB77D43e92F1965e575B6a7111C37aC0CC1",
        "0x1E1f941E686a5402b867d857773e29F4B751a463",
        "0x4c537a44177Be604b582C70bd6AE26d4e7Fb5031",
        "0x44aA9A3eCAc66cD6AF7Cae5F50e2B0aB8354b634",
        "0x42816862d740ce562dCA7808bD37BE71c17e2E84",
        "0x7A194611e42Ec6Fe4B716b61855ad1ff01E69b35",
        "0xB15524E67f25DBCeADAf87E31E1B7a69FC398a32",
        "0x863203476595806b4078525cCC37c44f7e6709e5",
        "0x146dFC16FB06b1975Fa3f6a4287b192d66E09f8c",
        "0x043991727A73aE614fCc5F9F391E65D471906e9E",
        "0x5992631113a264b705F6D40Ea20fB03298D99df1",
        "0xDE6d94b88683da6fdF0F5c033BE6a2A97f86aa2a",
        "0xC82F986F237f8bb5B42d0F809FC3C796a01E0741",
        "0xb0f14cF97A8FC2c917e6f79fC6E7E42aC68FC0b6",
        "0xD4b433A7A7Ba100D23F0Ef27f4713Ca038cf28BE",
        "0xB3617f30FC326fE1D72B0a25f68f223E21Bd68aB",
        "0xFE9C2F1BBe62eC8cBA704d9c91572589195e91d2",
        "0x5526eDcB06a1802F8a9B92BA8A8A7eF2B3124506",
        "0xD856BABa5efc514bD8bdc869dcb938fCd88059F5",
        "0x49FC3dfBa7512D25b8b1D41C078A4487C318340f",
        "0xFC948Bab0Be3B4B9259848D354f916313FFBA2BA",
        "0x080A1d0131CDe9Eec74037c6119C4fAC0627B823",
        "0x79ABCEd94940057a610b889DDf9F587ff0A46688",
        "0x2e82dD42877d13FA540eFe3d877B9e5016B71b69",
        "0x49Bb5BaA82b0AA1464945Cb412e34e7298937864",
        "0x29FA90E12f2A66BbA4789D625FB55ebbF0741dBf",
        "0x1EC5b5E9B6A63DA4c04EfD10E635EC8e97Dc8506",
        "0x315C6cb624357D2f42830fa52d9385623C2b1bC8",
        "0x853339292BFa9369C15Dc3886bfCf3d64789d345",
        "0x2db61930eD8E2F1f1500D645389E9192Afa72547",
        "0xF295bb68c59463EC80026259413d8b6fdBeF6317",
        "0xE0509c7d4B6D0735d2B177A5BD8ac54F4fc578C9",
        "0x80Cb2411eCCb901CceA3fbe794C19e83A9d3E581",
        "0x8479C2161Be91E11F54bfbcA86780ddC48478Baa",
        "0x3ee12Beee938823BE1E9168125d1072247D850FA",
        "0xA9A154Ccf0a08a2D662A649d8e6b5aeCfCAe56bb",
        "0x22a64cdf084035a98dC965922C3F938FCEd4e3d7",
        "0xe0eB13C7655ab26Bd0260c376D6a2A5fB6f393b1",
        "0x993A19A192df673EDBA6eB3B25e9C6320f0E1D02",
        "0xb8A1C23A6c8aA9Ea5050Ae4F340036FC134A5E28",
        "0x6fF664551e7924C908A2Da4eB90672e64f98d302",
        "0x5f3c1A0396089F6f2052000d5f676aa2Adcd1A2f",
        "0xA73D9AC458AB3152aA4348669FE5E5d8e9ebe140",
        "0xdC49f3F8CE410CbD23e3Cd03ED87926a53989d70",
        "0x46A03Dce9Fb1059B868120F622c786b4A2Bd28d5",
        "0xe0BD1A8F827EEdD2d78f79ab709d3aE13cBD5ecE",
        "0x715ddAA60f01edde73181aFc5Ab94d8bcb19F652",
        "0x5D94a9cD45d0D0129b76D388E12Eb557Abb1B2e5",
        "0xce5E302de4164cb0815b3C388f200854Ac1b5c3c",
        "0x6403b0C8ac683c9A2fa8F623de66D80d0eF1A8d2",
        "0xd8E6fCb52b6af9091149C03d79092bc8e58286D2",
        "0x7EC708B6220fDa39C6f1486E1FE616D7290AAbfA",
        "0x125F5784893E3b7f26194579351210dA4BE9D8a5",
        "0xc3D140EdA1bDbE4057953C5AB704854889e561B0",
        "0xe5F23cAA1cDdE06F16D99BaA45EDDEc8411A0b9c",
        "0x52A3396b5dAb98d45D66A1B5a51ed7156CD4f8dD",
        "0xd70fb4f1079C588BabAb5757473697B296823EFB",
        "0x3D55205BEF634429cF9f1BAaa93Aada19F176D86",
        "0x7DC51b6e038fF280Bba00Ba9a874d8b727c0490b",
        "0x8D822E7C53F8C8D0E5f2B98Ee81504D716f47238",
        "0x047bE7169E057A72136225098E10604828402a0A",
        "0x47D7eDAb1efedd531f1dEeDA1E25b5b59c53B858",
        "0x45208AfF4D27d82F7CCccdF393346d1f47Fc9102",
        "0xA653809A1880900257F1F65fe7B1Ac8d9F102eD8",
        "0x4DCD9EffcB9432081cc439e5c700f8592aC9fA24",
        "0xF5943FbF20BaE5C48713F782AeB5768B27c2E8b1",
        "0xE0807a19F0186AB0DD965D3529AF757E9c15EECF",
        "0x526d45eCe8F8412ddE50acd72f0E4D92655f090A",
        "0xB7f570E2112b16fBA03E0B6Fe8FF5866FD44277F",
        "0x4c3A1816A332a02f53e9e6Ed44941235002Dc2B8",
        "0x5706c007A3897c8F3e5E562166e997fA7EF99a44",
        "0x2efE99fe9C3c7f27e0957b1B6916eb0c0A8B8e0f",
        "0x081692C654adBfc603e66D01B226d5ad30B4cc94",
        "0x75Ea96d420C61eA352b377004c6D3a71F085912D",
        "0x7F4cd345ffC6e7105739450Af9CdF75e52949B9e",
        "0xbEb58b39fD3d05DE4cF8165a24937E7466A77F3e",
        "0x6B757fBBEDb23a5ba78CeBfC11a7c6eBD469698f",
        "0x4C9b0823117De3861fDFa29af303885be74937d0",
        "0x160f3d3e6A8e10c874C85fBfC131443c821745dF",
        "0x85e165C869F3f3bD1603cDEAdECDAc45d99C8DaD",
        "0x72eaf936Da3856929d0833982E0D1E0B653FFa9c",
        "0xb16eD975F4f54DF7e8455eCd8F806193510f88EE",
        "0xE7945899406A1d154A6469007EcD8286Fc236C42",
        "0x71Ac4356A2BdaAFaE2Fb3fdB28690d082F2b0eb7",
        "0xb5f3a524807D1e5b47159bDF575a631A36D769E7",
        "0x681cf6331312813e2194F7E9c3d96B2F504F4F81",
        "0x9F5A55E375567a7af48896AB0D01C646453C018D",
        "0xad79e3D86C9d2867844B24477c8cc1913d3D126A",
        "0xf0fbD8611E04048A300260eB374A3EbDE259301C",
        "0xD5317c090e7f917cA22a7a74A6af26784d0e9618",
        "0x69072b574F5C6c7D82ee2a93c993f4381D5362c6",
        "0x61659AF564AA51D1eD87854f3DfDb48bbca260F1",
        "0x179F3A7E89B02aDF434588AA453C950712b13C06",
        "0x3866a02D8D288a961aB3eC27Df26DD3908B67562",
        "0x6432e31B0Ff1e4A51a498DDcdd6E23eC8e0e186F",
        "0x62cc996DEC5CD3660CA3b2550d821787276637D4",
        "0xF1dD1E71deebFEB7433B7311d600772E78F4261C",
        "0x7bfAa6FF7D677262bf3E137A7E0062993af7ddfB",
        "0x576172072F0c0c097bAa9EB6feeF83bA4132F424",
        "0x2C9f4dCED6d8D0b546460248c651507c36E51048",
        "0x0c7e316825F9Fd63204098ba1d1D03Fd1c52AF22",
        "0x0D09e28Cd2d289b411FC9A9EBCAd85834f239519",
        "0xd33D627f5D0bD256EB9426820d392D995cc57998",
        "0x02b111c8694C3Ff0216273b225D2772EC751a889",
        "0xF96Bfa3a203bBf3CFE756db0AE1038ef74f42f38",
        "0xA4a61FffCD995615e1d0490B209AD3363fa29447",
        "0x8B52E202a7658444cd8a99020276DCc18389aA86",
        "0x8effCd07458a8c702bCe10430f75BB1BD5943921",
        "0xC714A9a84dafa617DB3F780E92d42AC50d7DC81E",
        "0x82BbD29674e2b37fE1176836feeFC33e2dbF8978",
        "0xcfB134e9e6D82a4C960f177204e1B58e0476BbE1",
        "0x7b2F0a73cFcF32E9a06e35F44ADBE488DFbb8097",
        "0x7294D5E25C1B45a9e8d003E973dA7932561d65aD",
        "0xFD86F723e65B0B6050cf9A08976A2Af478FE987E",
        "0x63F1E54254894E84932Ff90Ff48c43467C9fde84",
        "0x5824Aa83d95D5012f744aD196e7ac7e395F94Cf4",
        "0x388140D4a60A05e9A44D1e9fA474b831e59e7585"
    ];
    const amountETH = BigNumber.from(3).mul(NUMBER_1E18).div(100)

    console.log('Number of wallets to receive ETH = ', wallets.length);

    const disperse = await hre.ethers.getContractAt('Disperse', contracts['Disperse']);
    await disperse.disperseEther(wallets.slice(200, 300), amountETH, {value: amountETH.mul(100), gasLimit: 2000000})

}


main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
