import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";
import type { OrderStatus } from "@/lib/db/types";

interface Props {
  storeName: string;
  orderNumber: string;
  orderUrl: string;
  locale: string;
  status: OrderStatus;
  trackingNumber?: string | null;
  /** Shown on the shipped mail so the customer has it at the door. */
  deliveryCode?: string | null;
  trackingUrl?: string | null;
}

type Copy = { view: string; tracking: string; track: string; code?: string } & Partial<Record<OrderStatus, { title: string; body: string }>>;

const copy: Record<string, Copy> = {
  en: {
    view: "View order",
    tracking: "Tracking number",
    track: "Track shipment",
    code: "Delivery code",
    paid: { title: "Payment received", body: "Thank you, we have received your payment and will start preparing your order." },
    shipped: { title: "Your order is on its way", body: "Your order has been handed to the carrier." },
    delivered: { title: "Order delivered", body: "Your order has been delivered. We hope your pet loves it!" },
    cancelled: { title: "Order cancelled", body: "Your order has been cancelled. If you did not expect this, please contact us." },
  },
  tr: {
    view: "Siparişi görüntüle",
    tracking: "Takip numarası",
    track: "Kargoyu takip et",
    code: "Teslimat kodu",
    paid: { title: "Ödeme alındı", body: "Teşekkürler, ödemenizi aldık ve siparişinizi hazırlamaya başlıyoruz." },
    shipped: { title: "Siparişiniz yolda", body: "Siparişiniz kargoya teslim edildi." },
    delivered: { title: "Sipariş teslim edildi", body: "Siparişiniz teslim edildi. Umarız dostunuz çok sever!" },
    cancelled: { title: "Sipariş iptal edildi", body: "Siparişiniz iptal edildi. Beklemiyorsanız lütfen bizimle iletişime geçin." },
  },
  fa: {
    view: "مشاهده سفارش",
    tracking: "کد رهگیری",
    track: "پیگیری مرسوله",
    code: "کد تحویل",
    paid: { title: "پرداخت دریافت شد", body: "متشکریم، پرداخت شما را دریافت کردیم و آماده‌سازی سفارش را شروع می‌کنیم." },
    shipped: { title: "سفارش شما در راه است", body: "سفارش شما به شرکت حمل تحویل داده شد." },
    delivered: { title: "سفارش تحویل شد", body: "سفارش شما تحویل داده شد. امیدواریم حیوان خانگی‌تان دوستش داشته باشد!" },
    cancelled: { title: "سفارش لغو شد", body: "سفارش شما لغو شد. اگر انتظارش را نداشتید، لطفاً با ما تماس بگیرید." },
  },
};

export function OrderStatusEmail(p: Props) {
  const c = copy[p.locale] ?? copy.en;
  const s = c[p.status] ?? copy.en[p.status] ?? { title: p.status, body: "" };
  const dir = p.locale === "fa" ? "rtl" : "ltr";
  return (
    <Html lang={p.locale} dir={dir}>
      <Head />
      <Preview>{`${s.title} · ${p.orderNumber}`}</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6f6f6", margin: 0 }}>
        <Container style={{ backgroundColor: "#ffffff", padding: 24, maxWidth: 560 }}>
          <Heading as="h2">{p.storeName}</Heading>
          <Text style={{ fontSize: 18, fontWeight: 600 }}>
            {s.title} · {p.orderNumber}
          </Text>
          <Text>{s.body}</Text>
          {p.status === "shipped" && p.deliveryCode && (
            <Text style={{ textAlign: "center", border: "1px dashed #cccccc", borderRadius: 8, padding: 12 }}>
              {c.code}: <strong dir="ltr" style={{ fontSize: 22, letterSpacing: 4 }}>{p.deliveryCode}</strong>
            </Text>
          )}
          {p.status === "shipped" && p.trackingNumber && (
            <Text>
              {c.tracking}: <strong dir="ltr">{p.trackingNumber}</strong>
            </Text>
          )}
          <Hr />
          {p.status === "shipped" && p.trackingUrl && (
            <Button href={p.trackingUrl} style={{ backgroundColor: "#111", color: "#fff", padding: "10px 16px", borderRadius: 6, marginInlineEnd: 8 }}>
              {c.track}
            </Button>
          )}
          <Button href={p.orderUrl} style={{ backgroundColor: "#111", color: "#fff", padding: "10px 16px", borderRadius: 6 }}>
            {c.view}
          </Button>
        </Container>
      </Body>
    </Html>
  );
}
