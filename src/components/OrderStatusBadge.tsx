import { ORDER_STATUS_LABELS, type OrderStatus } from "@/domain/order";

const STATUS_STYLE: Record<OrderStatus, string> = {
  received: "border-line text-muted",
  in_production: "border-brand/50 text-brand",
  ready_for_pickup: "border-steel/60 text-steel",
  collected: "border-line text-faint",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
