const { nanoid } = require('nanoid');

// Generate reference code like AFM-PSI0
const generateReferenceCode = () => {
  const id = nanoid(4).toUpperCase();
  return `AFM-${id}`;
};

// Discount logic
// 1 game = 0% off, 2 games = 25% off, 3-4 games = 50% off
const getDiscount = (numGames) => {
  if (numGames === 1) return 0;
  if (numGames === 2) return 25;
  if (numGames >= 3) return 50;
  return 0;
};

const calculatePrice = (pricePerPlayer, numPlayers, numGames) => {
  const baseAmount = pricePerPlayer * numPlayers * numGames;
  const discountPercent = getDiscount(numGames);
  const discountAmount = (baseAmount * discountPercent) / 100;
  const totalAmount = baseAmount - discountAmount;

  return {
    baseAmount,
    discountPercent,
    discountAmount,
    totalAmount,
  };
};

// Format phone to E.164 (+251...)
const formatPhone = (phone) => {
  const cleaned = phone.replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('0')) return `+251${cleaned.slice(1)}`;
  if (cleaned.startsWith('251')) return `+${cleaned}`;
  return `+251${cleaned}`;
};

module.exports = {
  generateReferenceCode,
  getDiscount,
  calculatePrice,
  formatPhone,
};
