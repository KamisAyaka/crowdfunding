import { NFTImage } from "./NFTImage";
import { NFTInfo } from "./NFTInfo";

// Type for the NFT data
interface NFTData {
  tokenId: string;
  projectId: string;
  rank: number;
  donationAmount: string;
}

// NFT Box Component - 组合NFT图像和信息
export function NFTBox({ tokenId, projectId, rank, donationAmount }: NFTData) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 bg-base-100">
      <div className="aspect-square relative bg-base-200">
        <NFTImage tokenId={tokenId} />
      </div>
      <NFTInfo tokenId={tokenId} projectId={projectId} rank={rank} donationAmount={donationAmount} />
    </div>
  );
}
