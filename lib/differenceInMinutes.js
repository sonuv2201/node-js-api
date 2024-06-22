export function differenceInMinutes(date1, date2) {
  // Convert both dates to their timestamp values (in milliseconds)
  const timestamp1 = date1.getTime();
  const timestamp2 = date2.getTime();

  // Calculate the difference in milliseconds
  const differenceInMilliseconds = Math.abs(timestamp1 - timestamp2);

  // Convert the difference from milliseconds to minutes
  const differenceInMinutes = Math.floor(
    differenceInMilliseconds / (1000 * 60)
  );

  return differenceInMinutes;
}
