import { Address } from "~~/components/scaffold-eth";

interface TopDonor {
  address: string;
  totalAmount: number;
  donationCount: number;
}

interface DonationLeaderboardProps {
  topFiveDonors: TopDonor[];
}

export function DonationLeaderboard({ topFiveDonors }: DonationLeaderboardProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">捐赠者排行榜 (前五名)</h2>
        {topFiveDonors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>排名</th>
                  <th>捐赠者</th>
                  <th>捐赠总额</th>
                  <th>捐赠次数</th>
                </tr>
              </thead>
              <tbody>
                {topFiveDonors.map((donor, index) => (
                  <tr key={donor.address} className={index < 3 ? "text-primary font-bold" : ""}>
                    <td>
                      {index === 0 && "🥇"}
                      {index === 1 && "🥈"}
                      {index === 2 && "🥉"}
                      {index > 2 && `#${index + 1}`}
                    </td>
                    <td>
                      <Address address={donor.address} />
                    </td>
                    <td>{(donor.totalAmount / 1e18).toFixed(4)} ETH</td>
                    <td>{donor.donationCount} 次</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">还没有收到捐赠，成为第一个支持者吧！</div>
        )}
      </div>
    </div>
  );
}
