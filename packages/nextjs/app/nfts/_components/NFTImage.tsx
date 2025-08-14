import { useEffect, useState } from "react";
import Image from "next/image";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function NFTImage({ tokenId }: { tokenId: string }) {
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { data: nftContractInfo } = useDeployedContractInfo({ contractName: "CrowdfundingNFT" });
  const contractAddress = nftContractInfo?.address;

  // Fetch the tokenURI from the contract
  const {
    data: tokenURIData,
    isLoading: isTokenURILoading,
    error: tokenURIError,
  } = useScaffoldReadContract({
    contractName: "CrowdfundingNFT",
    functionName: "tokenURI",
    args: [tokenId ? BigInt(tokenId) : undefined],
    query: {
      enabled: !!(tokenId && contractAddress && nftContractInfo?.abi),
    },
  });

  // Fetch the metadata and extract image URL when tokenURI is available
  useEffect(() => {
    if (tokenURIData && !isTokenURILoading) {
      const fetchMetadata = async () => {
        setIsLoadingImage(true);
        setImageError(false); // 重置错误状态
        try {
          // 直接解析base64数据
          if (typeof tokenURIData === "string" && tokenURIData.startsWith("data:application/json;base64,")) {
            const base64Data = tokenURIData.split(",")[1];
            const jsonString = atob(base64Data);
            const metadata = JSON.parse(jsonString);
            setNftImageUrl(metadata.image); // 直接使用image字段
          } else {
            throw new Error("Invalid tokenURI format");
          }
        } catch (error) {
          console.error("元数据解析错误:", error);
          setImageError(true);
        } finally {
          setIsLoadingImage(false);
        }
      };

      fetchMetadata();
    }
  }, [tokenURIData, isTokenURILoading, tokenId]); // 添加tokenId作为依赖项

  if (isLoadingImage || isTokenURILoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="loading loading-spinner"></span>
      </div>
    );
  }

  if (imageError || tokenURIError || !nftImageUrl) {
    // Fallback to local placeholder when there's an error
    return <Image src="/github_image.png" alt={`NFT ${tokenId}`} fill className="object-cover" />;
  }

  // Display the actual NFT image
  return (
    <Image src={nftImageUrl} alt={`NFT ${tokenId}`} fill className="object-cover" onError={() => setImageError(true)} />
  );
}
