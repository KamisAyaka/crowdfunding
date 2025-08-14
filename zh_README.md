# 去中心化众筹平台

基于Solidity的智能合约系统，集成NFT奖励与链上治理机制

## 项目概述
本系统包含三个核心智能合约，实现以下功能：
- 🎉 **去中心化众筹**：支持项目创建、资金捐赠、成果追踪
- 🎨 **动态NFT奖励**：前端代码会在项目成功完成的时候会将前五名捐赠者的地址传入到合约中，合约会自动生成可收藏的蛋糕主题NFT，并将其发送给捐赠者。项目创始人也可以直接与合约进行交互传入想要铸造nft的地址，只要该地址在捐赠名单中即可
- 🗳️ **链上治理**：提案机制实现资金使用透明化管理，项目创始人在项目成功完成的时候只能使用总募集金额的25%，想要获得更多资金的使用权必须发起提案申请增加资金使用额度。如果提案连续失败三次之后项目就会标记为失败，捐赠者可以取回该项目中的余额
- ⚖️ **双重保障机制**：项目成功后的资金释放与失败后的自动退款

## 核心合约

### 1. Crowdfunding 主合约
#### 主要功能
- `createProject()` 创建新项目（名称/描述/目标/截止日期）
- `donate()` 支持ETH捐赠并更新捐赠排名
- `completeProject()` 项目结束后判断是否达到预期筹款的目标：
  - ✅ 成功：释放25%资金 + 铸造NFT
  - ❌ 失败：启动退款通道
- `withdrawFunds()` 项目方分阶段提取资金（初始可以提取25%作为启动资金，之后还想提取更多的资金需要发起提案进行投票）
- `refund()` 捐赠者赎回资金（项目失败之后可以取回）

#### 数据结构
```solidity
struct Project {
    uint id; // 项目唯一标识
    address payable creator; // 项目发起人地址
    string name; // 项目名称
    string description; // 项目描述
    uint goal; // 筹款目标金额
    uint deadline; // 截止日期（时间戳）
    uint currentAmount; // 当前剩余筹款总额
    uint totalAmount; // 项目总筹款金额
    uint allowence; //提案者允许使用的金额
    bool completed; // 项目是否已结束
    bool isSuccessful; // 项目是否成功
}
```

### 2. CrowdfundingNFT 合约
#### NFT特性
- 🖼️ **动态生成SVG**：通过`createSvgNftFromSeed()`生成7层参数的蛋糕图像
- 📝 **元数据包含**：
  - 项目ID
  - 捐赠金额 
  - 捐赠排名（1-5）如果由前端直接调用的话，否则按手动传入顺序排序
- 🔒 **安全铸造**：仅项目合约可调用`mintNFT()`

#### 视觉元素
```solidity
struct CakeColors {
    string plateColor;         // 餐盘颜色
    string bottomColor;        // 底层蛋糕
    string topColor;           // 顶层蛋糕
    string frostingColor;      // 糖霜颜色
    string candleColor;        // 蜡烛颜色
    string decorationsColor;   // 装饰颜色
    string icingSwirlsColor;   // 糖衣旋涡颜色
}
```

### 3. ProposalGovernance 治理合约
#### 提案生命周期
1. **创建提案** `createProposal()`
   - 仅项目发起人
   - 每次只能存在一个活跃提案
   - 投票周期1-7天

2. **投票机制** `voteOnProposal()`
   - ⚖️ 权重与捐赠金额正相关
   - ✅ 支持/❌ 反对票分离统计，支持的金额占总投票金额的60%该提案就算通过，增加项目可用资金额度
   - 🕒 只有截止时间到了才能结束该提案

3. **提案执行** `executeProposal()`
   - 通过：增加项目可用资金额度
   - 拒绝：累计失败次数，3次失败触发项目终止

## 前端架构

