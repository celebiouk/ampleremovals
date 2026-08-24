/**
 * Conditional "please prepare" blocks for the day-before-move EMAIL only.
 * Shown based on what the customer did NOT book:
 *  - No dismantling  → ask them to take apart big items (or tell us in advance).
 *  - No packing      → ask them to box everything up, and empty fridges/freezers
 *                      and drawers/chests so we move those empty.
 * If they DID book the service, we handle it — so the block is omitted.
 */
export function preMovePrepTipsHtml(
  extras: { packing_services?: boolean | null; disassemble_furniture?: boolean | null } | null | undefined,
): string {
  const blocks: string[] = [];

  if (!extras?.disassemble_furniture) {
    blocks.push(`
      <div style="background:#f5f3ff;border-left:4px solid #6b21a8;padding:20px;margin:24px 0;border-radius:4px">
        <p style="margin:0 0 8px 0;font-weight:bold;color:#5b21b6;font-size:16px">🛠️ Dismantling — a quick heads-up</p>
        <p style="margin:0;color:#4c1d95;font-size:14px;line-height:1.7">
          Your booking doesn't include dismantling, so where you can, please take larger items apart before we arrive — <strong>beds</strong> and <strong>wardrobes with more than 2 doors</strong> — so we can load quickly and safely.
          If you'd like <strong>us</strong> to dismantle (and reassemble) for you instead, just let us know <strong>before your move date</strong> so the team turns up with the right tools and time set aside.
        </p>
      </div>`);
  }

  if (!extras?.packing_services) {
    blocks.push(`
      <div style="background:#fffbeb;border-left:4px solid #f59e0b;padding:20px;margin:24px 0;border-radius:4px">
        <p style="margin:0 0 8px 0;font-weight:bold;color:#92400e;font-size:16px">📦 Packing — please have everything boxed up</p>
        <p style="margin:0 0 12px 0;color:#78350f;font-size:14px;line-height:1.7">
          As packing isn't part of your booking, please make sure <strong>everything is fully packed into boxes and bags</strong> before we arrive — our team will be there to <strong>load, transport and offload</strong> only.
        </p>
        <p style="margin:0;color:#78350f;font-size:14px;line-height:1.7">
          Please also <strong>empty your fridge and freezer</strong>, and <strong>remove items from drawers and chests</strong> — we move these <strong>empty</strong> so they (and your belongings) are far better protected in transit.
        </p>
      </div>`);
  }

  return blocks.join("");
}
