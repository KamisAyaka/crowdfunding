#!/bin/bash

# 加载环境变量
source .env

# 从部署文件中提取合约地址
echo "正在提取合约地址..."

CROWDFUNDING_NFT=$(jq -r '.transactions[] | select(.contractName=="CrowdfundingNFT") | .contractAddress' broadcast/Deploy.s.sol/11155111/run-latest.json)
CROWDFUNDING=$(jq -r '.transactions[] | select(.contractName=="Crowdfunding") | .contractAddress' broadcast/Deploy.s.sol/11155111/run-latest.json)
PROPOSAL_GOVERNANCE=$(jq -r '.transactions[] | select(.contractName=="ProposalGovernance") | .contractAddress' broadcast/Deploy.s.sol/11155111/run-latest.json)

echo "找到以下合约地址:"
echo "CrowdfundingNFT: $CROWDFUNDING_NFT"
echo "Crowdfunding: $CROWDFUNDING"
echo "ProposalGovernance: $PROPOSAL_GOVERNANCE"

# 验证合约
if [ "$CROWDFUNDING_NFT" != "null" ]; then
  echo "正在验证 CrowdfundingNFT 合约..."
  forge verify-contract \
    --chain sepolia \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --watch \
    $CROWDFUNDING_NFT \
    src/CrowdfundingNFT.sol:CrowdfundingNFT
fi

if [ "$CROWDFUNDING" != "null" ]; then
  echo "正在验证 Crowdfunding 合约..."
  forge verify-contract \
    --chain sepolia \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --watch \
    $CROWDFUNDING \
    src/Crowdfunding.sol:Crowdfunding
fi

if [ "$PROPOSAL_GOVERNANCE" != "null" ]; then
  echo "正在验证 ProposalGovernance 合约..."
  forge verify-contract \
    --chain sepolia \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --watch \
    $PROPOSAL_GOVERNANCE \
    src/ProposalGovernance.sol:ProposalGovernance
fi

echo "验证命令已提交，您可以在 Etherscan 上查看验证进度。"
