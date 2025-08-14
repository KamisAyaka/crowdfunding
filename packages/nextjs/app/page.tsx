"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">欢迎来到</span>
            <span className="block text-4xl font-bold">区块链众筹平台</span>
          </h1>

          {!isConnected ? (
            <div className="flex justify-center items-center space-x-2 flex-col mt-8">
              <p className="my-2 font-medium">请连接您的钱包以开始使用</p>
            </div>
          ) : (
            <div className="flex justify-center items-center space-x-2 flex-col mt-8">
              <p className="my-2 font-medium">已连接地址:</p>
              <Address address={connectedAddress} />
            </div>
          )}

          <p className="text-center text-lg mt-8">基于区块链的去中心化众筹平台</p>
        </div>

        {
          <div className="grow bg-base-300 w-full mt-16 px-8 py-12">
            <div className="flex justify-center items-center">
              <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-2xl rounded-3xl">
                <h2 className="text-2xl font-bold mb-4">关于我们的平台</h2>
                <p className="mb-4">
                  这是一个基于区块链的去中心化众筹平台，让创意和资金直接对接， 无需中介机构，透明、安全、高效。
                </p>
                <ul className="text-left list-disc pl-5 space-y-2">
                  <li>去中心化治理 - 通过提案系统进行项目决策</li>
                  <li>透明可追溯 - 所有交易记录在区块链上公开可查</li>
                  <li>安全可靠 - 基于智能合约自动执行，无需信任第三方</li>
                  <li>NFT奖励 - 支持者将获得独特的NFT作为贡献证明</li>
                </ul>
              </div>
            </div>
          </div>
        }
      </div>
    </>
  );
};

export default Home;
