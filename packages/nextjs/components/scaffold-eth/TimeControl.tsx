"use client";

import { useCallback, useEffect, useState } from "react";
import { hardhat } from "viem/chains";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { testClient } from "~~/hooks/scaffold-eth/useFetchBlocks";

// 预设时间增量选项
const TIME_PRESETS = [
  { label: "1小时", value: 3600 },
  { label: "1天", value: 86400 },
  { label: "1周", value: 604800 },
];

export const TimeControl = () => {
  const { targetNetwork } = useTargetNetwork();
  const [isLoading, setIsLoading] = useState(false);
  const [timeIncrease, setTimeIncrease] = useState(3600); // Default to 1 hour
  const [currentBlockTimestamp, setCurrentBlockTimestamp] = useState<bigint | null>(null);

  const fetchCurrentBlockTimestamp = useCallback(async () => {
    if (targetNetwork.id !== hardhat.id) return;
    try {
      setIsLoading(true);
      const block = await testClient.getBlock();
      setCurrentBlockTimestamp(block.timestamp);
    } catch (error) {
      console.error("Error fetching block timestamp:", error);
    } finally {
      setIsLoading(false);
    }
  }, [targetNetwork.id]);

  useEffect(() => {
    fetchCurrentBlockTimestamp();
  }, [targetNetwork.id, fetchCurrentBlockTimestamp]);

  const increaseTime = async () => {
    try {
      setIsLoading(true);
      // Increase time using evm_increaseTime
      await testClient.increaseTime({
        seconds: timeIncrease,
      });

      // Mine a new block to apply the time change
      await testClient.mine({
        blocks: 1,
      });

      // Refresh the current block timestamp
      await fetchCurrentBlockTimestamp();
    } catch (error) {
      console.error("Error increasing time:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeString = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  // 设置预设时间值
  const setPresetTime = (seconds: number) => {
    setTimeIncrease(seconds);
  };

  // Only show on Hardhat network
  if (targetNetwork.id !== hardhat.id) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-center justify-center bg-base-100 rounded-full px-4 py-2 shadow-md">
      <div className="flex items-center justify-center gap-1">
        <span className="text-sm font-bold">时间控制:</span>
        <button
          className={`btn btn-ghost btn-circle btn-xs ${isLoading ? "loading" : ""}`}
          onClick={fetchCurrentBlockTimestamp}
          disabled={isLoading}
        >
          <ArrowPathIcon className="h-3 w-3" />
        </button>
      </div>

      {currentBlockTimestamp && (
        <div className="text-xs font-mono bg-base-300 px-2 py-1 rounded">{getTimeString(currentBlockTimestamp)}</div>
      )}

      {/* 预设时间按钮 */}
      <div className="flex gap-1 flex-wrap justify-center">
        {TIME_PRESETS.map(preset => (
          <button
            key={preset.label}
            className="btn btn-xs btn-secondary"
            onClick={() => setPresetTime(preset.value)}
            disabled={isLoading}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex gap-1 items-center flex-nowrap">
        <input
          type="number"
          value={timeIncrease}
          onChange={e => setTimeIncrease(Number(e.target.value))}
          className="input input-bordered input-xs w-20"
          disabled={isLoading}
          min="1"
        />
        <button className="btn btn-primary btn-xs" onClick={increaseTime} disabled={isLoading}>
          {isLoading ? "增加中..." : "增加时间"}
        </button>
      </div>
    </div>
  );
};
