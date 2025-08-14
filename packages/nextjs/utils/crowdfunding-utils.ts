/**
 * 格式化ETH金额显示
 * @param amount 金额（单位为wei）
 * @param decimals 小数位数，默认为4
 * @returns 格式化后的字符串
 */
export const formatEthAmount = (amount: number | bigint, decimals: number = 4): string => {
  const amountInEth = Number(amount) / 1e18;
  return amountInEth.toFixed(decimals);
};

/**
 * 格式化ETH金额显示（固定2位小数）
 * @param amount 金额（单位为wei）
 * @returns 格式化后的字符串
 */
export const formatEthAmountFixed2 = (amount: number | bigint): string => {
  return formatEthAmount(amount, 2);
};

/**
 * 格式化时间戳为日期字符串
 * @param timestamp 时间戳（秒）
 * @returns 格式化后的日期字符串
 */
export const formatTimestampToDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString();
};

/**
 * 计算提案投票结果
 * @param proposalVotes 提案投票事件数组
 * @returns 包含赞成票和反对票数量的对象
 */
export const calculateProposalVotes = (proposalVotes: any[] = []) => {
  // 计算赞成票
  const votesFor = proposalVotes
    .filter(vote => vote.args.support)
    .reduce((sum, vote) => sum + BigInt(vote.args.amount || 0), 0n);

  // 计算反对票
  const votesAgainst = proposalVotes
    .filter(vote => !vote.args.support)
    .reduce((sum, vote) => sum + BigInt(vote.args.amount || 0), 0n);

  return {
    votesFor: Number(votesFor),
    votesAgainst: Number(votesAgainst),
  };
};

/**
 * 计算提案执行状态
 * @param executedEvent 提案执行事件
 * @returns 包含执行状态和是否通过的对象
 */
export const calculateProposalStatus = (executedEvent: any) => {
  const isExecuted = !!executedEvent;
  const isPassed = executedEvent ? Boolean(executedEvent.args.passed) : false;

  return {
    isExecuted,
    isPassed,
  };
};
