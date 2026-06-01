import { Link } from "react-router";
import { useCart } from "../../../contexts/CartContext";

const formatVND = (n: number) =>
  n.toLocaleString("vi-VN", { style: "currency", currency: "VND" });

interface RewardItem {
  productId: string;
  quantity: number;
  name: string;
  image?: string;
}

interface OrderSummaryProps {
  shippingFee?: number;
  shipOption?: string;
  discountAmount?: number;
  couponCode?: string;
  rewardProducts?: RewardItem[];
  ahamoveFee?: number | null;
  ahamoveLoading?: boolean;
}

export default function OrderSummary({ shippingFee, shipOption, discountAmount, couponCode, rewardProducts, ahamoveFee, ahamoveLoading }: OrderSummaryProps = {}) {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <div className="font-body border border-[#d9d9d9] bg-white p-6 text-center">
        <p style={{ fontSize: 13, color: "rgba(48,38,28,0.5)" }}>Giỏ hàng trống</p>
        <Link to="/menu" className="mt-3 inline-block text-cafe-primary underline" style={{ fontSize: 13 }}>
          Xem thực đơn
        </Link>
      </div>
    );
  }

  const subtotal = items.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 1), 0);
  const totalQty = items.reduce((s, i) => s + (i.quantity ?? 1), 0);
  const isPartner = shipOption === "partner";
  const isDynamic = isPartner && ahamoveFee == null && !ahamoveLoading;
  const fee = shippingFee ?? 0;
  const discount = discountAmount ?? 0;
  const total = isDynamic ? subtotal - discount : subtotal + fee - discount;

  return (
    <div className="font-body border border-[#d9d9d9] bg-white">
      <div className="flex items-center justify-between px-6 py-4 border-b border-cafe-accent">
        <span className="text-cafe-primary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: "2.5px", textTransform: "uppercase" }}>
          Đơn hàng của bạn
        </span>
        <span className="text-cafe-primary bg-cafe-accent" style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px" }}>
          ({totalQty})
        </span>
      </div>

      <div className="flex flex-col divide-y divide-[#f0ece5]">
        {items.map(item => (
          <div key={item.itemId} className="flex gap-4 px-6 py-4 items-start">
            <div className="shrink-0 w-[90px] h-[90px] border border-cafe-accent overflow-hidden bg-cafe-bg">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c9c9c9" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-cafe-primary" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>{item.name}</p>
              </div>
              <p style={{ fontSize: 11, color: "rgba(48,38,28,0.55)", marginTop: 3 }}>Size {item.size}</p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-cafe-primary bg-cafe-accent" style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px" }}>
                  ({item.quantity})
                </span>
                <span className="text-cafe-primary" style={{ fontSize: 12, fontWeight: 600 }}>
                  {formatVND((item.price ?? 0) * (item.quantity ?? 1))}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rewardProducts && rewardProducts.length > 0 && (
        <div className="border-t border-[#c8e6c9]">
          <div className="px-6 py-2 bg-[#f1f8f1]">
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase", color: "#5a8a5a" }}>Tặng kèm</span>
          </div>
          {rewardProducts.map((rp) => (
            <div key={rp.productId} className="flex gap-4 px-6 py-3 items-center bg-[#f9fcf9]">
              <div className="shrink-0 w-[60px] h-[60px] border border-[#c8e6c9] overflow-hidden bg-white flex items-center justify-center">
                {rp.image ? (
                  <img src={rp.image} alt={rp.name} className="w-full h-full object-cover" />
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a5c8a5" strokeWidth="1.5">
                    <path d="M20 12v10H4V12M22 7H2v5h20V7zM12 22V7M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 12, fontWeight: 600, color: "#3a6a3a", lineHeight: 1.4 }}>{rp.name}</p>
                <p style={{ fontSize: 11, color: "#5a8a5a", marginTop: 2 }}>Miễn phí · số lượng {rp.quantity}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#5a8a5a", background: "#c8e6c9", padding: "2px 8px" }}>TẶNG</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 pt-4 pb-5 flex flex-col gap-2 border-t border-cafe-accent">
        <div className="flex justify-between">
          <span style={{ fontSize: 12, color: "rgba(48,38,28,0.65)" }}>Tạm tính</span>
          <span className="text-cafe-primary" style={{ fontSize: 12, fontWeight: 600 }}>{formatVND(subtotal)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span style={{ fontSize: 12, color: "rgba(48,38,28,0.65)" }}>Phí vận chuyển</span>
          {shipOption === undefined ? (
            <span style={{ fontSize: 11, color: "rgba(48,38,28,0.45)", fontStyle: "italic" }}>Tính ở bước tiếp theo</span>
          ) : isPartner && ahamoveLoading ? (
            <span className="flex items-center gap-1" style={{ fontSize: 11, color: "rgba(48,38,28,0.45)" }}>
              <span className="w-3 h-3 border border-cafe-primary border-t-transparent rounded-full animate-spin inline-block" />
              Đang tính...
            </span>
          ) : isPartner && ahamoveFee !== null && ahamoveFee !== undefined ? (
            <span className="text-cafe-primary" style={{ fontSize: 12, fontWeight: 600 }}>+{formatVND(ahamoveFee)}</span>
          ) : isDynamic ? (
            <span style={{ fontSize: 11, color: "rgba(48,38,28,0.45)", fontStyle: "italic" }}>Tính theo khoảng cách</span>
          ) : fee === 0 ? (
            <span style={{ fontSize: 12, color: "#5a8a5a", fontWeight: 600 }}>Miễn phí</span>
          ) : (
            <span className="text-cafe-primary" style={{ fontSize: 12, fontWeight: 600 }}>+{formatVND(fee)}</span>
          )}
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <span style={{ fontSize: 12, color: "#5a8a5a" }}>Giảm giá{couponCode ? ` (${couponCode})` : ""}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#5a8a5a" }}>−{formatVND(discount)}</span>
          </div>
        )}
        <div className="h-px bg-cafe-accent my-2" />
        <div className="flex justify-between items-center">
          <span className="text-cafe-primary" style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.5px" }}>Tổng cộng</span>
          {isPartner && ahamoveLoading ? (
            <span style={{ fontSize: 11, color: "rgba(48,38,28,0.45)", fontStyle: "italic" }}>Đang tính...</span>
          ) : isDynamic ? (
            <span style={{ fontSize: 11, color: "rgba(48,38,28,0.45)", fontStyle: "italic" }}>Tính theo khoảng cách</span>
          ) : (
            <span className="text-cafe-primary" style={{ fontSize: 13, fontWeight: 700 }}>{formatVND(total)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