### 技术栈
- **Next.js 14** (App Router 模式)
- **Wagmi v2** + **RainbowKit** 钱包连接
- **Tailwind CSS** 样式框架
- **react-hot-toast** 通知系统

### 核心模块
```
app/
├── create-project/     # 项目创建页
├── project/[id]/       # 项目详情页
│   ├── proposals/      # 提案子系统
│   │   ├── [proposalId]/ # 提案详情页
│   │   └── create/     # 提案创建页
├── proposal/           # 提案详情页
├── layout.tsx          # 全局布局
├── page.tsx            # 首页
components/
├── Header.tsx          # 导航栏（集成钱包连接）
├── HomePage.tsx        # 项目列表卡片组件
└── NFTBox.tsx          # NFT展示组件（动态SVG渲染）
utils/
└── formatters.tsx      # 金额格式化工具（ETH单位转换）
```

## 部署与交互

### 前置条件
- [Foundry](https://getfoundry.sh/) 开发环境
- Solidity 0.8.0+
- [rindexer](https://rindexer.xyz/)链上索引器（监听合约的事件）

### 前端启动条件

1. **环境要求**
```bash
Node.js >= 18.x
npm >= 9.x 或 yarn >= 1.22.x
```

2. **安装依赖**
```bash
cd src/app && npm install
# 或使用 yarn
yarn install
```

3. **环境变量配置**
创建 .env.local 文件并配置：
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID="YOUR_PROJECT_ID"//链接钱包的组件需要的项目ID
NEXT_PUBLIC_GRAPHQL_API_URL="YOUR_GRAPHQL_API_URL||http://localhost:3001/graphql"
```

4. **开发模式启动**
```bash
npm run dev
# 或
yarn dev
```

### 部署步骤(脚本在foundry/script/deploy.s.sol)
1. 部署NFT合约：
```bash
forge create CrowdfundingNFT --constructor-args "CrowdfundingNFT" "CFNFT"
```

1. 部署主合约：
```bash
forge create Crowdfunding
```

1. 部署治理合约：
```bash
forge create ProposalGovernance --constructor-args <Crowdfunding合约地址>
```

1. 设置合约关联：
```solidity
// 设置众筹合约的NFT地址
crowdfunding.setNFTContractAddress(nftAddress);
// 设置NFT合约的owner为众筹合约这样，项目发起者就可以控制nft的生成，从而控制项目的成功和失败。
nft.transferOwnership(address(crowdfunding));
// 设置提案合约地址
crowdfunding.setProposalAddress(governanceAddress);
```

## 使用示例
### 启动项目
1. npm run dev 启动前端页面
2. anvil --load-state Crowdfunding-anvil.json 启动模拟环境,合约已经部署在Crowdfunding-anvil.json环境中
3. 进入rindexer文件夹中启动 rindexer start all 启动链上索引器监听事件并将其存储在数据库中
4. 可以通过下面的命令修改anvil的区块时间。86400秒为一天
```bash
curl -H "Content-Type: application/json" -X POST --data '{
    "jsonrpc":"2.0",
    "method":"evm_increaseTime",
    "params":[86400],  
    "id":1
}' http://localhost:8545
```
### 创建项目


### 捐赠参与


### 创建资金提案


## 安全机制
- 🔐 仅Owner可设置关键合约地址
- ⏳ 提案超时自动失效
- 🛑 三次提案失败自动触发退款
- 💸 资金提取需通过allowence额度控制

## 事件监控
```solidity
// 项目事件
event ProjectCreated(
    uint indexed id,
    address indexed creator,
    string name,
    string description,
    uint goal,
    uint deadline
);
event DonationMade(
    uint indexed id,
    address indexed donor,
    uint amount,
    uint currentAmount
);
event ProjectCompleted(uint indexed id, bool isSuccessful);
event FundsWithdrawn(uint indexed id, address indexed account, uint amount);
event AllowenceIncreased(uint indexed id, uint allowence);
event ProjectFailed(uint indexed id);

// NFT事件
event CreatedNFT(uint indexed tokenId);
event NFTMinted(
    uint indexed id,
    address indexed recipient,
    uint indexed tokenId,
    uint rank,
    uint donationAmount
);

// 治理事件
event ProposalCreated(
    uint indexed projectId,
    uint indexed proposalId,
    string description,
    uint amount,
    uint voteDeadline
);
event Voted(
    uint indexed projectId,
    uint indexed proposalId,
    address indexed voter,
    bool support,
    uint amount
);
event ProposalExecuted(
    uint indexed projectId,
    uint indexed proposalId,
    bool passed
);
```
### 对项目的一些反思
1. 虽然对项目的发起者提取项目的资金有了一定的限制，但项目发起者仍然可以创建多个不同的地址，向该项目捐赠超过60%的捐赠金额，从而掌控项目的投票权，达到控制项目资金授权的目的。这样的行为会导致善意的捐赠者的资金被窃取。是否需要一个中心化实体来控制项目的成功和失败，阻止恶意项目发起者窃取项目资金呢？
2. 由于在发起项目和发起提案的时候需要把描述写到链上，所以如果描述过长的话，可能会导致gas费过多，导致项目发起方的资金被过度消耗。是不是可以将项目的描述存储在数据库中，通过ipfs或者其他去中心化存储方案来存储描述，减少gas费。在链上只用存储描述的hash值，通过ipfs或者其他去中心化存储方案来获取并验证描述。这样可以降低gas费的消耗。
3. 项目创始人可以在众筹项目成功结束的时候传入自己想要铸造nft的地址，众筹合约会根据传入的地址将nft mint给该地址。如果项目发起方绕过前端直接与合约进行交互，那么项目发起方有可能创建多个只捐赠少量金额的地址来捐赠项目，之后只向这些地址进行nft mint，捐赠金额前几名的地址却没有获得nft的奖励。不过这些捐赠大量金额的地址可以掌控项目的投票权，从而遏制项目发起人的恶意行为。或者也可以在铸造nft的时候添加最小捐赠金额限制，只有捐赠金额达到最小捐赠金额后才能获得nft。
4. 有些前端的计算和查询其实是不必要的，完全可以通过数据库的操作进行完成，前端只需要从数据库中读取数据库整合之后的数据即可，但是这个项目是作为学习项目，所以为了方便理解并且由于时间的原因，我使用了前端的计算和查询，没有对数据库中的内容做进一步的整合。

## 环境要求

在开始之前，您需要安装以下工具：

- [Node (>= v20.18.3)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) 或 [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)

## 快速开始

要开始使用本项目，请按照以下步骤操作：

1. 如果在CLI中跳过了安装依赖项，请安装依赖项：

```
cd my-dapp-example
yarn install
```

2. 在第一个终端中运行本地网络：

```
yarn chain
```

该命令使用Foundry启动本地以太坊网络。网络在您的本地机器上运行，可用于测试和开发。您可以自定义`packages/foundry/foundry.toml`中的网络配置。

3. 在第二个终端中，部署测试合约：

```
yarn deploy
```

该命令将众筹智能合约部署到本地网络。合约位于`packages/foundry/contracts`中，您可以根据需要进行修改。[yarn deploy]命令使用位于`packages/foundry/script`中的部署脚本来将合约部署到网络。

4. 在第三个终端中，启动您的NextJS应用程序：

```
yarn start
```

访问您的应用程序：`http://localhost:3000`。您可以使用各个页面与您的智能合约进行交互。您可以在`packages/nextjs/scaffold.config.ts`中调整应用程序配置。

使用`yarn foundry:test`运行智能合约测试

- 在`packages/foundry/src`中编辑您的智能合约
- 在`packages/nextjs/app/page.tsx`中编辑您的前端主页
- 在`packages/foundry/script`中编辑您的部署脚本