export const checkIsOpen = (
  openingTime: string,
  closingTime: string,
): boolean => {
  const now = new Date();
  const currMinutes = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMin] = openingTime.split(":").map(Number);
  const [closeHour, closeMin] = closingTime.split(":").map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (closeMinutes < openMinutes) {
    return currMinutes >= openMinutes || currMinutes < closeMinutes;
  }

  return currMinutes >= openMinutes && currMinutes < closeMinutes;
};
