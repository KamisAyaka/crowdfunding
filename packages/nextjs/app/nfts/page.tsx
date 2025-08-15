"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { NFTBox } from "./_components/NFTBox";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

// 定义NFT数据类型
interface NFTData {
  tokenId: number;
  projectId: number;
  rank: number;
  donationAmount: number;
  owner: string;
}

export default function NFTsPage() {
  const { address, isConnected } = useAccount();
  const [userNFTs, setUserNFTs] = useState<NFTData[]>([]);
  const [processedEvents, setProcessedEvents] = useState<string>("");

  // 获取合约部署信息
  const { data: deployedContract } = useDeployedContractInfo({ contractName: "Crowdfunding" });
  const fromBlock = deployedContract?.deployedOnBlock ?? 0n;

  // 监听NFT铸造事件
  const {
    data: nftMintEvents,
    isLoading,
    error,
  } = useScaffoldEventHistory({
    contractName: "Crowdfunding",
    eventName: "NFTMinted",
    fromBlock: BigInt(fromBlock as bigint),
    watch: false, // 关闭实时监听以避免无限循环
    filters: {
      recipient: address as `0x${string}`,
    },
  });

  // 获取用户NFT信息
  useEffect(() => {
    // 创建事件数据的唯一标识符，避免直接比较对象
    const eventsIdentifier = nftMintEvents
      ? nftMintEvents
          .map(
            event =>
              `${event.args.tokenId}-${event.args.id}-${event.args.rank}-${event.args.donationAmount}-${event.args.recipient}`,
          )
          .join("|")
      : "";

    // 只有当事件数据真正发生变化时才处理
    if (eventsIdentifier !== processedEvents) {
      setProcessedEvents(eventsIdentifier);

      if (nftMintEvents && nftMintEvents.length > 0) {
        const nfts = nftMintEvents
          .map(event => ({
            tokenId: Number(event.args.tokenId),
            projectId: Number(event.args.id),
            rank: Number(event.args.rank),
            donationAmount: Number(event.args.donationAmount),
            owner: event.args.recipient || "",
          }))
          .filter(nft => nft.owner !== ""); // 过滤掉没有所有者的NFT

        setUserNFTs(nfts);
      } else if (nftMintEvents) {
        // 如果nftMintEvents为空数组，确保userNFTs也是空数组
        setUserNFTs([]);
      }
    }
  }, [nftMintEvents, processedEvents]); // 依赖项包含事件数据标识符

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold">我的NFT收藏</h1>
      <div className="flex items-center gap-2 text-xl">
        <span>钱包地址:</span>
        <Address address={address} />
      </div>
    </div>
  );

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4">请连接钱包</h2>
          <p className="mb-4 text-xl">您需要连接钱包才能查看您的NFT收藏</p>
          <p className="text-lg text-gray-500">连接钱包后刷新页面</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {renderHeader()}
        <div className="text-center py-12">
          <span className="loading loading-spinner loading-lg"></span>
          <p className="mt-4 text-xl">正在加载NFT数据...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        {renderHeader()}
        <div className="alert alert-error">
          <span className="text-lg">加载NFT数据时出错: {error.message}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {renderHeader()}

      {userNFTs.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">暂无NFT收藏</h2>
          <p className="mb-4 text-xl text-gray-600">您还没有任何NFT。通过支持众筹项目可以获得独特的NFT奖励。</p>
          <div className="flex justify-center gap-4">
            <Link href="/projects" className="btn btn-primary text-lg">
              浏览项目
            </Link>
            <Link href="/" className="btn btn-secondary text-lg">
              返回主页
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {userNFTs.map(nft => (
            <NFTBox
              key={nft.tokenId}
              tokenId={nft.tokenId.toString()}
              projectId={nft.projectId.toString()}
              rank={nft.rank}
              donationAmount={nft.donationAmount.toString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
