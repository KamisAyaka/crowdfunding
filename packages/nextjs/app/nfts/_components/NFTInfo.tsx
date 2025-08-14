import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { formatEthAmount } from "~~/utils/crowdfunding-utils";

// Type for the NFT data
interface NFTData {
  tokenId: string;
  projectId: string;
  rank: number;
  donationAmount: string;
}

export function NFTInfo({ tokenId, projectId, rank, donationAmount }: NFTData) {
  const { data: nftContractInfo } = useDeployedContractInfo({ contractName: "CrowdfundingNFT" });
  const contractAddress = nftContractInfo?.address;

  // 格式化地址显示
  const formatAddress = (address: string | undefined) => {
    if (!address) return "N/A";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // 安全地将字符串转换为bigint
  const parseDonationAmount = (amount: string): bigint => {
    try {
      return BigInt(amount) || 0n;
    } catch (e) {
      console.error("Failed to parse donation amount:", e);
      return 0n;
    }
  };

  return (
    <div className="p-4 bg-base-100">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Token #{tokenId}</h3>
        <span className="badge badge-primary">排名 #{rank}</span>
      </div>
      <div className="space-y-1 text-sm">
        <p>
          项目ID: <span className="font-medium">{projectId}</span>
        </p>
        <p>
          捐赠金额: <span className="font-medium">{formatEthAmount(parseDonationAmount(donationAmount), 4)} ETH</span>
        </p>
        <p className="break-all">
          合约地址:
          {contractAddress ? (
            <span className="font-mono text-xs" title={contractAddress}>
              {formatAddress(contractAddress)}
            </span>
          ) : (
            "N/A"
          )}
        </p>
      </div>
    </div>
  );
}
