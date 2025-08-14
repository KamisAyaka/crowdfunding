export interface Project {
  id: number;
  name: string;
  description: string;
  goal: bigint;
  raised: bigint;
  totalAmount: bigint;
  deadline: string;
  creator: string;
  owner?: string;
  status: "live" | "successful" | "failed";
  completed?: boolean;
  successful?: boolean;
  failed?: boolean;
  totalWithdrawn?: number;
  allowence?: bigint;
}

export interface Donation {
  address: string;
  totalAmount: number;
  donationCount: number;
}
