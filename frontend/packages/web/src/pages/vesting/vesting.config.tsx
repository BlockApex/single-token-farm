import { addMilliseconds, isBefore } from "date-fns";
import { getUTCDate } from "@near/ts";
import { Vesting } from "@/stores/vesting-store";

export function useFilter(filter: string | null, vestings: Vesting[]) {
  if (!filter) {
    return vestings;
  }

  return vestings.filter(({ start_timestamp, vesting_duration }) => {
    const created = getUTCDate(Number(start_timestamp) / 1000000);

    const endAt = addMilliseconds(created, Number(vesting_duration) / 1000000);

    const today = getUTCDate();

    if (filter === "complete") {
      return isBefore(endAt, today);
    }

    if (filter === "runing") {
      return isBefore(today, endAt);
    }

    return false;
  });
}

export default useFilter;
