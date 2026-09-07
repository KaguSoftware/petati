import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatMoney } from "@/lib/money";
import type { Totals } from "@/lib/checkout/totals";

interface Props {
  storeName: string;
  orderNumber: string;
  orderUrl: string;
  locale: string;
  currency: string;
  lines: { name: string; variant: string | null; qty: number; total: number }[];
  totals: Totals;
}

const copy: Record<string, { title: string; thanks: string; view: string; total: string; shipping: string; discount: string }> = {
  en: { title: "Order confirmed", thanks: "Thank you for your order. We will contact you to arrange payment and delivery.", view: "View order", total: "Total", shipping: "Shipping", discount: "Discount" },
  tr: { title: "Sipariş alındı", thanks: "Siparişiniz için teşekkürler. Ödeme ve teslimat için sizinle iletişime geçeceğiz.", view: "Siparişi görüntüle", total: "Toplam", shipping: "Kargo", discount: "İndirim" },
  fa: { title: "سفارش ثبت شد", thanks: "از سفارش شما متشکریم. برای هماهنگی پرداخت و ارسال با شما تماس می‌گیریم.", view: "مشاهده سفارش", total: "جمع کل", shipping: "هزینه ارسال", discount: "تخفیف" },
};

export function OrderConfirmationEmail(p: Props) {
  const c = copy[p.locale] ?? copy.en;
  const dir = p.locale === "fa" ? "rtl" : "ltr";
  const money = (n: number) => formatMoney(n, p.currency, p.locale);
  return (
    <Html lang={p.locale} dir={dir}>
      <Head />
      <Preview>{`${c.title} · ${p.orderNumber}`}</Preview>
      <Body style={{ fontFamily: "Arial, sans-serif", backgroundColor: "#f6f6f6", margin: 0 }}>
        <Container style={{ backgroundColor: "#ffffff", padding: 24, maxWidth: 560 }}>
          <Heading as="h2">{p.storeName}</Heading>
          <Text style={{ fontSize: 18, fontWeight: 600 }}>
            {c.title} · {p.orderNumber}
          </Text>
          <Text>{c.thanks}</Text>
          <Hr />
          <Section>
            {p.lines.map((l, i) => (
              <Text key={i} style={{ margin: "4px 0" }}>
                {l.qty} × {l.name}
                {l.variant ? ` (${l.variant})` : ""} — {money(l.total)}
              </Text>
            ))}
          </Section>
          <Hr />
          {p.totals.discount > 0 && (
            <Text>
              {c.discount}: −{money(p.totals.discount)}
            </Text>
          )}
          <Text>
            {c.shipping}: {money(p.totals.shipping)}
          </Text>
          <Text style={{ fontWeight: 700 }}>
            {c.total}: {money(p.totals.total)}
          </Text>
          <Button
            href={p.orderUrl}
            style={{ backgroundColor: "#111111", color: "#ffffff", padding: "10px 18px", borderRadius: 6 }}
          >
            {c.view}
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderConfirmationEmail;
