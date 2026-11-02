import axiosClient from "./axiosClient";

export async function getStatsSummary() {
  return axiosClient.get("/api/stats/summary");
}

export async function getRevenueLast7Days() {
  return axiosClient.get("/api/stats/revenue/last-7-days");
}

export async function getRevenueByDateRange(
  startDate?: string,
  endDate?: string,
) {
  return axiosClient.get("/api/stats/revenue", {
    params: {
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    },
  });
}
