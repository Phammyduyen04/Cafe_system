import HeroSection from "./home/HeroSection";
import ProductsCarousel from "./home/ProductsCarousel";
import CoffeeBeansBanner from "./home/CoffeeBeansBanner";
import TestimonialsSection from "./home/TestimonialsSection";
import NewsletterSection from "./home/NewsletterSection";
import {
  PRODUCT_LUNGO,
  PRODUCT_ESPRESSO,
  PRODUCT_LATTE,
  PRODUCT_CAPPUCCINO,
  PRODUCT_TIRAMISU,
  PRODUCT_CROISSANT,
  PRODUCT_CHEESECAKE,
  PRODUCT_MACARON,
} from "../../constants/images";

const coffeeProducts = [
  { img: PRODUCT_LUNGO, name: "Cà phê Lungo", desc: "Hương vị đậm đà, pha chế từ hạt cà phê Arabica thượng hạng, thơm ngon khó cưỡng.", price: "45.000 ₫", slug: "ca-phe-lungo" },
  { img: PRODUCT_ESPRESSO, name: "Cà phê Espresso", desc: "Đậm đặc và mạnh mẽ, được ép từ hạt cà phê rang vừa, mang lại cảm giác tỉnh táo tức thì.", price: "40.000 ₫", slug: "ca-phe-espresso" },
  { img: PRODUCT_LATTE, name: "Cà phê Latte", desc: "Sự kết hợp hoàn hảo giữa espresso và sữa tươi béo ngậy, nhẹ nhàng và thơm ngon.", price: "55.000 ₫", slug: "ca-phe-latte" },
  { img: PRODUCT_CAPPUCCINO, name: "Cà phê Cappuccino", desc: "Lớp bọt sữa mịn màng phủ trên nền espresso đậm đà, tạo nên hương vị cân bằng tuyệt hảo.", price: "55.000 ₫", slug: "ca-phe-latte" },
];

const dessertProducts = [
  { img: PRODUCT_TIRAMISU, name: "Bánh Tiramisu", desc: "Bánh Tiramisu mềm mịn thấm đẫm cà phê Espresso, hòa quyện cùng kem phô mai béo ngậy.", price: "65.000 ₫" },
  { img: PRODUCT_CROISSANT, name: "Bánh Croissant", desc: "Croissant giòn rụm lớp ngoài, mềm xốp bên trong, nướng tươi mỗi ngày từ bột mì nguyên chất.", price: "45.000 ₫" },
  { img: PRODUCT_CHEESECAKE, name: "Cheesecake Cà Phê", desc: "Cheesecake mịn béo kết hợp cùng lớp cà phê phủ trên, tạo nên hương vị độc đáo và quyến rũ.", price: "70.000 ₫" },
  { img: PRODUCT_MACARON, name: "Bánh Macaron", desc: "Macaron nhân kem cà phê thơm ngát, vỏ ngoài giòn nhẹ tan trong miệng, màu sắc bắt mắt.", price: "35.000 ₫" },
];

export default function HomeContent() {
  return (
    <>
      <HeroSection />
      <ProductsCarousel title="Cà phê đặc biệt" products={coffeeProducts} />
      <ProductsCarousel title="Tráng miệng đặc biệt" products={dessertProducts} />
      <CoffeeBeansBanner />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
