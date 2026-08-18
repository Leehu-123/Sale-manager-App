/**
 * Tính toán giá kính dựa trên thông số kỹ thuật (CPQ Engine)
 * @param {Object} spec - Thông số kỹ thuật { width, height, quantity, thickness, type } (width, height in mm)
 * @param {Object} pricingConfig - Cấu hình giá { basePrice, baseWasteRatio }
 * @param {String} customerTier - Hạng khách hàng (PLATINUM, GOLD, SILVER, BRONZE, STANDARD)
 * @returns {Object} - { area, waste, finalPrice }
 */
export function calculateGlassPrice(spec, pricingConfig, customerTier) {
  const { width = 0, height = 0, quantity = 0 } = spec;
  const { basePrice = 0, baseWasteRatio = 0 } = pricingConfig || {};

  // Tính diện tích (m2) = (width * height * quantity) / 1,000,000
  const area = (width * height * quantity) / 1000000;

  // Tính tỷ lệ hao hụt
  let wasteRatio = baseWasteRatio;
  if (width > 2440 || height > 3660) {
    wasteRatio += 0.10; // Thêm 10% nếu quá khổ
  }

  // Tính waste (m2)
  const waste = area * wasteRatio;
  
  // Tính tổng diện tích tính tiền
  const totalAreaToCharge = area + waste;

  // Tính chiết khấu theo hạng khách hàng
  let tierDiscount = 0;
  switch (customerTier) {
    case 'PLATINUM':
      tierDiscount = 0.15; // 15%
      break;
    case 'GOLD':
      tierDiscount = 0.10; // 10%
      break;
    case 'SILVER':
      tierDiscount = 0.05; // 5%
      break;
    case 'BRONZE':
      tierDiscount = 0.02; // 2%
      break;
    default:
      tierDiscount = 0;
  }

  // Tính giá cuối cùng
  const grossPrice = totalAreaToCharge * basePrice;
  const finalPrice = grossPrice * (1 - tierDiscount);

  return {
    area,
    waste,
    finalPrice,
  };
}
